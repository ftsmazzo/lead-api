LEAD_FROM = """
FROM estabelecimento e
LEFT JOIN empresas emp ON emp.cnpj_basico = e.cnpj_basico
LEFT JOIN simples s ON s.cnpj_basico = e.cnpj_basico
LEFT JOIN cnae ON cnae.codigo = e.cnae_fiscal
LEFT JOIN municipio mun ON mun.codigo = e.municipio
LEFT JOIN natureza_juridica nj ON nj.codigo = emp.natureza_juridica
LEFT JOIN motivo mot ON mot.codigo = e.motivo_situacao_cadastral
"""

LEAD_COLUMNS = """
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
    e.nome_cidade_exterior,
    e.pais AS pais_codigo,
    emp.qualificacao_responsavel,
    emp.ente_federativo_responsavel,
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
    e.ddd_fax,
    e.fax,
    e.correio_eletronico,
    e.situacao_especial,
    e.data_situacao_especial,
    s.opcao_simples,
    s.data_opcao_simples,
    s.data_exclusao_simples,
    s.opcao_mei,
    s.data_opcao_mei,
    s.data_exclusao_mei
"""

GET_LEAD = f"SELECT {LEAD_COLUMNS} {LEAD_FROM} WHERE e.cnpj = %s LIMIT 1"

GET_LEAD_BY_HITS = f"""
SELECT {LEAD_COLUMNS}
FROM estabelecimento e
JOIN hits ON hits.cnpj = e.cnpj
LEFT JOIN empresas emp ON emp.cnpj_basico = e.cnpj_basico
LEFT JOIN simples s ON s.cnpj_basico = e.cnpj_basico
LEFT JOIN cnae ON cnae.codigo = e.cnae_fiscal
LEFT JOIN municipio mun ON mun.codigo = e.municipio
LEFT JOIN natureza_juridica nj ON nj.codigo = emp.natureza_juridica
LEFT JOIN motivo mot ON mot.codigo = e.motivo_situacao_cadastral
ORDER BY e.cnpj
"""

GET_SOCIOS = """
SELECT
    socios.cnpj,
    socios.identificador_de_socio,
    socios.nome_socio,
    socios.cnpj_cpf_socio,
    socios.qualificacao_socio,
    qs.descricao AS qualificacao_socio_desc,
    socios.data_entrada_sociedade,
    socios.pais,
    socios.representante_legal,
    socios.nome_representante,
    socios.qualificacao_representante_legal,
    socios.faixa_etaria,
    est.ddd1,
    est.telefone1,
    est.ddd2,
    est.telefone2,
    est.correio_eletronico
FROM socios
LEFT JOIN qualificacao_socio qs ON qs.codigo = socios.qualificacao_socio
LEFT JOIN LATERAL (
    SELECT ddd1, telefone1, ddd2, telefone2, correio_eletronico
    FROM estabelecimento
    WHERE estabelecimento.cnpj_basico = socios.cnpj_cpf_socio
      AND estabelecimento.matriz_filial = '1'
      AND socios.identificador_de_socio = '1'
    ORDER BY estabelecimento.cnpj
    LIMIT 1
) est ON TRUE
WHERE socios.cnpj = %s
ORDER BY socios.nome_socio
LIMIT 200
"""
