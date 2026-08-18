import { DEFAULT_API_URL } from "./theme";
import { Lead, SearchParams } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class Api {
  constructor(public baseUrl: string, public apiKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = (data as { detail?: string }).detail || `Erro ${res.status}`;
      throw new ApiError(res.status, String(detail));
    }
    return data as T;
  }

  session() {
    return this.request<{ ok: boolean }>("/v1/session");
  }

  getLead(cnpj: string) {
    return this.request<Lead>(`/v1/leads/${cnpj}`);
  }

  search(params: SearchParams) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") q.set(key, String(value));
    });
    return this.request<{ count: number; items: Lead[] }>(`/v1/leads?${q}`);
  }

  cnaes(q: string) {
    return this.request<{ items: { codigo: string; descricao: string }[] }>(
      `/v1/cnaes?q=${encodeURIComponent(q)}`
    );
  }

  municipios(q: string) {
    return this.request<{ items: { codigo: string; descricao: string }[] }>(
      `/v1/municipios?q=${encodeURIComponent(q)}`
    );
  }

  registerDevice(token: string, platform: string) {
    return this.request("/v1/devices", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    });
  }

  testPush(token: string) {
    return this.request("/v1/notifications/test", {
      method: "POST",
      body: JSON.stringify({
        token,
        title: "Lead API",
        body: "Push funcionando. Consultas de CNPJ prontas neste aparelho.",
      }),
    });
  }
}

export function makeApi(url?: string, key?: string) {
  return new Api(url || DEFAULT_API_URL, key || "");
}
