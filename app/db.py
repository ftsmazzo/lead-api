from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import settings

pool: ConnectionPool | None = None


def connect_pool() -> ConnectionPool:
    global pool
    if pool is None:
        pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.db_pool_min,
            max_size=settings.db_pool_max,
            kwargs={
                "row_factory": dict_row,
                "autocommit": True,
                "options": f"-c statement_timeout={settings.statement_timeout_ms}",
            },
        )
    return pool


def close_pool() -> None:
    global pool
    if pool is not None:
        pool.close()
        pool = None


@contextmanager
def get_conn():
    with connect_pool().connection() as conn:
        yield conn
