import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Lead } from "../types";
import { dash, formatCnpj, formatPhone, labeled, maps } from "../format";

type Props = {
  items: Lead[];
  status: string;
  canPrev: boolean;
  canNext: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpen: (cnpj: string) => void;
};

export function ResultsScreen({ items, status, canPrev, canNext, onBack, onPrev, onNext, onOpen }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable onPress={onBack} style={styles.ghost}>
          <Text style={styles.ghostText}>Voltar</Text>
        </Pressable>
        <Text style={styles.h1}>Resultados</Text>
        <Text style={styles.muted}>{status}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {items.map((item) => (
          <Pressable key={item.cnpj} style={styles.card} onPress={() => onOpen(item.cnpj)}>
            <Text style={styles.cnpj}>{formatCnpj(item.cnpj)}</Text>
            <Text style={styles.name}>{item.nome_fantasia || item.razao_social || "Sem nome"}</Text>
            <Text style={styles.muted}>{item.razao_social || "—"}</Text>
            <Text style={styles.line}>
              UF {dash(item.uf)} · {dash(item.municipio)} ·{" "}
              {labeled(item.situacao_cadastral, maps.SITUACAO, item.situacao_cadastral_desc)}
            </Text>
            <Text style={styles.line}>CNAE {dash(item.cnae_fiscal)} · {dash(item.cnae_fiscal_desc)}</Text>
            <Text style={styles.line}>Tel {formatPhone(item.ddd1, item.telefone1)}</Text>
            <Text style={styles.line}>E-mail {dash(item.correio_eletronico)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.pager}>
        <Pressable disabled={!canPrev} onPress={onPrev} style={styles.ghost}>
          <Text style={styles.ghostText}>Anterior</Text>
        </Pressable>
        <Pressable disabled={!canNext} onPress={onNext} style={styles.ghost}>
          <Text style={styles.ghostText}>Próxima</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: { padding: 20, paddingBottom: 8 },
  h1: { color: colors.text, fontSize: 24, fontWeight: "700", marginTop: 10 },
  muted: { color: colors.muted, marginTop: 4 },
  list: { padding: 20, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cnpj: { color: colors.gold, fontWeight: "700" },
  name: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  line: { color: colors.muted, marginTop: 4, lineHeight: 20 },
  pager: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  ghostText: { color: colors.muted, fontWeight: "700" },
});
