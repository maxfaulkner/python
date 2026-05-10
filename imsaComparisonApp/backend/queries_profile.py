import statistics
from db import get_conn


def _pct_rank_score(conn, sql: str, params: list) -> float | None:
    row = conn.execute(sql, params).fetchone()
    if row is None or row[0] is None:
        return None
    return round(float(row[0]) * 100, 1)


def driver_fingerprint(driver_id: str, cls: str, series: str) -> dict:
    conn = get_conn()
    sc_clause = "AND (flags IS NULL OR flags NOT IN ('FCY', 'SF'))"

    # Qualifying pace: PERCENT_RANK where lower lap_time = higher rank
    qual_score = _pct_rank_score(conn, f"""
        WITH medians AS (
            SELECT driver_id, MEDIAN(lap_time) as med
            FROM laps
            WHERE series_code = ? AND class = ? AND session ILIKE '%qual%'
              AND lap_time > 0 {sc_clause}
            GROUP BY driver_id HAVING COUNT(*) >= 3
        ),
        ranked AS (
            SELECT driver_id, PERCENT_RANK() OVER (ORDER BY med DESC) as pct
            FROM medians
        )
        SELECT pct FROM ranked WHERE driver_id = ?
    """, [series, cls, driver_id])

    # Race pace
    race_score = _pct_rank_score(conn, f"""
        WITH medians AS (
            SELECT driver_id, MEDIAN(lap_time) as med
            FROM laps
            WHERE series_code = ? AND class = ? AND session ILIKE '%race%'
              AND lap_time > 0 {sc_clause}
            GROUP BY driver_id HAVING COUNT(*) >= 20
        ),
        ranked AS (
            SELECT driver_id, PERCENT_RANK() OVER (ORDER BY med DESC) as pct
            FROM medians
        )
        SELECT pct FROM ranked WHERE driver_id = ?
    """, [series, cls, driver_id])

    # Wet pace (null if driver has <20 wet laps)
    wet_count = conn.execute(
        f"SELECT COUNT(*) FROM laps WHERE series_code=? AND class=? AND driver_id=? AND raining=TRUE AND lap_time>0 {sc_clause}",
        [series, cls, driver_id]
    ).fetchone()[0]
    if wet_count >= 20:
        wet_score = _pct_rank_score(conn, f"""
            WITH medians AS (
                SELECT driver_id, MEDIAN(lap_time) as med
                FROM laps
                WHERE series_code=? AND class=? AND raining=TRUE AND lap_time>0 {sc_clause}
                GROUP BY driver_id HAVING COUNT(*) >= 20
            ),
            ranked AS (
                SELECT driver_id, PERCENT_RANK() OVER (ORDER BY med DESC) as pct FROM medians
            )
            SELECT pct FROM ranked WHERE driver_id=?
        """, [series, cls, driver_id])
    else:
        wet_score = None

    # Consistency: lower stddev = higher score
    consistency_score = _pct_rank_score(conn, f"""
        WITH stddevs AS (
            SELECT driver_id, STDDEV(lap_time) as sd
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%race%'
              AND lap_time>0 {sc_clause}
            GROUP BY driver_id HAVING COUNT(*) >= 20
        ),
        ranked AS (
            SELECT driver_id, PERCENT_RANK() OVER (ORDER BY sd ASC) as pct FROM stddevs
        )
        SELECT pct FROM ranked WHERE driver_id=?
    """, [series, cls, driver_id])

    # Tire management: pace in late vs early stints, relative to field
    tire_row = conn.execute(f"""
        WITH stint_pace AS (
            SELECT driver_id,
                   AVG(CASE WHEN stint_lap <= 3 THEN lap_time END) as early,
                   AVG(CASE WHEN stint_lap >= 8 THEN lap_time END) as late
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%race%'
              AND lap_time>0 {sc_clause} AND stint_lap IS NOT NULL
            GROUP BY driver_id HAVING COUNT(*) >= 20
        ),
        deltas AS (
            SELECT driver_id, (late - early) / early as deg_pct
            FROM stint_pace WHERE early IS NOT NULL AND late IS NOT NULL
        ),
        ranked AS (
            SELECT driver_id, PERCENT_RANK() OVER (ORDER BY deg_pct ASC) as pct FROM deltas
        )
        SELECT pct FROM ranked WHERE driver_id=?
    """, [series, cls, driver_id]).fetchone()
    tire_score = round(float(tire_row[0]) * 100, 1) if tire_row and tire_row[0] is not None else None

    # Quali→Race delta
    qr_row = conn.execute(f"""
        WITH qual_ranks AS (
            SELECT driver_id,
                   RANK() OVER (ORDER BY MEDIAN(lap_time)) as q_rank
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%qual%' AND lap_time>0 {sc_clause}
            GROUP BY driver_id HAVING COUNT(*) >= 3
        ),
        race_ranks AS (
            SELECT driver_id,
                   RANK() OVER (ORDER BY MEDIAN(lap_time)) as r_rank
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%race%' AND lap_time>0 {sc_clause}
            GROUP BY driver_id HAVING COUNT(*) >= 20
        ),
        deltas AS (
            SELECT q.driver_id, (q.q_rank - r.r_rank) as delta
            FROM qual_ranks q JOIN race_ranks r ON q.driver_id = r.driver_id
        ),
        ranked AS (
            SELECT driver_id, PERCENT_RANK() OVER (ORDER BY delta DESC) as pct FROM deltas
        )
        SELECT pct FROM ranked WHERE driver_id=?
    """, [series, cls, series, cls, driver_id]).fetchone()
    qr_score = round(float(qr_row[0]) * 100, 1) if qr_row and qr_row[0] is not None else None

    return {
        "qualifying_pace": qual_score,
        "race_pace": race_score,
        "wet_pace": wet_score,
        "consistency": consistency_score,
        "tire_management": tire_score,
        "quali_race_delta": qr_score,
    }


def driver_career_arc(driver_id: str, cls: str, series: str) -> list[dict]:
    sc = "AND (flags IS NULL OR flags NOT IN ('FCY', 'SF'))"
    rows = get_conn().execute(f"""
        WITH yearly AS (
            SELECT year, driver_id, MEDIAN(lap_time) as med
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%race%'
              AND lap_time>0 {sc}
            GROUP BY year, driver_id HAVING COUNT(*) >= 50
        ),
        ranked AS (
            SELECT year, driver_id,
                   PERCENT_RANK() OVER (PARTITION BY year ORDER BY med DESC) as pct
            FROM yearly
        )
        SELECT year, pct FROM ranked WHERE driver_id=? ORDER BY year
    """, [series, cls, driver_id]).fetchall()
    return [{"year": r[0], "percentile": round(float(r[1]) * 100, 1)} for r in rows]


def driver_best_circuits(driver_id: str, cls: str, series: str) -> list[dict]:
    sc = "AND (flags IS NULL OR flags NOT IN ('FCY', 'SF'))"
    rows = get_conn().execute(f"""
        WITH field AS (
            SELECT event, year, MEDIAN(lap_time) as field_med
            FROM laps
            WHERE series_code=? AND class=? AND session ILIKE '%race%' AND lap_time>0 {sc}
            GROUP BY event, year
        ),
        driver_ev AS (
            SELECT event, year, MEDIAN(lap_time) as drv_med, COUNT(*) as laps
            FROM laps
            WHERE series_code=? AND class=? AND driver_id=?
              AND session ILIKE '%race%' AND lap_time>0 {sc}
            GROUP BY event, year HAVING COUNT(*) >= 5
        ),
        margins AS (
            SELECT d.event,
                   COUNT(*) as appearances,
                   AVG((f.field_med - d.drv_med) / f.field_med * 100) as avg_margin_pct
            FROM driver_ev d JOIN field f ON d.event=f.event AND d.year=f.year
            GROUP BY d.event HAVING COUNT(*) >= 3
        )
        SELECT event, appearances, avg_margin_pct
        FROM margins ORDER BY avg_margin_pct DESC LIMIT 5
    """, [series, cls, series, cls, driver_id]).fetchall()
    return [{"event": r[0], "appearances": r[1], "margin_pct": round(float(r[2]), 2)} for r in rows]


def driver_profile(driver_id: str, cls: str, series: str) -> dict:
    conn = get_conn()
    meta = conn.execute(
        """SELECT driver_name, license, driver_country
           FROM laps WHERE driver_id=? AND series_code=? AND class=? LIMIT 1""",
        [driver_id, series, cls]
    ).fetchone()
    if not meta:
        return {}
    return {
        "driver_id": driver_id,
        "driver_name": meta[0],
        "license": meta[1],
        "driver_country": meta[2],
        "fingerprint": driver_fingerprint(driver_id, cls, series),
        "career_arc": driver_career_arc(driver_id, cls, series),
        "best_circuits": driver_best_circuits(driver_id, cls, series),
    }
