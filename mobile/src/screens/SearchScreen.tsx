import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, UFS } from "../theme";
import { SearchParams } from "../types";

type Props = {
  busy?: boolean;
  error?: string;
  onSearch: (params: SearchParams) => void;
  onOpenSettings: () => void;
  onOpenFavorites: () => void;
};

const SITS = [
  { v: "", l: "Todas" },
  { v: "02", l: "Ativa" },
  { v: "01", l: "Nula" },
  { v: "03", l: "Suspensa" },
  { v: "04", l: "Inapta" },
  { v: "08", l: "Baixada" },
];
const TRI = [
  { v: "", l: "Todos" },
  { v: "sim", l: "Sim" },
  { v: "nao", l: "Não" },
];

function Chips({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const on = value === opt.v;
        return (
          <Pressable
            key={opt.v || "all"}
            onPress={() => onChange(opt.v)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchScreen({ busy, error, onSearch, onOpenSettings, onOpenFavorites }: Props) {
  const [q, setQ] = useState("");
  const [uf, setUf] = useState("");
  const [situacao, setSituacao] = useState("02");
  const [cnae, setCnae] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [comTelefone, setComTelefone] = useState("");
  const [comSocio, setComSocio] = useState("");

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>Lead API</Text>
          <Text style={styles.h1}>Buscar leads</Text>
        </View>
        <View style={styles.topBtns}>
          <Pressable onPress={onOpenFavorites} style={styles.ghost}>
            <Text style={styles.ghostText}>Favoritos</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings} style={styles.ghost}>
            <Text style={styles.ghostText}>Ajustes</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.help}>
        Todos os filtros ficam nesta tela. Busca por nome precisa de UF, CNAE, situação ou
        município.
      </Text>

      <Text style={styles.label}>CNPJ, razão social ou nome fantasia</Text>
      <TextInput
        style={styles.input}
        value={q}
        onChangeText={setQ}
        placeholder="00.000.000/0001-00"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>UF</Text>
      <Chips
        value={uf}
        onChange={setUf}
        options={[{ v: "", l: "Todas" }, ...UFS.map((item) => ({ v: item, l: item }))]}
      />

      <Text style={styles.label}>Situação cadastral</Text>
      <Chips value={situacao} onChange={setSituacao} options={SITS} />

      <Text style={styles.label}>CNAE fiscal</Text>
      <TextInput
        style={styles.input}
        value={cnae}
        onChangeText={setCnae}
        placeholder="6201501"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Município (código IBGE)</Text>
      <TextInput
        style={styles.input}
        value={municipio}
        onChangeText={setMunicipio}
        placeholder="3543402"
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Possui telefone?</Text>
      <Chips value={comTelefone} onChange={setComTelefone} options={TRI} />

      <Text style={styles.label}>Possui sócio?</Text>
      <Chips value={comSocio} onChange={setComSocio} options={TRI} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.btn}
        disabled={busy}
        onPress={() =>
          onSearch({
            q,
            uf,
            situacao,
            cnae,
            municipio,
            com_telefone: comTelefone,
            com_socio: comSocio,
            limit: 20,
            offset: 0,
          })
        }
      >
        <Text style={styles.btnText}>{busy ? "Buscando…" : "Buscar"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  topBtns: { gap: 8 },
  eyebrow: { color: colors.gold, letterSpacing: 2, fontSize: 11, fontWeight: "700" },
  h1: { color: colors.text, fontSize: 26, fontWeight: "700", marginTop: 4 },
  help: { color: colors.muted, marginVertical: 12, lineHeight: 20 },
  label: { color: colors.muted, fontSize: 12, marginTop: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    color: colors.text,
    borderRadius: 12,
    padding: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  chipTextOn: { color: colors.goldText },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  ghostText: { color: colors.muted, fontWeight: "700" },
  error: { color: colors.bad, marginTop: 12 },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: colors.goldText, fontWeight: "800" },
});
