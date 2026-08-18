import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Lead } from "../types";
import { dash, formatCnpj } from "../format";

type Props = {
  items: Lead[];
  onBack: () => void;
  onOpen: (cnpj: string) => void;
};

export function FavoritesScreen({ items, onBack, onOpen }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable onPress={onBack} style={styles.ghost}>
          <Text style={styles.ghostText}>Voltar</Text>
        </Pressable>
        <Text style={styles.h1}>Favoritos</Text>
        <Text style={styles.muted}>{items.length} empresa(s) salvas neste aparelho</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {!items.length ? <Text style={styles.muted}>Nenhum favorito ainda.</Text> : null}
        {items.map((item) => (
          <Pressable key={item.cnpj} style={styles.card} onPress={() => onOpen(item.cnpj)}>
            <Text style={styles.cnpj}>{formatCnpj(item.cnpj)}</Text>
            <Text style={styles.name}>{item.nome_fantasia || item.razao_social || "—"}</Text>
            <Text style={styles.muted}>{dash(item.uf)} · {dash(item.municipio)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: { padding: 20 },
  h1: { color: colors.text, fontSize: 24, fontWeight: "700", marginTop: 10 },
  muted: { color: colors.muted, marginTop: 4 },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cnpj: { color: colors.gold, fontWeight: "700" },
  name: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  ghostText: { color: colors.muted, fontWeight: "700" },
});
