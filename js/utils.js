"use strict";

function getApiKey() {
  return localStorage.getItem(INSCRICAO_API_KEY_STORAGE) || "";
}

function setApiKey(key) {
  localStorage.setItem(INSCRICAO_API_KEY_STORAGE, String(key || "").trim());
}

async function apiGet(action, params = {}) {
  const key = getApiKey();
  const url = new URL(INSCRICAO_API_URL);
  url.searchParams.set("action", action);

  if (key) url.searchParams.set("api_key", key);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString());
  return res.json();
}

async function apiPost(body) {
  const key = getApiKey();
  const payload = Object.assign({ api_key: key }, body);

  const res = await fetch(INSCRICAO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

/* ========= HELPERS ========= */

/* ========= HELPERS ========= */
function currentProject() {
  return PROJECTS.find((p) => p.key === state.currentProjectKey) || PROJECTS[0];
}

function getVisibleNuclei(projectKey = state.currentProjectKey) {
  const user = currentUser?.();
  const all = PROJECT_NUCLEI[projectKey] || [];

  // ✅ colaborador (professor) vê só o núcleo dele
  if (user && user.role === "professor") {
    return user.nucleus ? [user.nucleus] : [];
  }

  // gestão/admin vê todos
  return all;
}

function labelRole(role) {
  if (role === "admin") return "Administrador";
  if (role === "gestao") return "Gestão Interna";
  if (role === "supervisao") return "Supervisão";
  return "Colaborador";
}

function isoToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(iso) {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

function safeLower(s) {
  return String(s || "").toLowerCase();
}

function normText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addOneHourToTime(start) {
  const [hh, mm] = String(start || "").split(":").map((value) => Number.parseInt(value, 10));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "";

  const total = (hh * 60 + mm + 60) % (24 * 60);
  const nextHour = String(Math.floor(total / 60)).padStart(2, "0");
  const nextMinute = String(total % 60).padStart(2, "0");
  return `${nextHour}:${nextMinute}`;
}

function toScheduleRange(start) {
  const end = addOneHourToTime(start);
  return end ? `${start} às ${end}` : String(start || "");
}

function getWeekdayLabel(dateISO) {
  if (!dateISO) return "";

  const date = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][date.getDay()] || "";
}

function uniqueScheduleValues(values) {
  const seen = new Set();
  return (values || []).filter((value) => {
    const key = String(value || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getNucleusScheduleOptions(nucleus, dateISO = "") {
  const weekday = getWeekdayLabel(dateISO);
  const config = typeof getNucleusScheduleConfig === "function"
    ? getNucleusScheduleConfig(String(nucleus || "").trim())
    : null;

  if (config) {
    if (dateISO && Array.isArray(config.exceptionsByDate?.[dateISO]) && config.exceptionsByDate[dateISO].length) {
      return uniqueScheduleValues(config.exceptionsByDate[dateISO]);
    }

    if (weekday && Array.isArray(config.standardByWeekday?.[weekday]) && config.standardByWeekday[weekday].length) {
      return uniqueScheduleValues(config.standardByWeekday[weekday]);
    }

    return uniqueScheduleValues(
      Object.values(config.standardByWeekday || {}).flatMap((items) => Array.isArray(items) ? items : [])
    );
  }

  const nucleusKey = String(nucleus || "").trim();
  const rule = NUCLEOS_AULAS[nucleusKey];
  if (!rule || !rule.modalidades) return [];

  const values = [];
  Object.values(rule.modalidades).forEach((modality) => {
    if (weekday && modality?.horarios?.[weekday]) {
      values.push(...modality.horarios[weekday]);
      return;
    }

    if (modality?.horarios && !weekday) {
      Object.values(modality.horarios).forEach((items) => values.push(...items));
      return;
    }

    if (Array.isArray(modality?.horariosBase)) {
      values.push(...modality.horariosBase.map(toScheduleRange));
    }
  });

  return uniqueScheduleValues(values);
}

function isoWeekKey(date = new Date()) {
  // ISO week: YYYY-Www
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function weekKeyFromIsoDate(dateIso) {
  const d = new Date(`${dateIso}T00:00:00`);
  return isoWeekKey(isNaN(d.getTime()) ? new Date() : d);
}

function snackEnabledForCurrentProject() {
  return state.currentProjectKey === SNACK_PROJECT_KEY;
}

function createSnackStockByProject() {
  // estrutura: project -> nucleus -> weekKey -> { lanche: number }
  const bag = {};
  PROJECTS.forEach((p) => {
    bag[p.key] = {};
    const nuclei = PROJECT_NUCLEI[p.key] || [];
    nuclei.forEach((n) => (bag[p.key][n] = {}));
  });
  return bag;
}

function ensureSnackWeekBag(projectKey, nucleus, weekKey) {
  if (!state.snackStockByProject[projectKey]) state.snackStockByProject[projectKey] = {};
  if (!state.snackStockByProject[projectKey][nucleus]) state.snackStockByProject[projectKey][nucleus] = {};
  const nuc = state.snackStockByProject[projectKey][nucleus];
  if (!nuc[weekKey]) nuc[weekKey] = { [SNACK_ITEM_KEY]: 0 };
  if (typeof nuc[weekKey][SNACK_ITEM_KEY] !== "number") nuc[weekKey][SNACK_ITEM_KEY] = 0;
  return nuc[weekKey];
}

function getSnackStock(projectKey, nucleus, weekKey) {
  const week = ensureSnackWeekBag(projectKey, nucleus, weekKey);
  return Number(week[SNACK_ITEM_KEY] || 0);
}

function adjustSnackStock(projectKey, nucleus, weekKey, delta) {
  const week = ensureSnackWeekBag(projectKey, nucleus, weekKey);
  const current = Number(week[SNACK_ITEM_KEY] || 0);
  const next = current + delta;

  if (next < 0) return { ok: false, msg: "Sem saldo suficiente para dar baixa." };

  week[SNACK_ITEM_KEY] = next;
  persist();
  return { ok: true, msg: `Saldo atualizado: ${next}` };
}

