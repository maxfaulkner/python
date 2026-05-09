from fastapi import APIRouter
import queries

router = APIRouter(prefix="/api")


@router.get("/manufacturers")
def get_manufacturers(year: int, session: str) -> list[str]:
    return queries.get_manufacturers(year, session)


@router.get("/compare/manufacturers")
def compare_manufacturers(
    manufacturer: str,
    year: int,
    session: str,
    class_normalized: str,
) -> list[dict]:
    names = [m.strip() for m in manufacturer.split(",") if m.strip()]
    return queries.compare_manufacturers(names, year, session, class_normalized)
