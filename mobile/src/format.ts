const SITUACAO: Record<string, string> = {
  "01": "Nula",
  "02": "Ativa",
  "03": "Suspensa",
  "04": "Inapta",
  "08": "Baixada",
};
const PORTE: Record<string, string> = {
  "00": "Não informado",
  "01": "Microempresa",
  "03": "Empresa de pequeno porte",
  "05": "Demais",
};
const MATRIZ: Record<string, string> = { "1": "Matriz", "2": "Filial" };
const TIPO_SOCIO: Record<string, string> = {
  "1": "Pessoa física",
  "2": "Pessoa jurídica",
  "3": "Estrangeiro",
};
const FAIXA: Record<string, string> = {
  "0": "Não se aplica",
  "1": "0 a 12 anos",
  "2": "13 a 20 anos",
  "3": "21 a 30 anos",
  "4": "31 a 40 anos",
  "5": "41 a 50 anos",
  "6": "51 a 60 anos",
  "7": "61 a 70 anos",
  "8": "71 a 80 anos",
  "9": "Mais de 80 anos",
};

export function digits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

export function dash(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function labeled(code?: string | null, map?: Record<string, string>, extra?: string | null) {
  if (!code && !extra) return "—";
  const name = (extra && extra.trim()) || (code ? map?.[code] : "");
  if (code && name) return `${code} · ${name}`;
  return name || code || "—";
}

export function formatCnpj(value?: string | null) {
  const d = digits(value).padStart(14, "0").slice(0, 14);
  if (d.length !== 14) return dash(value);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatDate(value?: string | null) {
  if (!value || value.length !== 8) return dash(value);
  return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`;
}

export function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatCep(value?: string | null) {
  const d = digits(value);
  if (d.length !== 8) return dash(value);
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatPhone(ddd?: string | null, numero?: string | null) {
  if (!numero) return "—";
  return ddd ? `(${ddd}) ${numero}` : numero;
}

export function simNao(value?: string | null) {
  if (!value) return "—";
  if (value.toUpperCase() === "S") return "S · Sim";
  if (value.toUpperCase() === "N") return "N · Não";
  return value;
}

export const maps = { SITUACAO, PORTE, MATRIZ, TIPO_SOCIO, FAIXA };
