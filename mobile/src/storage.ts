import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lead } from "./types";

const KEY = "lead_api_key";
const URL = "lead_api_url";
const FAV = "lead_favorites";

export async function getApiKey() {
  return (await SecureStore.getItemAsync(KEY)) || "";
}
export async function setApiKey(value: string) {
  await SecureStore.setItemAsync(KEY, value);
}
export async function clearApiKey() {
  await SecureStore.deleteItemAsync(KEY);
}
export async function getApiUrl() {
  return (await SecureStore.getItemAsync(URL)) || "";
}
export async function setApiUrl(value: string) {
  await SecureStore.setItemAsync(URL, value.replace(/\/$/, ""));
}

export async function getFavorites(): Promise<Lead[]> {
  const raw = await AsyncStorage.getItem(FAV);
  return raw ? JSON.parse(raw) : [];
}
export async function toggleFavorite(lead: Lead) {
  const all = await getFavorites();
  const exists = all.some((item) => item.cnpj === lead.cnpj);
  const next = exists ? all.filter((item) => item.cnpj !== lead.cnpj) : [lead, ...all].slice(0, 100);
  await AsyncStorage.setItem(FAV, JSON.stringify(next));
  return !exists;
}
export async function isFavorite(cnpj: string) {
  const all = await getFavorites();
  return all.some((item) => item.cnpj === cnpj);
}
