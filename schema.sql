-- Base bruta CNPJ (Receita Federal) — tipos próximos do SQLite original.
-- Índices só depois da carga, no script de migração.

CREATE TABLE IF NOT EXISTS _migrate_progress (
    table_name TEXT PRIMARY KEY,
    last_rowid BIGINT NOT NULL DEFAULT 0,
    rows_loaded BIGINT NOT NULL DEFAULT 0,
    source_total BIGINT,
    status TEXT NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS _referencia (
    referencia TEXT,
    valor TEXT
);

CREATE TABLE IF NOT EXISTS cnae (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS motivo (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS municipio (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS natureza_juridica (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS pais (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS qualificacao_socio (
    codigo TEXT,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS empresas (
    cnpj_basico TEXT,
    razao_social TEXT,
    natureza_juridica TEXT,
    qualificacao_responsavel TEXT,
    porte_empresa TEXT,
    ente_federativo_responsavel TEXT,
    capital_social NUMERIC
);

CREATE TABLE IF NOT EXISTS estabelecimento (
    cnpj_basico TEXT,
    cnpj_ordem TEXT,
    cnpj_dv TEXT,
    matriz_filial TEXT,
    nome_fantasia TEXT,
    situacao_cadastral TEXT,
    data_situacao_cadastral TEXT,
    motivo_situacao_cadastral TEXT,
    nome_cidade_exterior TEXT,
    pais TEXT,
    data_inicio_atividades TEXT,
    cnae_fiscal TEXT,
    cnae_fiscal_secundaria TEXT,
    tipo_logradouro TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cep TEXT,
    uf TEXT,
    municipio TEXT,
    ddd1 TEXT,
    telefone1 TEXT,
    ddd2 TEXT,
    telefone2 TEXT,
    ddd_fax TEXT,
    fax TEXT,
    correio_eletronico TEXT,
    situacao_especial TEXT,
    data_situacao_especial TEXT,
    cnpj TEXT
);

CREATE TABLE IF NOT EXISTS simples (
    cnpj_basico TEXT,
    opcao_simples TEXT,
    data_opcao_simples TEXT,
    data_exclusao_simples TEXT,
    opcao_mei TEXT,
    data_opcao_mei TEXT,
    data_exclusao_mei TEXT
);

CREATE TABLE IF NOT EXISTS socios (
    cnpj TEXT,
    cnpj_basico TEXT,
    identificador_de_socio TEXT,
    nome_socio TEXT,
    cnpj_cpf_socio TEXT,
    qualificacao_socio TEXT,
    data_entrada_sociedade TEXT,
    pais TEXT,
    representante_legal TEXT,
    nome_representante TEXT,
    qualificacao_representante_legal TEXT,
    faixa_etaria TEXT
);
