"""Carga SQLite (cnpj.db) -> PostgreSQL EasyPanel, com retomada por rowid."""

from __future__ import annotations

import os
import sqlite3
import sys
import time
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parent
TABLES: list[tuple[str, list[str]]] = [
    ("_referencia", ["referencia", "valor"]),
    ("cnae", ["codigo", "descricao"]),
    ("motivo", ["codigo", "descricao"]),
    ("municipio", ["codigo", "descricao"]),
    ("natureza_juridica", ["codigo", "descricao"]),
    ("pais", ["codigo", "descricao"]),
    ("qualificacao_socio", ["codigo", "descricao"]),
    ("empresas", [
        "cnpj_basico", "razao_social", "natureza_juridica",
        "qualificacao_responsavel", "porte_empresa",
        "ente_federativo_responsavel", "capital_social",
    ]),
    ("estabelecimento", [
        "cnpj_basico", "cnpj_ordem", "cnpj_dv", "matriz_filial", "nome_fantasia",
        "situacao_cadastral", "data_situacao_cadastral", "motivo_situacao_cadastral",
        "nome_cidade_exterior", "pais", "data_inicio_atividades", "cnae_fiscal",
        "cnae_fiscal_secundaria", "tipo_logradouro", "logradouro", "numero",
        "complemento", "bairro", "cep", "uf", "municipio", "ddd1", "telefone1",
        "ddd2", "telefone2", "ddd_fax", "fax", "correio_eletronico",
        "situacao_especial", "data_situacao_especial", "cnpj",
    ]),
    ("simples", [
        "cnpj_basico", "opcao_simples", "data_opcao_simples",
        "data_exclusao_simples", "opcao_mei", "data_opcao_mei",
        "data_exclusao_mei",
    ]),
    ("socios", [
        "cnpj", "cnpj_basico", "identificador_de_socio", "nome_socio",
        "cnpj_cpf_socio", "qualificacao_socio", "data_entrada_sociedade",
        "pais", "representante_legal", "nome_representante",
        "qualificacao_representante_legal", "faixa_etaria",
    ]),
]

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_cnae ON cnae (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_motivo ON motivo (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_municipio ON municipio (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_natureza_juridica ON natureza_juridica (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_pais ON pais (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_qualificacao_socio ON qualificacao_socio (codigo)",
    "CREATE INDEX IF NOT EXISTS idx_empresas_cnpj_basico ON empresas (cnpj_basico)",
    "CREATE INDEX IF NOT EXISTS idx_empresas_razao_social ON empresas (razao_social)",
    "CREATE INDEX IF NOT EXISTS idx_estabelecimento_cnpj_basico ON estabelecimento (cnpj_basico)",
    "CREATE INDEX IF NOT EXISTS idx_estabelecimento_cnpj ON estabelecimento (cnpj)",
    "CREATE INDEX IF NOT EXISTS idx_estabelecimento_nomefantasia ON estabelecimento (nome_fantasia)",
    "CREATE INDEX IF NOT EXISTS idx_simples_cnpj_basico ON simples (cnpj_basico)",
    "CREATE INDEX IF NOT EXISTS idx_socios_cnpj ON socios (cnpj)",
    "CREATE INDEX IF NOT EXISTS idx_socios_cnpj_cpf_socio ON socios (cnpj_cpf_socio)",
    "CREATE INDEX IF NOT EXISTS idx_socios_nome_socio ON socios (nome_socio)",
    "CREATE INDEX IF NOT EXISTS idx_socios_representante ON socios (representante_legal)",
    "CREATE INDEX IF NOT EXISTS idx_socios_representante_nome ON socios (nome_representante)",
]


def log(msg: str) -> None:
    print(msg, flush=True)


def load_env() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def pg_connect() -> psycopg.Connection:
    return psycopg.connect(
        host=os.environ["PGHOST"],
        port=os.environ.get("PGPORT", "5432"),
        dbname=os.environ["PGDATABASE"],
        user=os.environ["PGUSER"],
        password=os.environ["PGPASSWORD"],
        sslmode=os.environ.get("PGSSLMODE", "disable"),
        connect_timeout=30,
        autocommit=False,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
        options="-c statement_timeout=0 -c synchronous_commit=off",
    )


def apply_schema(pg: psycopg.Connection) -> None:
    sql = (ROOT / "schema.sql").read_text(encoding="utf-8")
    pg.execute(sql)
    pg.commit()
    log("Schema aplicado.")


def sqlite_connect(path: Path) -> sqlite3.Connection:
    src = sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True, timeout=60)
    src.row_factory = sqlite3.Row
    src.execute("PRAGMA query_only = ON")
    src.execute("PRAGMA cache_size = -200000")
    src.execute("PRAGMA temp_store = MEMORY")
    return src


def progress_of(pg: psycopg.Connection, table: str) -> tuple[int, int]:
    row = pg.execute(
        "SELECT last_rowid, rows_loaded FROM _migrate_progress WHERE table_name = %s",
        (table,),
    ).fetchone()
    if row is None:
        return 0, 0
    return int(row[0]), int(row[1])


def save_progress(
    pg: psycopg.Connection,
    table: str,
    last_rowid: int,
    rows_loaded: int,
    source_total: int,
    status: str,
) -> None:
    pg.execute(
        """
        INSERT INTO _migrate_progress (table_name, last_rowid, rows_loaded, source_total, status, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON CONFLICT (table_name) DO UPDATE SET
            last_rowid = EXCLUDED.last_rowid,
            rows_loaded = EXCLUDED.rows_loaded,
            source_total = EXCLUDED.source_total,
            status = EXCLUDED.status,
            updated_at = NOW()
        """,
        (table, last_rowid, rows_loaded, source_total, status),
    )


def copy_batch(
    pg: psycopg.Connection,
    table: str,
    columns: list[str],
    rows: list[tuple],
) -> None:
    col_sql = ", ".join(ident(c) for c in columns)
    copy_sql = f"COPY {ident(table)} ({col_sql}) FROM STDIN"
    with pg.cursor() as cur:
        with cur.copy(copy_sql) as copy:
            for row in rows:
                copy.write_row(row)


def migrate_table(
    src: sqlite3.Connection,
    pg: psycopg.Connection,
    table: str,
    columns: list[str],
    batch_size: int,
) -> None:
    quoted = ident(table)
    total = src.execute(f"SELECT COUNT(*) FROM {quoted}").fetchone()[0]
    last_rowid, loaded = progress_of(pg, table)
    if loaded >= total and total > 0:
        log(f"[{table}] já completa ({loaded:,}/{total:,}).")
        return

    col_sql = ", ".join(ident(c) for c in columns)
    query = (
        f"SELECT rowid, {col_sql} FROM {quoted} "
        f"WHERE rowid > ? ORDER BY rowid"
    )
    log(f"[{table}] origem={total:,} já carregadas={loaded:,} last_rowid={last_rowid}")
    save_progress(pg, table, last_rowid, loaded, total, "running")
    pg.commit()

    cur = src.execute(query, (last_rowid,))
    batch: list[tuple] = []
    started = time.time()
    last_report = started

    def flush() -> None:
        nonlocal batch, last_rowid, loaded, last_report
        if not batch:
            return
        copy_batch(pg, table, columns, [r[1:] for r in batch])
        last_rowid = int(batch[-1][0])
        loaded += len(batch)
        batch = []
        save_progress(pg, table, last_rowid, loaded, total, "running")
        pg.commit()
        now = time.time()
        if now - last_report >= 15:
            elapsed = max(now - started, 1)
            rate = loaded / elapsed
            eta = (total - loaded) / rate if rate else 0
            log(
                f"[{table}] {loaded:,}/{total:,} "
                f"({loaded / total * 100:.1f}%) "
                f"{rate:,.0f} rows/s  eta={eta / 3600:.1f}h"
            )
            last_report = now

    for row in cur:
        batch.append(tuple(row))
        if len(batch) >= batch_size:
            flush()
    flush()
    save_progress(pg, table, last_rowid, loaded, total, "loaded")
    pg.commit()
    log(f"[{table}] concluída: {loaded:,} linhas.")


def create_indexes(pg: psycopg.Connection) -> None:
    log("Criando índices (pode demorar em tabelas grandes)...")
    pg.execute("SET maintenance_work_mem = '512MB'")
    for sql in INDEXES:
        log(f"  {sql}")
        t0 = time.time()
        pg.execute(sql)
        pg.commit()
        log(f"  ok em {time.time() - t0:.1f}s")
    log("Índices prontos.")


def main() -> int:
    load_env()
    sqlite_path = (ROOT / os.environ.get("SQLITE_PATH", "cnpj.db")).resolve()
    if not sqlite_path.exists():
        log(f"Arquivo não encontrado: {sqlite_path}")
        return 1

    batch_size = int(os.environ.get("BATCH_SIZE", "20000"))
    log(f"SQLite: {sqlite_path}")
    log(f"Postgres: {os.environ['PGUSER']}@{os.environ['PGHOST']}:{os.environ.get('PGPORT')}/{os.environ['PGDATABASE']}")
    log(f"Batch: {batch_size}")

    src = sqlite_connect(sqlite_path)
    pg = pg_connect()
    apply_schema(pg)

    for table, columns in TABLES:
        migrate_table(src, pg, table, columns, batch_size)

    create_indexes(pg)
    pg.close()
    src.close()
    log("Migração concluída.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        log("Interrompido. Rode de novo para retomar.")
        raise SystemExit(130)
