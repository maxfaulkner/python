import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import queries
import queries_profile  # will be needed in Task 4

from unittest.mock import patch
import pytest


def test_fixture_has_data(db):
    count = db.execute("SELECT COUNT(*) FROM laps").fetchone()[0]
    assert count > 0

def test_fixture_has_both_drivers(db):
    drivers = {r[0] for r in db.execute("SELECT DISTINCT driver_id FROM laps").fetchall()}
    assert "earl bamber" in drivers
    assert "nick tandy" in drivers

def test_compare_drivers_includes_sectors_and_stintlap(db):
    with patch("queries.get_conn", return_value=db):
        results = queries.compare_drivers(
            ["earl bamber"], "imsa", "2023", "Watkins Glen", "race", "GTP"
        )
    assert len(results) == 1
    laps = results[0]["laps"]
    assert len(laps) > 0
    assert "lap_time_s1" in laps[0]
    assert "stint_lap" in laps[0]
    assert laps[0]["lap_time_s1"] == pytest.approx(32.0)
    assert laps[0]["stint_lap"] == 1

def test_compare_drivers_stats_includes_sigma(db):
    with patch("queries.get_conn", return_value=db):
        results = queries.compare_drivers(
            ["earl bamber", "nick tandy"], "imsa", "2023", "Watkins Glen", "race", "GTP"
        )
    for driver in results:
        assert "sigma" in driver["stats"]
        assert driver["stats"]["sigma"] >= 0
    bamber = next(d for d in results if d["driver_id"] == "earl bamber")
    assert bamber["stats"]["sigma"] is not None
    assert bamber["stats"]["sigma"] > 0


def test_h2h_record_returns_year_by_year(db):
    with patch("queries.get_conn", return_value=db):
        result = queries.h2h_record(
            "earl bamber", "nick tandy", "Watkins Glen", "GTP", "imsa"
        )
    # fixture has tandy for 2023 and 2024 only; JOIN yields 2 paired years
    assert len(result) == 2
    years = {r["year"] for r in result}
    assert {"2023", "2024"} == years
    for row in result:
        assert "winner_id" in row
        assert "margin" in row
        assert row["winner_id"] == "earl bamber"  # bamber is faster in fixture
        assert row["margin"] == pytest.approx(0.5, abs=1e-2)
