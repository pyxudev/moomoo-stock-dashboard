from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Position
from services.moomoo_service import get_snapshot

router = APIRouter(tags=["summary"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    positions = db.query(Position).all()
    if not positions:
        return {
            "total_value": 0,
            "total_pnl": 0,
            "total_pnl_pct": 0,
            "stock_count": 0,
        }

    codes = list({p.code for p in positions})
    try:
        snapshots = {s["code"]: s for s in get_snapshot(codes)}
    except Exception:
        snapshots = {}

    total_cost = sum(p.cost_price * p.quantity for p in positions)
    total_value = sum(
        snapshots.get(p.code, {}).get("price", p.cost_price) * p.quantity
        for p in positions
    )
    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0

    return {
        "total_value": round(total_value, 0),
        "total_pnl": round(total_pnl, 0),
        "total_pnl_pct": round(total_pnl_pct, 2),
        "stock_count": len({p.code for p in positions}),
    }
