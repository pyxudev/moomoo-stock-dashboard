from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, Text, create_engine
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, date

from config import settings

DATABASE_URL = f"sqlite:///{settings.db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), nullable=False)
    name = Column(String(100), nullable=True)
    cost_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    purchase_date = Column(Date, nullable=True)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False, default=10_000_000)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SimulationTrade(Base):
    __tablename__ = "simulation_trades"

    id = Column(Integer, primary_key=True, index=True)
    side = Column(String(4), nullable=False)  # buy / sell
    code = Column(String(10), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    import os
    os.makedirs(settings.db_path.rsplit("/", 1)[0], exist_ok=True)
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
