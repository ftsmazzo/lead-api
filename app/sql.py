LEAD_SELECT = """
SELECT
    e.cnpj,
    e.cnpj_basico,
    e.cnpj_ordem,
    e.cnpj_dv,
    e.matriz_filial,
    e.nome_fantasia,
    emp.razao_social,
    emp.natureza_juridica,
    nj.descricao AS natureza_juridica_desc,
    emp.porte_empresa,
    emp.capital_social,
    e.situacao_cadastral,
    e.motivo_situacao_cadastral,
    mot.descricao AS motivo_situacao_desc,
    e.data_situacao_cadastral,
    e.data_inicio_atividades,
    e.cnae_fiscal,
    cnae.descricao AS cnae_fiscal_desc,
    e.cnae_fiscal_secundaria,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    e.municipio AS municipio_codigo,
    mun.descricao AS municipio,
    e.ddd1,
    e.telefone1,
    e.ddd2,
    e.telefone2,
    e.correio_eletronico,
    s.opcao_simples,
    s.data_opcao_simples,
    s.data_exclusao_simples,
    s.opcao_mei,
    s.data_opcao_mei,
    s.data_exclusao_mei
FROM estabelecimento e
LEFT JOIN empresas emp ON emp.cnpj_basico = e.cnpj_basico
LEFT JOIN simples s ON s.cnpj_basico = e.cnpj_basico
LEFT JOIN cnae ON cnae.codigo = e.cnae_fiscal
LEFT JOIN municipio mun ON mun.codigo = e.municipio
LEFT JOIN natureza_juridica nj ON nj.codigo = emp.natureza_juridica
LEFT JOIN motivo mot ON mot.codigo = e.motivo_situacao_cadastral
"""

GET_LEAD = LEAD_SELECT + " WHERE e.cnpj = %(cnpj)s LIMIT 1"

SEARCH_LEADS = (
    LEAD_SELECT
    + """
WHERE (%(cnpj)s IS NULL OR e.cnpj = %(cnpj)s)
  AND (%(cnpj_basico)s IS NULL OR e.cnpj_basico = %(cnpj_basico)s)
  AND (%(uf)s IS NULL OR e.uf = %(uf)s)
  AND (%(cnae)s IS NULL OR e.cnae_fiscal = %(cnae)s)
  AND (%(situacao)s IS NULL OR e.situacao_cadastral = %(situacao)s)
  AND (%(municipio)s IS NULL OR e.municipio = %(municipio)s)
  AND (
        %(q)s IS NULL
        OR e.nome_fantasia ILIKE %(q_prefix)s
        OR emp.razao_social ILIKE %(q_prefix)s
      )
ORDER BY e.cnpj
LIMIT %(limit)s OFFSET %(offset)s
"""
)

GET_SOCIOS = """
SELECT
    cnpj,
    identificador_de_socio,
    nome_socio,
    cnpj_cpf_socio,
    qualificacao_socio,
    qs.descricao AS qualificacao_socio_desc,
    data_entrada_sociedade,
    pais,
    representante_legal,
    nome_representante,
    qualificacao_representante_legal,
    faixa_etaria
FROM socios
LEFT JOIN qualificacao_socio qs ON qs.codigo = socios.qualificacao_socio
WHERE cnpj = %(cnpj)s
ORDER BY nome_socio
LIMIT 200
"""

SEARCH_CNAE = """
SELECT codigo, descricao
FROM cnae
WHERE %(q)s IS NULL
   OR codigo ILIKE %(q_prefix)s
   OR descricao ILIKE %(q_like)s
ORDER BY codigo
LIMIT 50
"""

SEARCH_MUNICIPIO = """
SELECT codigo, descricao
FROM municipio
WHERE (%(q)s IS NULL OR codigo ILIKE %(q_prefix)s OR descricao ILIKE %(q_like)s)
ORDER BY descricao
LIMIT 50
"""
