import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unittest.mock import patch


def test_fixture_has_data(db):
    count = db.execute("SELECT COUNT(*) FROM laps").fetchone()[0]
    assert count > 0

def test_fixture_has_both_drivers(db):
    drivers = {r[0] for r in db.execute("SELECT DISTINCT driver_id FROM laps").fetchall()}
    assert "earl bamber" in drivers
    assert "nick tandy" in drivers

def test_compare_drivers_includes_sectors_and_stintlap(db):
    with patch("queries.get_conn", return_value=db):
        import queries
        results = queries.compare_drivers(
            ["earl bamber"], "imsa", "2023", "Watkins Glen", "race", "GTP"
        )
    assert len(results) == 1
    laps = results[0]["laps"]
    assert len(laps) > 0
    assert "lap_time_s1" in laps[0]
    assert "stint_lap" in laps[0]

def test_compare_drivers_stats_includes_sigma(db):
    with patch("queries.get_conn", return_value=db):
        import queries
        results = queries.compare_drivers(
            ["earl bamber", "nick tandy"], "imsa", "2023", "Watkins Glen", "race", "GTP"
        )
    for driver in results:
        assert "sigma" in driver["stats"]
        assert driver["stats"]["sigma"] >= 0
