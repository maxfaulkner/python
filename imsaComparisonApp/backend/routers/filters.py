from fastapi import APIRouter
import queries

router = APIRouter(prefix="/api/filters")

_universe: dict | None = None


@router.get("")
def get_filters() -> dict:
    global _universe
    if _universe is None:
        _universe = queries.get_filter_universe()
    return _universe


@router.get("/events")
def get_events(year: int) -> list[str]:
    return queries.get_events(year)
