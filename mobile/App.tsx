import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
import { Api, ApiError, makeApi } from "./src/api";
import { digits } from "./src/format";
import { registerForPush } from "./src/push";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { LeadScreen } from "./src/screens/LeadScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ResultsScreen } from "./src/screens/ResultsScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import {
  clearApiKey,
  getApiKey,
  getApiUrl,
  getFavorites,
  isFavorite,
  setApiKey,
  setApiUrl,
  toggleFavorite,
} from "./src/storage";
import { colors, DEFAULT_API_URL } from "./src/theme";
import { Lead, SearchParams } from "./src/types";

type Screen = "boot" | "login" | "search" | "results" | "lead" | "settings" | "favorites";

export default function App() {
  const [screen, setScreen] = useState<Screen>("boot");
  const [apiUrl, setUrlState] = useState(DEFAULT_API_URL);
  const [apiKey, setKeyState] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [params, setParams] = useState<SearchParams>({});
  const [lead, setLead] = useState<Lead | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [favorites, setFavorites] = useState<Lead[]>([]);
  const [from, setFrom] = useState<Screen>("search");
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState("");

  const api = useMemo(() => makeApi(apiUrl, apiKey), [apiUrl, apiKey]);

  useEffect(() => {
    (async () => {
      const key = await getApiKey();
      const url = (await getApiUrl()) || DEFAULT_API_URL;
      setKeyState(key);
      setUrlState(url);
      if (!key) {
        setScreen("login");
        return;
      }
      try {
        await new Api(url, key).session();
        setScreen("search");
      } catch {
        setScreen("login");
      }
    })();
  }, []);

  async function enter(key: string, url: string) {
    setBusy(true);
    setError("");
    try {
      await new Api(url || DEFAULT_API_URL, key).session();
      await setApiKey(key);
      await setApiUrl(url || DEFAULT_API_URL);
      setKeyState(key);
      setUrlState(url || DEFAULT_API_URL);
      setScreen("search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  async function runSearch(next: SearchParams, nextOffset = 0) {
    const cnpj = digits(next.q);
    setBusy(true);
    setError("");
    try {
      if (cnpj.length === 14 && !next.uf && !next.situacao && !next.cnae && !next.municipio) {
        const found = await api.getLead(cnpj);
        setLead(found);
        setFavorite(await isFavorite(found.cnpj));
        setFrom("search");
        setScreen("lead");
        return;
      }
      const data = await api.search({ ...next, limit: 20, offset: nextOffset });
      setParams(next);
      setOffset(nextOffset);
      setItems(data.items);
      setStatus(`${data.count} resultado(s) nesta página`);
      setScreen("results");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha na busca";
      if (screen === "search") setError(message);
      else setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  async function openLead(cnpj: string, origin: Screen) {
    setBusy(true);
    try {
      const found = await api.getLead(digits(cnpj));
      setLead(found);
      setFavorite(await isFavorite(found.cnpj));
      setFrom(origin);
      setScreen("lead");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Falha ao abrir ficha");
    } finally {
      setBusy(false);
    }
  }

  async function enablePush() {
    setPushStatus("Solicitando permissão…");
    try {
      const token = await registerForPush();
      if (!token) {
        setPushStatus("Permissão negada ou aparelho sem suporte a push.");
        return;
      }
      setPushToken(token);
      await api.registerDevice(token, Platform.OS);
      setPushStatus("Notificações ativas neste aparelho.");
    } catch (err) {
      setPushStatus(err instanceof Error ? err.message : "Falha ao ativar push");
    }
  }

  async function testPush() {
    if (!pushToken) {
      setPushStatus("Ative as notificações antes do teste.");
      return;
    }
    try {
      await api.testPush(pushToken);
      setPushStatus("Notificação de teste enviada.");
    } catch (err) {
      setPushStatus(err instanceof Error ? err.message : "Falha no teste de push");
    }
  }

  if (screen === "boot") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: StatusBar.currentHeight || 0 }}>
      {screen === "login" && <LoginScreen loading={busy} error={error} onEnter={enter} />}
      {screen === "search" && (
        <SearchScreen
          busy={busy}
          error={error}
          onSearch={(p) => runSearch(p, 0)}
          onOpenSettings={() => setScreen("settings")}
          onOpenFavorites={async () => {
            setFavorites(await getFavorites());
            setScreen("favorites");
          }}
        />
      )}
      {screen === "results" && (
        <ResultsScreen
          items={items}
          status={status}
          canPrev={offset > 0}
          canNext={items.length >= 20}
          onBack={() => setScreen("search")}
          onPrev={() => runSearch(params, Math.max(0, offset - 20))}
          onNext={() => runSearch(params, offset + 20)}
          onOpen={(cnpj) => openLead(cnpj, "results")}
        />
      )}
      {screen === "lead" && lead && (
        <LeadScreen
          lead={lead}
          favorite={favorite}
          onBack={() => setScreen(from)}
          onToggleFavorite={async () => {
            const now = await toggleFavorite(lead);
            setFavorite(now);
          }}
        />
      )}
      {screen === "favorites" && (
        <FavoritesScreen
          items={favorites}
          onBack={() => setScreen("search")}
          onOpen={(cnpj) => openLead(cnpj, "favorites")}
        />
      )}
      {screen === "settings" && (
        <SettingsScreen
          apiUrl={apiUrl}
          apiKey={apiKey}
          pushToken={pushToken}
          pushStatus={pushStatus}
          onChangeUrl={setUrlState}
          onChangeKey={setKeyState}
          onSave={async () => {
            await setApiUrl(apiUrl);
            await setApiKey(apiKey);
            setPushStatus("Conexão salva.");
          }}
          onEnablePush={enablePush}
          onTestPush={testPush}
          onBack={() => setScreen("search")}
          onLogout={async () => {
            await clearApiKey();
            setScreen("login");
          }}
        />
      )}
    </View>
  );
}
