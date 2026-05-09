from fastapi import APIRouter, Query
import queries

router = APIRouter(prefix="/api")


@router.get("/teams")
def get_teams(year: int, session: str, cls: str = Query(alias="class")) -> list[str]:
    return queries.get_teams(year, session, cls)


@router.get("/compare/teams")
def compare_teams(
    team: str,
    year: int,
    session: str,
    cls: str = Query(alias="class"),
) -> list[dict]:
    names = [t.strip() for t in team.split(",") if t.strip()]
    return queries.compare_teams(names, year, session, cls)
