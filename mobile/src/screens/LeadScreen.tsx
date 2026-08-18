import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Lead } from "../types";
import {
  dash,
  formatCep,
  formatCnpj,
  formatDate,
  formatMoney,
  formatPhone,
  labeled,
  maps,
  simNao,
} from "../format";
import { Row, Section } from "../components/Info";

type Props = {
  lead: Lead;
  favorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
};

function copy(value: string) {
  if (value && value !== "—") Share.share({ message: value });
}

export function LeadScreen({ lead, favorite, onBack, onToggleFavorite }: Props) {
  const endereco = [
    lead.tipo_logradouro,
    lead.logradouro,
    lead.numero,
    lead.complemento,
    lead.bairro,
    lead.municipio,
    lead.uf,
    formatCep(lead.cep),
  ]
    .filter((part) => part && part !== "—")
    .join(", ");

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable onPress={onBack} style={styles.ghost}>
          <Text style={styles.ghostText}>Voltar</Text>
        </Pressable>
        <Pressable onPress={onToggleFavorite} style={styles.ghost}>
          <Text style={styles.ghostText}>{favorite ? "Favorito" : "Favoritar"}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>{formatCnpj(lead.cnpj)}</Text>
        <Text style={styles.h1}>{lead.nome_fantasia || lead.razao_social || "Empresa"}</Text>
        <Text style={styles.muted}>{lead.razao_social || "—"}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.copy} onPress={() => copy(lead.cnpj)}>
            <Text style={styles.copyText}>Copiar CNPJ</Text>
          </Pressable>
          <Pressable style={styles.copy} onPress={() => copy(formatPhone(lead.ddd1, lead.telefone1))}>
            <Text style={styles.copyText}>Copiar telefone</Text>
          </Pressable>
          <Pressable style={styles.copy} onPress={() => copy(lead.correio_eletronico || "")}>
            <Text style={styles.copyText}>Copiar e-mail</Text>
          </Pressable>
        </View>

        <Section title="Identificação">
          <Row label="CNPJ" value={formatCnpj(lead.cnpj)} />
          <Row label="CNPJ básico" value={dash(lead.cnpj_basico)} />
          <Row label="Ordem" value={dash(lead.cnpj_ordem)} />
          <Row label="Dígito verificador" value={dash(lead.cnpj_dv)} />
          <Row label="Matriz ou filial" value={labeled(lead.matriz_filial, maps.MATRIZ)} />
          <Row label="Nome fantasia" value={dash(lead.nome_fantasia)} />
          <Row label="Razão social" value={dash(lead.razao_social)} />
        </Section>

        <Section title="Situação cadastral">
          <Row
            label="Situação"
            value={labeled(lead.situacao_cadastral, maps.SITUACAO, lead.situacao_cadastral_desc)}
          />
          <Row label="Data da situação" value={formatDate(lead.data_situacao_cadastral)} />
          <Row
            label="Motivo da situação"
            value={labeled(lead.motivo_situacao_cadastral, undefined, lead.motivo_situacao_desc)}
          />
          <Row label="Início das atividades" value={formatDate(lead.data_inicio_atividades)} />
          <Row label="Situação especial" value={dash(lead.situacao_especial)} />
          <Row label="Data da situação especial" value={formatDate(lead.data_situacao_especial)} />
        </Section>

        <Section title="Atividade">
          <Row label="CNAE fiscal" value={labeled(lead.cnae_fiscal, undefined, lead.cnae_fiscal_desc)} />
          <Row label="CNAEs secundários" value={dash(lead.cnae_fiscal_secundaria)} />
        </Section>

        <Section title="Porte e natureza">
          <Row label="Porte" value={labeled(lead.porte_empresa, maps.PORTE)} />
          <Row label="Capital social" value={formatMoney(lead.capital_social)} />
          <Row
            label="Natureza jurídica"
            value={labeled(lead.natureza_juridica, undefined, lead.natureza_juridica_desc)}
          />
          <Row label="Qualificação do responsável" value={dash(lead.qualificacao_responsavel)} />
          <Row label="Ente federativo responsável" value={dash(lead.ente_federativo_responsavel)} />
        </Section>

        <Section title="Endereço">
          <Row label="Endereço completo" value={endereco || "—"} />
          <Row label="Tipo de logradouro" value={dash(lead.tipo_logradouro)} />
          <Row label="Logradouro" value={dash(lead.logradouro)} />
          <Row label="Número" value={dash(lead.numero)} />
          <Row label="Complemento" value={dash(lead.complemento)} />
          <Row label="Bairro" value={dash(lead.bairro)} />
          <Row label="CEP" value={formatCep(lead.cep)} />
          <Row label="Município" value={`${dash(lead.municipio_codigo)} · ${dash(lead.municipio)}`} />
          <Row label="UF" value={dash(lead.uf)} />
          <Row label="Cidade no exterior" value={dash(lead.nome_cidade_exterior)} />
          <Row label="País" value={dash(lead.pais_codigo)} />
        </Section>

        <Section title="Contatos">
          <Row label="Telefone 1" value={formatPhone(lead.ddd1, lead.telefone1)} />
          <Row label="DDD 1" value={dash(lead.ddd1)} />
          <Row label="Número 1" value={dash(lead.telefone1)} />
          <Row label="Telefone 2" value={formatPhone(lead.ddd2, lead.telefone2)} />
          <Row label="DDD 2" value={dash(lead.ddd2)} />
          <Row label="Número 2" value={dash(lead.telefone2)} />
          <Row label="Fax" value={formatPhone(lead.ddd_fax, lead.fax)} />
          <Row label="E-mail" value={dash(lead.correio_eletronico)} />
        </Section>

        <Section title="Simples e MEI">
          <Row label="Optante Simples" value={simNao(lead.opcao_simples)} />
          <Row label="Data opção Simples" value={formatDate(lead.data_opcao_simples)} />
          <Row label="Data exclusão Simples" value={formatDate(lead.data_exclusao_simples)} />
          <Row label="Optante MEI" value={simNao(lead.opcao_mei)} />
          <Row label="Data opção MEI" value={formatDate(lead.data_opcao_mei)} />
          <Row label="Data exclusão MEI" value={formatDate(lead.data_exclusao_mei)} />
        </Section>

        <Section title={`Sócios (${lead.socios?.length || 0})`}>
          {!lead.socios?.length ? (
            <Text style={styles.muted}>Nenhum sócio nesta ficha.</Text>
          ) : (
            lead.socios.map((socio, index) => (
              <View key={`${socio.cnpj_cpf_socio}-${index}`} style={styles.socio}>
                <Text style={styles.socioName}>{dash(socio.nome_socio)}</Text>
                <Row label="Tipo" value={labeled(socio.identificador_de_socio, maps.TIPO_SOCIO)} />
                <Row label="CPF/CNPJ do sócio" value={dash(socio.cnpj_cpf_socio)} />
                <Row
                  label="Qualificação"
                  value={labeled(socio.qualificacao_socio, undefined, socio.qualificacao_socio_desc)}
                />
                <Row label="Telefone 1" value={formatPhone(socio.ddd1, socio.telefone1)} />
                <Row label="Telefone 2" value={formatPhone(socio.ddd2, socio.telefone2)} />
                <Row label="E-mail" value={dash(socio.correio_eletronico)} />
                <Row label="Entrada na sociedade" value={formatDate(socio.data_entrada_sociedade)} />
                <Row label="País" value={dash(socio.pais)} />
                <Row label="Faixa etária" value={labeled(socio.faixa_etaria, maps.FAIXA)} />
                <Row label="Representante legal" value={dash(socio.representante_legal)} />
                <Row label="Nome do representante" value={dash(socio.nome_representante)} />
                <Row
                  label="Qualificação do representante"
                  value={dash(socio.qualificacao_representante_legal)}
                />
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  body: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  eyebrow: { color: colors.gold, fontWeight: "700" },
  h1: { color: colors.text, fontSize: 24, fontWeight: "700", marginTop: 6 },
  muted: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  copy: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  copyText: { color: colors.muted, fontWeight: "700" },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { color: colors.muted, fontWeight: "700" },
  socio: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 8 },
  socioName: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 8 },
});
