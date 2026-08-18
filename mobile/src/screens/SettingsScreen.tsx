import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";

type Props = {
  apiUrl: string;
  apiKey: string;
  pushToken: string | null;
  pushStatus: string;
  onChangeUrl: (value: string) => void;
  onChangeKey: (value: string) => void;
  onSave: () => void;
  onEnablePush: () => void;
  onTestPush: () => void;
  onLogout: () => void;
  onBack: () => void;
};

export function SettingsScreen({
  apiUrl,
  apiKey,
  pushToken,
  pushStatus,
  onChangeUrl,
  onChangeKey,
  onSave,
  onEnablePush,
  onTestPush,
  onLogout,
  onBack,
}: Props) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.body}>
      <Pressable onPress={onBack} style={styles.ghost}>
        <Text style={styles.ghostText}>Voltar</Text>
      </Pressable>
      <Text style={styles.eyebrow}>Lead API</Text>
      <Text style={styles.h1}>Ajustes</Text>

      <Text style={styles.label}>Endereço da API</Text>
      <TextInput style={styles.input} value={apiUrl} onChangeText={onChangeUrl} autoCapitalize="none" />

      <Text style={styles.label}>API key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={onChangeKey}
        autoCapitalize="none"
        secureTextEntry
      />
      <Pressable style={styles.btn} onPress={onSave}>
        <Text style={styles.btnText}>Salvar conexão</Text>
      </Pressable>

      <Text style={styles.h2}>Notificações push</Text>
      <Text style={styles.muted}>
        Ative no aparelho físico (Expo Go ou build nativo). Emulador costuma não gerar token.
      </Text>
      <Text style={styles.token}>Token: {pushToken || "ainda não registrado"}</Text>
      {pushStatus ? <Text style={styles.muted}>{pushStatus}</Text> : null}
      <Pressable style={styles.ghostWide} onPress={onEnablePush}>
        <Text style={styles.ghostText}>Ativar notificações</Text>
      </Pressable>
      <Pressable style={styles.ghostWide} onPress={onTestPush}>
        <Text style={styles.ghostText}>Enviar notificação de teste</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 40 },
  eyebrow: { color: colors.gold, letterSpacing: 2, fontSize: 11, fontWeight: "700", marginTop: 16 },
  h1: { color: colors.text, fontSize: 26, fontWeight: "700", marginTop: 6, marginBottom: 16 },
  h2: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 28, marginBottom: 8 },
  muted: { color: colors.muted, lineHeight: 20, marginBottom: 8 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    color: colors.text,
    borderRadius: 12,
    padding: 12,
  },
  token: { color: colors.text, marginVertical: 8 },
  btn: { backgroundColor: colors.gold, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  btnText: { color: colors.goldText, fontWeight: "800" },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start" },
  ghostWide: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  ghostText: { color: colors.muted, fontWeight: "700" },
  logout: { marginTop: 28, alignItems: "center" },
  logoutText: { color: colors.bad, fontWeight: "700" },
});
