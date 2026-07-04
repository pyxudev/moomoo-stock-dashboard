import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import watchlist, quote, positions, simulation, summary
from services.moomoo_service import get_snapshot


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="株式分析ダッシュボード API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(watchlist.router)
app.include_router(quote.router)
app.include_router(positions.router)
app.include_router(simulation.router)
app.include_router(summary.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ─── WebSocket: リアルタイム価格配信 ────────────────────────────────────────


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, codes: list[str]):
        await ws.accept()
        key = ",".join(sorted(codes))
        self.connections.setdefault(key, []).append(ws)

    def disconnect(self, ws: WebSocket):
        for key, wss in list(self.connections.items()):
            if ws in wss:
                wss.remove(ws)
                if not wss:
                    del self.connections[key]

    async def broadcast(self, codes: list[str], data: list[dict]):
        key = ",".join(sorted(codes))
        dead = []
        for ws in self.connections.get(key, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws/quotes")
async def ws_quotes(websocket: WebSocket, codes: str = ""):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    if not code_list:
        await websocket.close()
        return

    await manager.connect(websocket, code_list)
    try:
        while True:
            try:
                snaps = get_snapshot(code_list)
                await websocket.send_text(json.dumps(snaps))
            except Exception:
                pass
            await asyncio.sleep(settings.ws_refresh_interval / 1000)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
