import urllib.request
import shutil
from pathlib import Path

import duckdb

HF_URL = "https://huggingface.co/datasets/tobil/imsa/resolve/main/imsa.duckdb"
DB_PATH = Path(__file__).parent.parent / "data" / "imsa.duckdb"
EXPECTED_MIN_SIZE = 100_000_000  # sanity check: >100 MB

_conn: duckdb.DuckDBPyConnection | None = None


def ensure_db() -> None:
    if DB_PATH.exists() and DB_PATH.stat().st_size > EXPECTED_MIN_SIZE:
        return

    print(f"Downloading IMSA dataset (~128 MB) to {DB_PATH} ...")
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = DB_PATH.with_suffix(".tmp")

    with urllib.request.urlopen(HF_URL) as response, open(tmp, "wb") as out:
        shutil.copyfileobj(response, out)

    tmp.rename(DB_PATH)
    print("Download complete.")


def get_conn() -> duckdb.DuckDBPyConnection:
    global _conn
    if _conn is None:
        _conn = duckdb.connect(str(DB_PATH), read_only=True)
    return _conn
