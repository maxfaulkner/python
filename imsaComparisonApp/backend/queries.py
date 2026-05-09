from db import get_conn


def get_filter_universe() -> dict:
    conn = get_conn()
    years = [r[0] for r in conn.execute(
        "SELECT DISTINCT year FROM laps WHERE series_code = 'imsa' ORDER BY year DESC"
    ).fetchall()]
    sessions = [r[0] for r in conn.execute(
        "SELECT DISTINCT session FROM laps WHERE series_code = 'imsa' ORDER BY session"
    ).fetchall()]
    classes = [r[0] for r in conn.execute(
        "SELECT DISTINCT class FROM laps WHERE series_code = 'imsa' ORDER BY class"
    ).fetchall()]
    return {"years": years, "sessions": sessions, "classes": classes}


def get_events(year: int) -> list[str]:
    rows = get_conn().execute(
        "SELECT DISTINCT event FROM laps WHERE series_code = 'imsa' AND year = ? ORDER BY event",
        [year],
    ).fetchall()
    return [r[0] for r in rows]


def get_drivers(year: int, event: str, session: str, cls: str) -> list[dict]:
    rows = get_conn().execute(
        """SELECT DISTINCT driver_id, driver_name, car, team_name
           FROM laps
           WHERE series_code = 'imsa' AND year = ? AND event = ? AND session = ? AND class = ?
           ORDER BY driver_name""",
        [year, event, session, cls],
    ).fetchall()
    return [{"driver_id": r[0], "driver_name": r[1], "car": r[2], "team_name": r[3]} for r in rows]


def compare_drivers(driver_ids: list[str], year: int, event: str, session: str, cls: str) -> list[dict]:
    conn = get_conn()
    placeholders = ", ".join("?" * len(driver_ids))

    cutoff_row = conn.execute(
        f"""SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY lap_time)
            FROM laps
            WHERE series_code = 'imsa' AND year = ? AND event = ? AND session = ? AND class = ?
              AND lap_time > 0""",
        [year, event, session, cls],
    ).fetchone()
    cutoff = cutoff_row[0] if cutoff_row else 1e9

    rows = conn.execute(
        f"""SELECT driver_id, driver_name, car, team_name, lap, lap_time, stint_number, flags
            FROM laps
            WHERE series_code = 'imsa' AND year = ? AND event = ? AND session = ? AND class = ?
              AND driver_id IN ({placeholders})
              AND lap_time > 0 AND lap_time < ?
            ORDER BY driver_id, lap""",
        [year, event, session, cls, *driver_ids, cutoff],
    ).fetchall()

    by_driver: dict[str, dict] = {}
    for driver_id, driver_name, car, team_name, lap, lap_time, stint, flags in rows:
        if driver_id not in by_driver:
            by_driver[driver_id] = {
                "driver_id": driver_id,
                "driver_name": driver_name,
                "car": car,
                "team_name": team_name,
                "laps": [],
            }
        by_driver[driver_id]["laps"].append({
            "lap": lap,
            "lap_time": lap_time,
            "stint_number": stint,
            "flags": flags,
        })

    results = []
    for d in by_driver.values():
        times = [l["lap_time"] for l in d["laps"]]
        if times:
            times_sorted = sorted(times)
            p75_idx = int(len(times_sorted) * 0.75)
            d["stats"] = {
                "best_lap": times_sorted[0],
                "median_lap": times_sorted[len(times_sorted) // 2],
                "p75_lap": times_sorted[p75_idx],
                "lap_count": len(times),
            }
        else:
            d["stats"] = {"best_lap": None, "median_lap": None, "p75_lap": None, "lap_count": 0}
        results.append(d)

    return results


def get_teams(year: int, session: str, cls: str) -> list[str]:
    rows = get_conn().execute(
        """SELECT DISTINCT team_name FROM laps
           WHERE series_code = 'imsa' AND year = ? AND session = ? AND class = ?
             AND team_name IS NOT NULL
           ORDER BY team_name""",
        [year, session, cls],
    ).fetchall()
    return [r[0] for r in rows]


def compare_teams(teams: list[str], year: int, session: str, cls: str) -> list[dict]:
    conn = get_conn()
    placeholders = ", ".join("?" * len(teams))

    cutoff_row = conn.execute(
        """SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY lap_time)
           FROM laps
           WHERE series_code = 'imsa' AND year = ? AND session = ? AND class = ? AND lap_time > 0""",
        [year, session, cls],
    ).fetchone()
    cutoff = cutoff_row[0] if cutoff_row else 1e9

    rows = conn.execute(
        f"""SELECT team_name, event, MEDIAN(lap_time) as median_lap, MIN(lap_time) as best_lap, COUNT(*) as lap_count
            FROM laps
            WHERE series_code = 'imsa' AND year = ? AND session = ? AND class = ?
              AND team_name IN ({placeholders})
              AND lap_time > 0 AND lap_time < ?
            GROUP BY team_name, event
            ORDER BY event, team_name""",
        [year, session, cls, *teams, cutoff],
    ).fetchall()

    return [
        {"team_name": r[0], "event": r[1], "median_lap": r[2], "best_lap": r[3], "lap_count": r[4]}
        for r in rows
    ]


def get_manufacturers(year: int, session: str) -> list[str]:
    rows = get_conn().execute(
        """SELECT DISTINCT manufacturer FROM laps
           WHERE series_code = 'imsa' AND year = ? AND session = ?
             AND manufacturer IS NOT NULL
           ORDER BY manufacturer""",
        [year, session],
    ).fetchall()
    return [r[0] for r in rows]


def compare_manufacturers(manufacturers: list[str], year: int, session: str, cls_normalized: str) -> list[dict]:
    conn = get_conn()
    placeholders = ", ".join("?" * len(manufacturers))

    cutoff_row = conn.execute(
        """SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY lap_time)
           FROM laps
           WHERE series_code = 'imsa' AND year = ? AND session = ? AND class_normalized = ?
             AND lap_time > 0""",
        [year, session, cls_normalized],
    ).fetchone()
    cutoff = cutoff_row[0] if cutoff_row else 1e9

    rows = conn.execute(
        f"""SELECT manufacturer, lap_time
            FROM laps
            WHERE series_code = 'imsa' AND year = ? AND session = ? AND class_normalized = ?
              AND manufacturer IN ({placeholders})
              AND lap_time > 0 AND lap_time < ?
            ORDER BY manufacturer, lap_time""",
        [year, session, cls_normalized, *manufacturers, cutoff],
    ).fetchall()

    by_mfr: dict[str, list[float]] = {}
    for mfr, lap_time in rows:
        by_mfr.setdefault(mfr, []).append(lap_time)

    return [{"manufacturer": mfr, "lap_times": times} for mfr, times in by_mfr.items()]
