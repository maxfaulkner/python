from fastapi import APIRouter
import queries

router = APIRouter(prefix="/api")


@router.get("/manufacturers")
def get_manufacturers(series: str = "imsa", year: int = 0, session: str = "race") -> list[str]:
    return queries.get_manufacturers(series, year, session)


@router.get("/compare/manufacturers")
def compare_manufacturers(
    manufacturer: str,
    series: str = "imsa",
    year: int = 0,
    session: str = "race",
    class_normalized: str = "",
) -> list[dict]:
    names = [m.strip() for m in manufacturer.split(",") if m.strip()]
    return queries.compare_manufacturers(names, series, year, session, class_normalized)
