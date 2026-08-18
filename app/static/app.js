const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const KEY = "lead_api_key";
const LIMIT = 20;

const loginEl = document.getElementById("login");
const appEl = document.getElementById("app");
const rowsEl = document.getElementById("rows");
const statusEl = document.getElementById("status");
const drawerEl = document.getElementById("drawer");
const detailEl = document.getElementById("detail");
const pageLabel = document.getElementById("page-label");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let offset = 0;
let lastCount = 0;

function apiKey() {
  return localStorage.getItem(KEY) || "";
}

function showApp(logged) {
  loginEl.classList.toggle("hidden", logged);
  appEl.classList.toggle("hidden", !logged);
}

async function request(path) {
  const res = await fetch(path, { headers: { "X-API-Key": apiKey() } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem(KEY);
    showApp(false);
    throw new Error("API key inválida");
  }
  if (!res.ok) {
    throw new Error(data.detail || `Erro ${res.status}`);
  }
  return data;
}

function digits(value) {
  return (value || "").replace(/\D/g, "");
}

function formatCnpj(value) {
  const d = digits(value).padStart(14, "0").slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatDate(value) {
  if (!value || value.length !== 8) return value || "—";
  return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`;
}

function formatMoney(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function phone(ddd, numero) {
  if (!numero) return null;
  return ddd ? `(${ddd}) ${numero}` : numero;
}

function badge(sit, desc) {
  const cls = sit === "02" ? "ok" : sit === "08" || sit === "01" ? "bad" : "warn";
  return `<span class="badge ${cls}">${desc || sit || "—"}</span>`;
}

function copyBtn(label, value) {
  if (!value) return "";
  return `<button class="ghost copy" type="button" data-copy="${encodeURIComponent(value)}">${label}</button>`;
}

function fillUfs() {
  const sel = document.getElementById("uf");
  for (const uf of UFS) {
    const opt = document.createElement("option");
    opt.value = uf;
    opt.textContent = uf;
    sel.append(opt);
  }
}

async function login() {
  const input = document.getElementById("api-key-input");
  const err = document.getElementById("login-error");
  err.textContent = "";
  localStorage.setItem(KEY, input.value.trim());
  try {
    await request("/v1/session")
    showApp(true);
  } catch (e) {
    localStorage.removeItem(KEY);
    err.textContent = e.message;
  }
}

function formParams() {
  const q = document.getElementById("q").value.trim();
  const uf = document.getElementById("uf").value;
  const situacao = document.getElementById("situacao").value;
  const cnae = digits(document.getElementById("cnae").value);
  const municipio = digits(document.getElementById("municipio").value);
  return { q, uf, situacao, cnae, municipio };
}

async function search(reset) {
  if (reset) offset = 0;
  const { q, uf, situacao, cnae, municipio } = formParams();
  const cnpj = digits(q);
  statusEl.textContent = "Buscando…";
  rowsEl.innerHTML = "";

  try {
    if (cnpj.length === 14 && !uf && !situacao && !cnae && !municipio) {
      const lead = await request(`/v1/leads/${cnpj}`);
      lastCount = 1;
      renderRows([lead]);
      openDetail(lead.cnpj);
      statusEl.textContent = "1 resultado";
      updatePager();
      return;
    }

    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
    if (q) params.set("q", q);
    if (uf) params.set("uf", uf);
    if (situacao) params.set("situacao", situacao);
    if (cnae) params.set("cnae", cnae);
    if (municipio) params.set("municipio", municipio);

    const data = await request(`/v1/leads?${params}`);
    lastCount = data.count;
    renderRows(data.items || []);
    statusEl.textContent = lastCount
      ? `${lastCount} resultado(s) nesta página`
      : "Nenhum resultado";
  } catch (e) {
    lastCount = 0;
    statusEl.textContent = e.message;
  }
  updatePager();
}

function renderRows(items) {
  rowsEl.innerHTML = "";
  for (const item of items) {
    const tr = document.createElement("tr");
    const tel = phone(item.ddd1, item.telefone1) || item.correio_eletronico || "—";
    tr.innerHTML = `
      <td>${formatCnpj(item.cnpj)}</td>
      <td>${item.nome_fantasia || item.razao_social || "—"}<br><span class="muted">${item.razao_social || ""}</span></td>
      <td>${item.uf || "—"}</td>
      <td>${item.municipio || "—"}</td>
      <td>${badge(item.situacao_cadastral, item.situacao_cadastral_desc)}</td>
      <td>${tel}</td>
    `;
    tr.addEventListener("click", () => openDetail(item.cnpj));
    rowsEl.append(tr);
  }
}

function updatePager() {
  const page = Math.floor(offset / LIMIT) + 1;
  pageLabel.textContent = lastCount ? `Página ${page}` : "—";
  prevBtn.disabled = offset <= 0;
  nextBtn.disabled = lastCount < LIMIT;
}

async function openDetail(cnpj) {
  drawerEl.hidden = false;
  detailEl.innerHTML = "<p class='muted'>Carregando ficha…</p>";
  try {
    const lead = await request(`/v1/leads/${digits(cnpj)}`);
    const tel1 = phone(lead.ddd1, lead.telefone1);
    const tel2 = phone(lead.ddd2, lead.telefone2);
    const socios = (lead.socios || [])
      .map((s) => `
        <div class="socio">
          <strong>${s.nome_socio || "—"}</strong><br>
          <span class="muted">${s.qualificacao_socio_desc || ""} · ${s.cnpj_cpf_socio || ""}</span>
        </div>
      `)
      .join("") || "<p class='muted'>Sem sócios cadastrados.</p>";

    detailEl.innerHTML = `
      <p class="eyebrow">${formatCnpj(lead.cnpj)}</p>
      <h2>${lead.nome_fantasia || lead.razao_social || "Empresa"}</h2>
      <p class="muted">${lead.razao_social || ""}</p>
      <p>${badge(lead.situacao_cadastral, lead.situacao_cadastral_desc)}</p>
      <div class="actions">
        ${copyBtn("Copiar CNPJ", lead.cnpj)}
        ${copyBtn("Copiar telefone", tel1)}
        ${copyBtn("Copiar e-mail", lead.correio_eletronico)}
      </div>
      <dl class="kv">
        <dt>CNAE</dt><dd>${lead.cnae_fiscal || "—"} · ${lead.cnae_fiscal_desc || ""}</dd>
        <dt>Porte</dt><dd>${lead.porte_empresa || "—"}</dd>
        <dt>Capital</dt><dd>${formatMoney(lead.capital_social)}</dd>
        <dt>Natureza</dt><dd>${lead.natureza_juridica_desc || lead.natureza_juridica || "—"}</dd>
        <dt>Início</dt><dd>${formatDate(lead.data_inicio_atividades)}</dd>
        <dt>Simples</dt><dd>${lead.opcao_simples || "—"} · MEI ${lead.opcao_mei || "—"}</dd>
        <dt>Endereço</dt><dd>${[lead.tipo_logradouro, lead.logradouro, lead.numero, lead.bairro, lead.municipio, lead.uf, lead.cep].filter(Boolean).join(", ")}</dd>
        <dt>Telefone</dt><dd>${tel1 || "—"} ${tel2 ? " / " + tel2 : ""}</dd>
        <dt>E-mail</dt><dd>${lead.correio_eletronico || "—"}</dd>
      </dl>
      <h3>Sócios</h3>
      ${socios}
    `;
  } catch (e) {
    detailEl.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

async function suggest(kind, q) {
  if (!q || q.length < 2) return;
  const path = kind === "cnae" ? `/v1/cnaes?q=${encodeURIComponent(q)}` : `/v1/municipios?q=${encodeURIComponent(q)}`;
  try {
    const data = await request(path);
    const list = document.getElementById(`${kind}-list`);
    list.innerHTML = (data.items || [])
      .map((item) => `<option value="${item.codigo}">${item.codigo} — ${item.descricao}</option>`)
      .join("");
  } catch {
    /* ignore autocomplete errors */
  }
}

document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("api-key-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem(KEY);
  showApp(false);
});
document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  search(true);
});
document.getElementById("close-drawer").addEventListener("click", () => {
  drawerEl.hidden = true;
});
prevBtn.addEventListener("click", () => {
  offset = Math.max(0, offset - LIMIT);
  search(false);
});
nextBtn.addEventListener("click", () => {
  offset += LIMIT;
  search(false);
});
document.getElementById("cnae").addEventListener("input", (e) => suggest("cnae", e.target.value));
document.getElementById("municipio").addEventListener("input", (e) => suggest("municipio", e.target.value));
detailEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
    const original = btn.textContent;
    await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.copy));
    btn.textContent = "Copiado";
    setTimeout(() => {
      btn.textContent = original;
    }, 900);
});

fillUfs();
if (apiKey()) {
  request("/v1/session")
    .then(() => showApp(true))
    .catch(() => showApp(false));
} else {
  showApp(false);
}
