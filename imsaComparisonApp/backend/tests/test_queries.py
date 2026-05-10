def test_fixture_has_data(db):
    count = db.execute("SELECT COUNT(*) FROM laps").fetchone()[0]
    assert count > 0

def test_fixture_has_both_drivers(db):
    drivers = {r[0] for r in db.execute("SELECT DISTINCT driver_id FROM laps").fetchall()}
    assert "earl bamber" in drivers
    assert "nick tandy" in drivers
