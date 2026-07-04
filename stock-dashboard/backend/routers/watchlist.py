from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, Watchlist
from services.moomoo_service import get_snapshot, search_stock

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


class WatchlistAdd(BaseModel):
    code: str
    name: str | None = None


@router.get("")
def list_watchlist(db: Session = Depends(get_db)):
    items = db.query(Watchlist).order_by(Watchlist.id).all()
    codes = [i.code for i in items]

    # スナップショット取得
    if codes:
        try:
            snapshots = {s["code"]: s for s in get_snapshot(codes)}
        except Exception:
            snapshots = {}
    else:
        snapshots = {}

    result = []
    for item in items:
        snap = snapshots.get(item.code, {})
        result.append({
            "id": item.id,
            "code": item.code,
            "name": snap.get("name") or item.name or item.code,
            "price": snap.get("price", 0),
            "change": snap.get("change", 0),
            "change_rate": snap.get("change_rate", 0),
        })
    return result


@router.post("")
def add_watchlist(body: WatchlistAdd, db: Session = Depends(get_db)):
    existing = db.query(Watchlist).filter(Watchlist.code == body.code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already registered")
    item = Watchlist(code=body.code, name=body.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "code": item.code, "name": item.name}


@router.delete("/{item_id}")
def delete_watchlist(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Watchlist).filter(Watchlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.get("/search")
def search_watchlist(q: str):
    try:
        return search_stock(q)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
