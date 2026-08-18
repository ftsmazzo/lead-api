import os
from pathlib import Path

import psycopg

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

INDEXES = [
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_est_cnae_uf_sit ON estabelecimento (cnae_fiscal, uf, situacao_cadastral)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_est_uf_sit ON estabelecimento (uf, situacao_cadastral)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_est_municipio ON estabelecimento (municipio)",
]


def main() -> None:
    conn = psycopg.connect(
        host=os.environ["PGHOST"],
        port=os.environ["PGPORT"],
        dbname=os.environ["PGDATABASE"],
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        sslmode="disable",
        autocommit=True,
        connect_timeout=30,
        options="-c statement_timeout=0",
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )
    conn.execute("SET maintenance_work_mem = '256MB'")
    for sql in INDEXES:
        print(sql, flush=True)
        conn.execute(sql)
        print("ok", flush=True)
    print("ANALYZE estabelecimento", flush=True)
    conn.execute("ANALYZE estabelecimento")
    print("pronto", flush=True)
    conn.close()


if __name__ == "__main__":
    main()
