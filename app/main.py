from __future__ import annotations

from contextlib import asynccontextmanager
from decimal import Decimal
from typing import Any

from pathlib import Path

from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from psycopg.errors import QueryCanceled

from app.config import settings
from app.db import close_pool, connect_pool, get_conn
from app.sql import GET_LEAD, GET_LEAD_BY_HITS, GET_SOCIOS

SITUACAO = {
    "01": "Nula",
    "02": "Ativa",
    "03": "Suspensa",
    "04": "Inapta",
    "08": "Baixada",
}


def digits(value: str | None) -> str | None:
    if not value:
        return None
    out = "".join(ch for ch in value if ch.isdigit())
    return out or None


def jsonable(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    clean: dict[str, Any] = {}
    for key, value in row.items():
        if isinstance(value, Decimal):
            clean[key] = float(value)
        elif isinstance(value, str) and value == "":
            clean[key] = None
        else:
            clean[key] = value
    sit = clean.get("situacao_cadastral")
    if sit and not clean.get("situacao_cadastral_desc"):
        clean["situacao_cadastral_desc"] = SITUACAO.get(sit)
    return clean


def require_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")):
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="API key inválida")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    connect_pool()
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS push_devices (
                token TEXT PRIMARY KEY,
                platform TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    yield
    close_pool()


app = FastAPI(
    title="Lead API",
    description="Consulta de leads a partir da base pública de CNPJ.",
    version="1.0.0",
    lifespan=lifespan,
)

STATIC_DIR = Path(__file__).parent / "static"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_error(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc
    if isinstance(exc, QueryCanceled):
        return JSONResponse(
            status_code=504,
            content={"detail": "Consulta demorou demais. Refine os filtros (UF + situação ou CNAE)."},
        )
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/", include_in_schema=False)
def panel():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health():
    try:
        with get_conn() as conn:
            conn.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"db indisponível: {exc}") from exc


@app.get("/v1/leads/{cnpj}", dependencies=[Depends(require_api_key)])
def get_lead(cnpj: str, socios: bool = True):
    code = digits(cnpj)
    if not code or len(code) != 14:
        raise HTTPException(status_code=400, detail="CNPJ deve ter 14 dígitos")

    with get_conn() as conn:
        lead = conn.execute(GET_LEAD, (code,)).fetchone()
        if not lead:
            raise HTTPException(status_code=404, detail="CNPJ não encontrado")
        payload = jsonable(dict(lead))
        if socios and payload:
            payload["socios"] = [
                jsonable(dict(row))
                for row in conn.execute(GET_SOCIOS, (code,)).fetchall()
            ]
        return payload


@app.get("/v1/leads", dependencies=[Depends(require_api_key)])
def search_leads(
    q: str | None = Query(default=None, min_length=2, max_length=120),
    cnpj: str | None = None,
    uf: str | None = Query(default=None, min_length=2, max_length=2),
    cnae: str | None = None,
    situacao: str | None = Query(default=None, description="01 nula, 02 ativa, 03 suspensa, 04 inapta, 08 baixada"),
    municipio: str | None = None,
    com_telefone: str | None = Query(default=None, description="sim ou nao"),
    com_socio: str | None = Query(default=None, description="sim ou nao"),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0, le=10000),
):
    cnpj_digits = digits(cnpj)
    cnpj_basico = None
    q_text = q.strip() if q else None
    if q_text and all(ch.isdigit() or ch in "./- " for ch in q_text):
        q_digits = digits(q_text)
        if q_digits and len(q_digits) == 14:
            cnpj_digits = q_digits
            q_text = None
        elif q_digits and len(q_digits) == 8:
            cnpj_basico = q_digits
            q_text = None

    if not any((q_text, cnpj_digits, cnpj_basico, uf, cnae, situacao, municipio)):
        raise HTTPException(
            status_code=400,
            detail="Informe ao menos um filtro: q, cnpj, uf, cnae, situacao ou municipio",
        )
    if q_text and not any((cnpj_digits, cnpj_basico, uf, cnae, situacao, municipio)):
        raise HTTPException(
            status_code=400,
            detail="Busca por nome precisa de outro filtro: uf, cnae, situacao ou municipio",
        )

    clauses = []
    args: list[Any] = []
    if cnpj_digits and len(cnpj_digits) == 14:
        clauses.append("e.cnpj = %s")
        args.append(cnpj_digits)
    cnpj_basico_val = cnpj_basico or (cnpj_digits if cnpj_digits and len(cnpj_digits) == 8 else None)
    if cnpj_basico_val:
        clauses.append("e.cnpj_basico = %s")
        args.append(cnpj_basico_val)
    if uf:
        clauses.append("e.uf = %s")
        args.append(uf.upper())
    if cnae:
        clauses.append("e.cnae_fiscal = %s")
        args.append(digits(cnae))
    if situacao:
        clauses.append("e.situacao_cadastral = %s")
        args.append(situacao)
    if municipio:
        clauses.append("e.municipio = %s")
        args.append(digits(municipio))
    telefone_flag = (com_telefone or "").strip().lower()
    if telefone_flag in {"sim", "true", "1"}:
        clauses.append(
            "(NULLIF(BTRIM(e.telefone1), '') IS NOT NULL OR NULLIF(BTRIM(e.telefone2), '') IS NOT NULL)"
        )
    elif telefone_flag in {"nao", "não", "false", "0"}:
        clauses.append(
            "(NULLIF(BTRIM(e.telefone1), '') IS NULL AND NULLIF(BTRIM(e.telefone2), '') IS NULL)"
        )
    socio_flag = (com_socio or "").strip().lower()
    if socio_flag in {"sim", "true", "1"}:
        clauses.append("EXISTS (SELECT 1 FROM socios so WHERE so.cnpj = e.cnpj)")
    elif socio_flag in {"nao", "não", "false", "0"}:
        clauses.append("NOT EXISTS (SELECT 1 FROM socios so WHERE so.cnpj = e.cnpj)")
    if q_text:
        clauses.append("(e.nome_fantasia ILIKE %s OR emp.razao_social ILIKE %s)")
        args.extend([f"{q_text}%", f"{q_text}%"])

    where = " AND ".join(clauses)
    join_empresas = "LEFT JOIN empresas emp ON emp.cnpj_basico = e.cnpj_basico" if q_text else ""
    sql = f"""
        WITH hits AS (
            SELECT e.cnpj
            FROM estabelecimento e
            {join_empresas}
            WHERE {where}
            ORDER BY e.cnpj
            LIMIT %s OFFSET %s
        )
        {GET_LEAD_BY_HITS}
    """
    args.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, args).fetchall()

    return {
        "count": len(rows),
        "limit": limit,
        "offset": offset,
        "items": [jsonable(dict(row)) for row in rows],
    }


@app.get("/v1/session", dependencies=[Depends(require_api_key)])
def session():
    return {"ok": True}


@app.get("/v1/cnaes", dependencies=[Depends(require_api_key)])
def search_cnaes(q: str | None = Query(default=None, min_length=2, max_length=80)):
    sql = "SELECT codigo, descricao FROM cnae"
    args: list[Any] = []
    if q:
        sql += " WHERE codigo LIKE %s OR descricao ILIKE %s"
        args.extend([f"{q}%", f"%{q}%"])
    sql += " ORDER BY codigo LIMIT 50"
    with get_conn() as conn:
        rows = conn.execute(sql, args).fetchall()
    return {"items": [dict(row) for row in rows]}


@app.get("/v1/municipios", dependencies=[Depends(require_api_key)])
def search_municipios(q: str | None = Query(default=None, min_length=2, max_length=80)):
    sql = "SELECT codigo, descricao FROM municipio"
    args: list[Any] = []
    if q:
        sql += " WHERE codigo LIKE %s OR descricao ILIKE %s"
        args.extend([f"{q}%", f"%{q}%"])
    sql += " ORDER BY descricao LIMIT 50"
    with get_conn() as conn:
        rows = conn.execute(sql, args).fetchall()
    return {"items": [dict(row) for row in rows]}


@app.post("/v1/devices", dependencies=[Depends(require_api_key)])
def register_device(payload: dict[str, Any] = Body(...)):
    token = str(payload.get("token") or "").strip()
    platform = str(payload.get("platform") or "unknown").strip()[:20]
    if not token or not (
        token.startswith("ExponentPushToken") or token.startswith("ExpoPushToken")
    ):
        raise HTTPException(status_code=400, detail="Token de push inválido")
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO push_devices (token, platform, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (token) DO UPDATE SET
                platform = EXCLUDED.platform,
                updated_at = NOW()
            """,
            (token, platform),
        )
    return {"ok": True}


@app.post("/v1/notifications/test", dependencies=[Depends(require_api_key)])
def test_notification(payload: dict[str, Any] = Body(default={})):
    import httpx

    token = str(payload.get("token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Informe o token do aparelho")
    message = {
        "to": token,
        "title": payload.get("title") or "Lead API",
        "body": payload.get("body") or "Notificações ativas neste aparelho.",
        "sound": "default",
        "data": {"screen": "ajustes"},
    }
    try:
        res = httpx.post(
            "https://exp.host/--/api/v2/push/send",
            json=message,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=20,
        )
        res.raise_for_status()
        return {"ok": True, "expo": res.json()}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao enviar push: {exc}") from exc


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
