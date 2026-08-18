import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, DEFAULT_API_URL } from "../theme";

type Props = {
  loading?: boolean;
  error?: string;
  onEnter: (apiKey: string, apiUrl: string) => void;
};

export function LoginScreen({ loading, error, onEnter }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Lead API</Text>
        <Text style={styles.h1}>Consulta CNPJ</Text>
        <Text style={styles.muted}>
          App Android e iOS da base de leads. Todos os campos da ficha ficam visíveis, sem
          abas escondidas.
        </Text>
        <Text style={styles.label}>Endereço da API</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>API key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Cole a chave"
          placeholderTextColor={colors.muted}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={styles.btn}
          disabled={loading}
          onPress={() => onEnter(apiKey.trim(), apiUrl.trim())}
        >
          <Text style={styles.btnText}>{loading ? "Entrando…" : "Entrar"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },
  eyebrow: { color: colors.gold, letterSpacing: 2, fontSize: 12, fontWeight: "700" },
  h1: { color: colors.text, fontSize: 28, fontWeight: "700", marginTop: 6, marginBottom: 8 },
  muted: { color: colors.muted, marginBottom: 18, lineHeight: 20 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#10141b",
    color: colors.text,
    borderRadius: 12,
    padding: 12,
  },
  error: { color: colors.bad, marginTop: 10 },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: colors.goldText, fontWeight: "800" },
});
