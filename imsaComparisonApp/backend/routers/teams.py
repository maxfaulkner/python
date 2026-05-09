from fastapi import APIRouter, Query
import queries

router = APIRouter(prefix="/api")


@router.get("/teams")
def get_teams(
    series: str = "imsa",
    year: int = 0,
    session: str = "race",
    cls: str = Query(alias="class"),
) -> list[str]:
    return queries.get_teams(series, year, session, cls)


@router.get("/compare/teams")
def compare_teams(
    team: str,
    series: str = "imsa",
    year: int = 0,
    session: str = "race",
    cls: str = Query(alias="class"),
) -> list[dict]:
    names = [t.strip() for t in team.split(",") if t.strip()]
    return queries.compare_teams(names, series, year, session, cls)
