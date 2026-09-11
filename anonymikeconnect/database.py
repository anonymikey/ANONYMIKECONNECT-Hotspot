"""SQLite persistence for vouchers and captive-portal sessions."""

from __future__ import annotations

import secrets
import sqlite3
import string
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat(timespec="seconds")


@dataclass(frozen=True)
class Voucher:
    code: str
    created_at: str
    expires_at: str
    status: str
    used_at: str | None


@dataclass(frozen=True)
class Session:
    voucher_code: str
    client_mac: str
    client_ip: str
    started_at: str
    expires_at: str


class VoucherStore:
    """Small, thread-safe store shared by the desktop UI and Flask thread."""

    def __init__(self, db_path: str | Path = "data/anonymikeconnect.sqlite3") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS vouchers (
                    code TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active',
                    used_at TEXT
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    voucher_code TEXT NOT NULL,
                    client_mac TEXT NOT NULL,
                    client_ip TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                );
                """
            )

    def create_vouchers(self, quantity: int = 1, duration_minutes: int = 60) -> list[Voucher]:
        quantity = max(1, min(quantity, 100))
        alphabet = string.ascii_uppercase + string.digits
        created: list[Voucher] = []

        with self._lock, self._connect() as connection:
            for _ in range(quantity):
                while True:
                    code = "-".join(
                        "".join(secrets.choice(alphabet) for _ in range(4))
                        for _ in range(3)
                    )
                    if connection.execute(
                        "SELECT 1 FROM vouchers WHERE code = ?", (code,)
                    ).fetchone() is None:
                        break

                created_at = utc_now()
                expires_at = created_at + timedelta(minutes=max(5, duration_minutes))
                connection.execute(
                    """
                    INSERT INTO vouchers (code, created_at, expires_at, status)
                    VALUES (?, ?, ?, 'active')
                    """,
                    (code, created_at.isoformat(timespec="seconds"), expires_at.isoformat(timespec="seconds")),
                )
                created.append(
                    Voucher(
                        code=code,
                        created_at=created_at.isoformat(timespec="seconds"),
                        expires_at=expires_at.isoformat(timespec="seconds"),
                        status="active",
                        used_at=None,
                    )
                )
        return created

    def list_vouchers(self, limit: int = 250) -> list[Voucher]:
        self.expire_vouchers()
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT code, created_at, expires_at, status, used_at
                FROM vouchers
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return [Voucher(**dict(row)) for row in rows]

    def expire_vouchers(self) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                UPDATE vouchers SET status = 'expired'
                WHERE status = 'active' AND expires_at <= ?
                """,
                (iso_now(),),
            )

    def redeem(self, code: str, client_mac: str, client_ip: str) -> tuple[bool, str]:
        normalized = code.strip().upper()
        with self._lock, self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM vouchers WHERE code = ?", (normalized,)
            ).fetchone()
            if row is None:
                return False, "That voucher code was not found."
            if row["status"] != "active":
                return False, f"This voucher is {row['status']}."
            if row["expires_at"] <= iso_now():
                connection.execute(
                    "UPDATE vouchers SET status = 'expired' WHERE code = ?", (normalized,)
                )
                return False, "This voucher has expired."

            connection.execute(
                """
                UPDATE vouchers SET status = 'used', used_at = ?
                WHERE code = ?
                """,
                (iso_now(), normalized),
            )
            expires_at = row["expires_at"]
            connection.execute(
                """
                INSERT INTO sessions
                    (voucher_code, client_mac, client_ip, started_at, expires_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (normalized, client_mac, client_ip, iso_now(), expires_at),
            )
        return True, "Connected. You can now use the internet."

    def active_sessions(self) -> list[Session]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                """
                SELECT voucher_code, client_mac, client_ip, started_at, expires_at
                FROM sessions
                WHERE expires_at > ?
                ORDER BY started_at DESC
                """,
                (iso_now(),),
            ).fetchall()
        return [Session(**dict(row)) for row in rows]