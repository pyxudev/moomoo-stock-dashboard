from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db, SimulationState, SimulationTrade
from config import settings

router = APIRouter(prefix="/simulation", tags=["simulation"])


def _get_or_create_state(db: Session) -> SimulationState:
    state = db.query(SimulationState).first()
    if not state:
        state = SimulationState(balance=settings.initial_simulation_money)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


@router.get("")
def get_simulation(db: Session = Depends(get_db)):
    state = _get_or_create_state(db)
    trades = (
        db.query(SimulationTrade)
        .order_by(SimulationTrade.executed_at.desc())
        .limit(50)
        .all()
    )
    return {
        "balance": state.balance,
        "initial": settings.initial_simulation_money,
        "trades": [
            {
                "id": t.id,
                "side": t.side,
                "code": t.code,
                "price": t.price,
                "quantity": t.quantity,
                "total": t.total,
                "executed_at": t.executed_at.isoformat(),
            }
            for t in trades
        ],
    }


class TradeOrder(BaseModel):
    code: str
    price: float
    quantity: int
    side: str  # buy / sell


@router.post("/buy")
def buy(order: TradeOrder, db: Session = Depends(get_db)):
    order.side = "buy"
    return _execute(order, db)


@router.post("/sell")
def sell(order: TradeOrder, db: Session = Depends(get_db)):
    order.side = "sell"
    return _execute(order, db)


def _execute(order: TradeOrder, db: Session):
    if order.price <= 0 or order.quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid price or quantity")

    state = _get_or_create_state(db)
    total = order.price * order.quantity

    if order.side == "buy":
        if state.balance < total:
            raise HTTPException(status_code=400, detail="残高不足")
        state.balance -= total
    else:
        state.balance += total

    trade = SimulationTrade(
        side=order.side,
        code=order.code,
        price=order.price,
        quantity=order.quantity,
        total=total,
        executed_at=datetime.utcnow(),
    )
    db.add(trade)
    db.commit()
    return {"balance": state.balance, "total": total}


@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    db.query(SimulationTrade).delete()
    state = _get_or_create_state(db)
    state.balance = settings.initial_simulation_money
    db.commit()
    return {"balance": state.balance}
