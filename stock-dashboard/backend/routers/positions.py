from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from database import get_db, Position
from services.moomoo_service import get_snapshot

router = APIRouter(prefix="/positions", tags=["positions"])


class PositionCreate(BaseModel):
    code: str
    name: Optional[str] = None
    cost_price: float
    quantity: int
    purchase_date: Optional[date] = None
    memo: Optional[str] = None


class PositionUpdate(BaseModel):
    cost_price: Optional[float] = None
    quantity: Optional[int] = None
    purchase_date: Optional[date] = None
    memo: Optional[str] = None


@router.get("")
def list_positions(db: Session = Depends(get_db)):
    positions = db.query(Position).order_by(Position.code, Position.id).all()
    if not positions:
        return {"positions": [], "summary": {}}

    codes = list({p.code for p in positions})
    try:
        snapshots = {s["code"]: s for s in get_snapshot(codes)}
    except Exception:
        snapshots = {}

    total_cost = 0.0
    total_value = 0.0
    result = []

    for p in positions:
        snap = snapshots.get(p.code, {})
        price = snap.get("price", 0.0)
        value = price * p.quantity
        cost = p.cost_price * p.quantity
        pnl = value - cost
        pnl_pct = (pnl / cost * 100) if cost else 0

        total_cost += cost
        total_value += value

        result.append({
            "id": p.id,
            "code": p.code,
            "name": snap.get("name") or p.name or p.code,
            "cost_price": p.cost_price,
            "quantity": p.quantity,
            "purchase_date": p.purchase_date.isoformat() if p.purchase_date else None,
            "memo": p.memo,
            "current_price": price,
            "value": value,
            "pnl": round(pnl, 0),
            "pnl_pct": round(pnl_pct, 2),
            "change": snap.get("change", 0),
            "change_rate": snap.get("change_rate", 0),
        })

    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0

    return {
        "positions": result,
        "summary": {
            "total_value": round(total_value, 0),
            "total_cost": round(total_cost, 0),
            "total_pnl": round(total_pnl, 0),
            "total_pnl_pct": round(total_pnl_pct, 2),
            "count": len({p.code for p in positions}),
        },
    }


@router.post("")
def create_position(body: PositionCreate, db: Session = Depends(get_db)):
    pos = Position(**body.model_dump())
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return {"id": pos.id}


@router.put("/{pos_id}")
def update_position(pos_id: int, body: PositionUpdate, db: Session = Depends(get_db)):
    pos = db.query(Position).filter(Position.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(pos, field, val)
    db.commit()
    return {"ok": True}


@router.delete("/{pos_id}")
def delete_position(pos_id: int, db: Session = Depends(get_db)):
    pos = db.query(Position).filter(Position.id == pos_id).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(pos)
    db.commit()
    return {"ok": True}
