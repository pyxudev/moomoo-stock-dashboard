from fastapi import APIRouter, HTTPException, Query
from services.moomoo_service import get_snapshot, get_kline

router = APIRouter(tags=["quote"])


@router.get("/quote/{code}")
def quote(code: str):
    try:
        snaps = get_snapshot([code])
        if not snaps:
            raise HTTPException(status_code=404, detail="Symbol not found")
        return snaps[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/quote/batch")
def quote_batch(codes: str = Query(..., description="comma-separated codes")):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    try:
        return get_snapshot(code_list)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/chart/{code}")
def chart(
    code: str,
    ktype: str = Query("daily", description="monthly | daily | 15min"),
    count: int = Query(365, ge=10, le=1000),
):
    try:
        data = get_kline(code, ktype=ktype, count=count)
        if not data:
            raise HTTPException(status_code=404, detail="No data")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
