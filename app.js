"use strict";

// ✅ 1) URL da API (uma vez só)
window.INSCRICOES_API_URL =
  window.INSCRICOES_API_URL ||
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";

// ✅ 2) cria a constante que seu código usa no fetch()
const INSCRICOES_API_URL = window.INSCRICOES_API_URL;

// ===== ÍCONES (Mostrar/Ocultar senha) =====
const ICON_EYE_OPEN = `
...seu svg...
`;

const ICON_EYE_CLOSED = `
...seu svg...
`;

if (!crypto.randomUUID) {
  crypto.randomUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}
// =========================
// ESTOQUE DE LANCHES (SEMANAL)
// só Supergasbras: Freguesia + Realengo
// =========================
const SNACK_PROJECT_KEY = "supergasbras";
const SNACK_NUCLEI = ["Freguesia", "Realengo"];
const SNACK_ITEM_KEY = "lanche"; // 1 item por enquanto
const STORAGE_KEY = "iin-system-v9_2";
const SESSION_KEY = "iin-session-v9_2";
const REPORT_PREFS_KEY = "iin-report-prefs-v2";
const API_BASE = "http://localhost:3000/api";
const INSCRICAO_API_URL = "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";
const INSCRICAO_API_KEY_STORAGE = "iin_api_key_admin";
const PROJECTS = [
  {
    key: "light",
    label: "Light",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA ESCOLA DA VIDA ANO 3 - LIGHT ANO 2",
  },
  {
    key: "enel",
    label: "Enel",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA: ESCOLA DA VIDA ANO 4 - ENEL ANO 2",
  },
  {
    key: "supergasbras",
    label: "Supergasbras",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA: ESCOLA DA VIDA RIO DE JANEIRO - SUPERGASBRAS ANO 2",
  },
];

const PROJECT_NUCLEI = {
  light: ["Campo Grande", "Jacarezinho", "Penha", "Santa Cruz"],
  enel: ["Macaé"],
  supergasbras: ["Freguesia", "Realengo"],
};

const PROJECT_MODALITIES = {
  light: ["Boxe", "Muay Thai", "Jiu Jitso"],
  enel: ["Jiu Jitso", "Muay Thai"],
  supergasbras: ["Boxe", "Jiu Jitso"],
};

const STOCK_CATEGORIES = [
  { key: "camiseta", label: "Camiseta" },
  { key: "shorts", label: "Shorts" },
  { key: "kimono", label: "Kimono" },
  { key: "bandagem", label: "Bandagem" },
  { key: "protetor_bucal", label: "Protetor bucal" },
];

const MODALITY_ITEMS = {
  "Jiu Jitso": ["camiseta", "kimono"],
  Boxe: ["camiseta", "shorts", "bandagem", "protetor_bucal"],
  "Muay Thai": ["camiseta", "shorts", "bandagem", "protetor_bucal"],
};

const MESTRE_THEMES = [
  "disciplina",
  "respeito",
  "trabalho_em_equipe",
  "amor",
  "meio_ambiente",
  "cultura",
  "saude_autocuidado",
  "projeto_de_vida",
  "esporte_movimento",
  "artes_criatividade",
  "educacao_emocional",
  "leitura_letramento",
];

const CUSTOM_FIELDS = [
  { key: "cpf", label: "CPF do aluno" },
  { key: "birthDate", label: "Data nascimento" },
  { key: "age", label: "Idade" },
  { key: "gender", label: "Gênero" },
  { key: "uf", label: "UF" },
  { key: "address", label: "Endereço/Bairro" },
  { key: "zip", label: "CEP" },
  { key: "pcd", label: "PCD" },
  { key: "parents", label: "Nome mãe/pai" },
  { key: "school", label: "Escola / ano" },
  { key: "uniform", label: "Tamanho uniforme" },
  { key: "nucleus", label: "Núcleo" },
  { key: "modality", label: "Modalidade" },
  { key: "guardianCpf", label: "CPF responsável" },
  { key: "guardianEmail", label: "E-mail responsável" },
  { key: "guardianContact", label: "Contato responsável" },
  { key: "enrollDate", label: "Data inscrição" },
  { key: "schedule", label: "Turma/Horário" },
];

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

const SUPERVISAO_CHECKLIST_DIARIO = [
  "Pontualidade",
  "Uniformes",
  "Organização dos Calçados",
  "Formação e Chamada",
  "Introdução ao Tema do Mês",
  "Mobilidade",
  "Aquecimento",
  "Atividade Lúdica/Física",
  "Técnica do Dia",
  "Momento do Mestre",
  "Compromisso IIN",
  "Foto da Turma",
  "Conversa Privada",
  "Relatórios Diários",
];

const SUPERVISAO_METODOLOGIA_INSTRUTORES = [
  "Pontualidade",
  "Uniforme",
  "Parte Lúdica",
  "Parte Técnica",
  "Postura em aula",
  "Compromisso IIN",
  "Momento do Mestre",
  "Conversa privada",
  "Fotos para o relatório",
  "Relatórios Completos",
];

const SUPERVISAO_METODOLOGIA_TURMAS = [
  "Arrumação da sala",
  "Conservação dos uniformes",
  "Organização dos calçados",
  "Limpeza do espaço",
  "Alinhamento e formação da turma",
  "Disciplina dos alunos",
  "Controle dos alunos",
  "Adaptação dos conteúdos",
  "Suporte às necessidades dos alunos",
  "Documentação adequada",
];

// ✅ AULAS (EAD) - suporte a YouTube e Google Drive
function normalizeVideoUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return { ok: false, error: "Cole um link de vídeo." };

  // YouTube (watch?v= / youtu.be / shorts)
  const ytMatch =
    raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);

  if (ytMatch) {
    const id = ytMatch[1];
    return {
      ok: true,
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Google Drive (file/d/ID/view)
  const gdMatch =
    raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/i) ||
    raw.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,})/i) ||
    raw.match(/drive\.google\.com\/uc\?id=([A-Za-z0-9_-]{10,})/i);

  if (gdMatch) {
    const id = gdMatch[1];
    return {
      ok: true,
      provider: "gdrive",
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumb: "",
    };
  }

  return { ok: false, error: "Link inválido. Use YouTube ou Google Drive (arquivo de vídeo)." };
}

function buildSupervisaoStatusSelect(name) {
  return `
    <select class="supervisao-status-select" name="${name}">
      <option value="">-</option>
      <option value="sim">✔</option>
      <option value="parcial">•</option>
      <option value="nao">✖</option>
    </select>
  `;
}

function buildSupervisaoNotaSelect(name) {
  return `
    <select class="supervisao-nota-select" name="${name}">
      <option value="">-</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
    </select>
  `;
}

function renderSupervisaoTables() {
  const diarioBody = el("supervisaoChecklistDiarioBody");
  const instrutoresBody = el("supervisaoMetodologiaInstrutoresBody");
  const turmasBody = el("supervisaoMetodologiaTurmasBody");

  if (diarioBody) {
    diarioBody.innerHTML = SUPERVISAO_CHECKLIST_DIARIO.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t1`)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t2`)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t3`)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t4`)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t5`)}</td>
        <td>${buildSupervisaoStatusSelect(`diario_${index}_t6`)}</td>
      </tr>
    `).join("");
  }

  if (instrutoresBody) {
    instrutoresBody.innerHTML = SUPERVISAO_METODOLOGIA_INSTRUTORES.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item)}</td>
        <td>${buildSupervisaoNotaSelect(`instrutor_${index}_s1`)}</td>
        <td>${buildSupervisaoNotaSelect(`instrutor_${index}_s2`)}</td>
        <td>${buildSupervisaoNotaSelect(`instrutor_${index}_s3`)}</td>
        <td>${buildSupervisaoNotaSelect(`instrutor_${index}_s4`)}</td>
        <td>${buildSupervisaoNotaSelect(`instrutor_${index}_s5`)}</td>
      </tr>
    `).join("");
  }

  if (turmasBody) {
    turmasBody.innerHTML = SUPERVISAO_METODOLOGIA_TURMAS.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item)}</td>
        <td>${buildSupervisaoNotaSelect(`turma_${index}_s1`)}</td>
        <td>${buildSupervisaoNotaSelect(`turma_${index}_s2`)}</td>
        <td>${buildSupervisaoNotaSelect(`turma_${index}_s3`)}</td>
        <td>${buildSupervisaoNotaSelect(`turma_${index}_s4`)}</td>
        <td>${buildSupervisaoNotaSelect(`turma_${index}_s5`)}</td>
      </tr>
    `).join("");
  }
}

function hydrateSupervisaoNucleo() {
  const select = el("supervisaoNucleo");
  if (!select) return;

  const atual = select.value || "";
  select.innerHTML = `<option value="">Selecione</option>`;

  getVisibleNuclei().forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    select.appendChild(opt);
  });

  if ([...select.options].some((o) => o.value === atual)) {
    select.value = atual;
  }
}

function ensureLessonsBag(projectKey = state.currentProjectKey) {
  if (!state.lessonsByProject[projectKey]) state.lessonsByProject[projectKey] = [];
  return state.lessonsByProject[projectKey];
}

const state = {
  students: [],
  visitors: [],
  users: [],
  history: [],
  uniformStockByProject: {},
  snackStockByProject: {},
  classDaysByProject: {},
  attendanceStaffByProject: {},
  planningByProject: {},
  classLocksByProject: {},
  nucleusLogsByProject: {},
  mestreDocsByProject: {},
  settingsByProject: {},
  supervisaoByProject: {},
  reportPrefs: { printType: "completo", fields: {} },

  // Aulas
  lessonsByProject: {},
  lessonUI: { selectedId: null, search: "", category: "", level: "" },

  sessionUserId: null,
  currentProjectKey: "light",
  search: "",
  attendanceFilter: "todos",
  uniformFilter: "todos",
  activeTab: "tab-dashboard",
};

function el(id) { return document.getElementById(id); }

// usado no seletor [data-...] do estoque
const cssEscape = (s) =>
  (window.CSS && CSS.escape)
    ? CSS.escape(String(s))
    : String(s).replace(/"/g, '\\"');

const ui = {
  // login/app
  loginScreen: el("loginScreen"),
  appShell: el("appShell"),
  loginForm: el("loginForm"),
  loginUsername: el("loginUsername"),
  loginPassword: el("loginPassword"),
  loginProject: el("loginProject"),
  loginMessage: el("loginMessage"),
  logoutBtn: el("logoutBtn"),
  welcomeTitle: el("welcomeTitle"),
  projectSubtitle: el("projectSubtitle"),

    /// tabs
tabsBar: el("tabsBar"),
tabPages: [
  "tab-dashboard",
  "tab-chamada",
  "tab-professor",
  "tab-aulas",
  "tab-gestao",
  "tab-estoque",
  "tab-relatorios",
  "tab-admin",
  "tab-fila",
  "tab-supervisao",
].map(el),
    // aulas (EAD)
  aulasBadge: el("aulasBadge"),
  aulasSearch: el("aulasSearch"),
  aulasCategory: el("aulasCategory"),
  aulasLevel: el("aulasLevel"),
  aulasGrid: el("aulasGrid"),
  aulaPlayer: el("aulaPlayer"),
  aulaMetaBadge: el("aulaMetaBadge"),

  // dashboard
  dashBadge: el("dashBadge"),
  totalStudents: el("totalStudents"),
  presentCount: el("presentCount"),
  absentCount: el("absentCount"),
  uniformDelivered: el("uniformDelivered"),
  nucleusCounts: el("nucleusCounts"),
  nucleusCountBadge: el("nucleusCountBadge"),
  dashNucleusFilter: el("dashNucleusFilter"),
  dashChart: el("dashChart"),
  dashMiniChart: el("dashMiniChart"),
  dashMiniBadge: el("dashMiniBadge"),
  dashShowFixed: el("dashShowFixed"),
  dashShowVisitors: el("dashShowVisitors"),
  dashShowPCD: el("dashShowPCD"),

  // professor
  professorNucleusBadge: el("professorNucleusBadge"),
  professorBoard: el("professorBoard"),
  professorHistory: el("professorHistory"),
  professorHistoryDate: el("professorHistoryDate"),
  attendanceSearch: el("attendanceSearch"),
  attendanceCardTemplate: el("attendanceCardTemplate"),

  professorClassDate: el("professorClassDate"),
  professorClassSchedule: el("professorClassSchedule"),
  professorClassProfessorName: el("professorClassProfessorName"),
  professorClassMonitorName: el("professorClassMonitorName"),
  professorClassSave: el("professorClassSave"),
  professorClassStatus: el("professorClassStatus"),
  endClassBtn: el("endClassBtn"),
  classLockBadge: el("classLockBadge"),

  planningForm: el("planningForm"),
  planningWeek: el("planningWeek"),
  planningTheme: el("planningTheme"),
  planningGoals: el("planningGoals"),
  planningActivities: el("planningActivities"),
  planningList: el("planningList"),

  teacherAbsType: el("teacherAbsType"),
  teacherAbsStudentWrap: el("teacherAbsStudentWrap"),
  teacherAbsStudent: el("teacherAbsStudent"),
  teacherAbsFile: el("teacherAbsFile"),
  teacherAbsSave: el("teacherAbsSave"),

  teacherMestreTheme: el("teacherMestreTheme"),
  teacherMestreOpen: el("teacherMestreOpen"),

  teacherWhatsappBtn: el("teacherWhatsappBtn"),
  teacherWhatsappCopy: el("teacherWhatsappCopy"),

  // gestão
  studentForm: el("studentForm"),
  studentSchedule: el("studentSchedule"),
  studentModality: el("studentModality"),
  gestaoAlunoBusca: el("gestaoAlunoBusca"),
  gestaoAlunoFiltroNucleo: el("gestaoAlunoFiltroNucleo"),
  gestaoAlunoFiltroModalidade: el("gestaoAlunoFiltroModalidade"),
  gestaoAlunosTableBody: el("gestaoAlunosTableBody"),
  gestaoAlunosBadge: el("gestaoAlunosBadge"),

  classCalendarForm: el("classCalendarForm"),
  classCalendarBoard: el("classCalendarBoard"),
  calendarStartTimes: Array.from({ length: 6 }, (_, i) => el(`calendarStartTime${i + 1}`)),
  calendarEndTimes: Array.from({ length: 6 }, (_, i) => el(`calendarEndTime${i + 1}`)),

  attendanceNucleusFilter: el("attendanceNucleusFilter"),
  attendanceReportBoard: el("attendanceReportBoard"),

  uniformNucleusFilter: el("uniformNucleusFilter"),
  uniformTableBody: el("uniformTableBody"),

  stockView: el("stockView"),
  alertsBoard: el("alertsBoard"),

  whatsForm: el("whatsForm"),
  whatsStudent: el("whatsStudent"),
  whatsMessage: el("whatsMessage"),
  whatsStatus: el("whatsStatus"),

  visitorsBadge: el("visitorsBadge"),
  visitorForm: el("visitorForm"),
  visitorName: el("visitorName"),
  visitorNucleus: el("visitorNucleus"),
  visitorDate: el("visitorDate"),
  visitorContact: el("visitorContact"),
  visitorNotes: el("visitorNotes"),
  visitorsList: el("visitorsList"),

  // estoque lanches
  snackDate: el("snackDate"),
  snackTodayBtn: el("snackTodayBtn"),
  snackNucleusFilter: el("snackNucleusFilter"),
  snackCards: el("snackCards"),
  snackHistoryList: el("snackHistoryList"),
  snackHistoryBadge: el("snackHistoryBadge"),
  snackStatus: el("snackStatus"),
  snackBadge: el("snackBadge"),

  // admin
  userForm: el("userForm"),
  usersTableBody: el("usersTableBody"),
  newRole: el("newRole"),
  stockForm: el("stockForm"),

  adminReportPeriod: el("adminReportPeriod"),
  adminReportNucleusFilter: el("adminReportNucleusFilter"),
  adminReportRangeInfo: el("adminReportRangeInfo"),
  adminGenerateReportBtn: el("adminGenerateReportBtn"),
  adminPrintReportBtn: el("adminPrintReportBtn"),
  adminReportStatus: el("adminReportStatus"),
  printType: el("printType"),
  printCustomBox: el("printCustomBox"),
  printFieldsGrid: el("printFieldsGrid"),

  adminMestreTheme: el("adminMestreTheme"),
  adminMestreFile: el("adminMestreFile"),
  adminMestreSave: el("adminMestreSave"),
  adminMestreTableBody: el("adminMestreTableBody"),

  adminLogNucleusFilter: el("adminLogNucleusFilter"),
  adminOpenLogModal: el("adminOpenLogModal"),

  // modais
  logModal: el("logModal"),
  logModalTitle: el("logModalTitle"),
  logModalClose: el("logModalClose"),
  logModalBody: el("logModalBody"),

  pdfModal: el("pdfModal"),
  pdfModalTitle: el("pdfModalTitle"),
  pdfModalClose: el("pdfModalClose"),
  pdfFrame: el("pdfFrame"),
};

// ✅ AULAS (EAD) - categorias fixas
const LESSON_CATEGORIES = [
  "Boxe",
  "Muay Thai",
  "Jiu-Jitsu",
  "MMA (introdução)",
  "Defesa Pessoal",
  "Wrestling (noções)",
  "Judô (quedas básicas)",
  "Fundamentos",
  "Técnicas",
  "Combinações",
  "Drills (repetição)",
  "Alongamento",
  "Mobilidade",
  "Condicionamento",
  "Coordenação",
  "Aeróbico / Cardio",
  "Força (base)",
  "Core (abdômen)",
];

function hydrateAulasCategoryOptions() {
  if (!ui.aulasCategory) return;

  const current = ui.aulasCategory.value || "";
  ui.aulasCategory.innerHTML = `<option value="">Todas as categorias</option>`;

  LESSON_CATEGORIES.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    ui.aulasCategory.appendChild(opt);
  });

  if ([...ui.aulasCategory.options].some((o) => o.value === current)) {
    ui.aulasCategory.value = current;
  } else {
    ui.aulasCategory.value = "";
  }
}

function enhanceFormsAndTheme() {
  try { patchSchoolTypeOptions?.(); } catch {}
  try { patchSizeDropdowns?.(); } catch {}
  try { patchVisitorBirthDateField?.(); } catch {}
  try { patchVisitorFormButtons?.(); } catch {}
}

// =========================
// ALERTAS (FALTAS / FREQUÊNCIA) + WHATSAPP
// =========================
const ALERT_FALTAS_WARN = 3;
const ALERT_FALTAS_CRIT = 5;
const ALERT_FREQ_CRIT_PCT = 60;
const ALERT_MIN_AULAS = 5;

/* ========= INIT ========= */
init();

function init() {
  injectRuntimeStyles();
  loadReportPrefs();
  loadData();
  loadSession();

  hydrateProjectSelects();
  hydrateNucleusSelects();
  hydrateAulasCategoryOptions();      
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  hydratePrintFieldsUI();
  ensureAdminExtraPanels();
  hydrateLessonAdminCategorySelect();
  renderAdminLessonsTable();
  renderLessonsGrid();
  hydrateSupervisaoNucleo();
  renderSupervisaoTables();

  enhanceFormsAndTheme();

  bindEvents();
  initFilaAdmin();
  render();
  updateReportRangeInfo();
}

document.getElementById("queueReload")?.addEventListener("click", loadQueueAdmin);
document.getElementById("queueKeyBtn")?.addEventListener("click", () => {
  const k = prompt("Cole a API Key do Apps Script:");
  if (k) setApiKey(k);
  updateKeyStatusUI();
  loadQueueAdmin();
});
document.getElementById("queueModalClose")?.addEventListener("click", closeModal);
document.getElementById("queueModal")?.addEventListener("click", (e) => {
  if (e.target && e.target.id === "queueModal") closeModal();
});

document.getElementById("queueSearch")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadQueueAdmin();
});
document.getElementById("queueStatus")?.addEventListener("change", loadQueueAdmin);
document.getElementById("queueArchived")?.addEventListener("change", loadQueueAdmin);

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

/* =========================
   ABA ESTOQUE • LANCHES
========================= */

function snackVisibleNuclei() {
  if (state.currentProjectKey !== SNACK_PROJECT_KEY) return [];

  const user = currentUser?.();

  // Admin/Gestão vê os núcleos do snack
  if (!user || user.role === "admin" || user.role === "gestao") {
    return SNACK_NUCLEI.slice();
  }

  // Professor só vê o próprio núcleo (se for Freguesia/Realengo)
  if (user.role === "professor") {
    const my = normText(user.nucleus);
    const match = SNACK_NUCLEI.find((n) => normText(n) === my);
    return match ? [match] : [];
  }

  return [];
}

function snackEditMode() {
  const user = currentUser?.();
  if (!user) return "none";
  if (user.role === "admin" || user.role === "gestao") return "admin";

  // ✅ qualquer colaborador no projeto Supergasbras pode dar baixa
  if (user.role === "professor" && snackEnabledForCurrentProject()) {
    return "prof";
  }
  return "none";
}

function snackCanEdit() {
  // mantém compatibilidade com seu código atual
  return snackEditMode() !== "none";
}

function hydrateSnackControls() {
  if (!ui.snackDate || !ui.snackNucleusFilter) return;

  // Só faz sentido no Supergasbras
  if (state.currentProjectKey !== SNACK_PROJECT_KEY) {
    ui.snackNucleusFilter.innerHTML = "";
    ui.snackNucleusFilter.disabled = true;
    return;
  }

  // Data default
  if (!ui.snackDate.value) ui.snackDate.value = isoToday();

  const user = currentUser?.();
  const isProf = user?.role === "professor";

  // Núcleos fixos do Supergasbras
  const nuclei = SNACK_NUCLEI.slice();

  // Mantém seleção se existir, senão tenta o núcleo do usuário, senão 1º da lista
  const currentRaw = ui.snackNucleusFilter.value || "";
  const userNucleus = String(user?.nucleus || "").trim();
  const preferred =
    nuclei.includes(currentRaw) ? currentRaw :
    (nuclei.includes(userNucleus) ? userNucleus : nuclei[0]);

  // Monta opções
  ui.snackNucleusFilter.innerHTML = "";

  // Admin/Gestão pode ver "Todos"
  if (!isProf) ui.snackNucleusFilter.innerHTML += `<option value="todos">Todos</option>`;

  ui.snackNucleusFilter.innerHTML += nuclei
    .map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`)
    .join("");

  // Aplica valor final
  if (!isProf) {
    // admin/gestão: mantém "todos" se estava, senão usa preferred
    ui.snackNucleusFilter.value = currentRaw === "todos" ? "todos" : preferred;
  } else {
    // professor: sempre 1 núcleo (selecionável)
    ui.snackNucleusFilter.value = preferred;
  }

  // ✅ Você pediu que o professor consiga selecionar
  ui.snackNucleusFilter.disabled = false;
}

function renderSnackHistory(weekKey) {
  if (!ui.snackHistoryList || !ui.snackHistoryBadge) return;

  const nucleiAll = snackVisibleNuclei();
  const filter = ui.snackNucleusFilter?.value || "todos";
  const nuclei = filter === "todos" ? nucleiAll : nucleiAll.filter((n) => n === filter);

  let rows = [];
  nuclei.forEach((n) => {
    const logs = getNucleusLogs(n) || [];
    rows = rows.concat(
      logs
        .filter((r) => r.event === "Estoque Lanche" || r.event === "Lanche")
        .map((r) => ({ ...r, nucleus: n }))
    );
  });

  rows.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  rows = rows.slice(0, 30);

  ui.snackHistoryBadge.textContent = String(rows.length);
  ui.snackHistoryList.innerHTML = "";

  if (!rows.length) {
    ui.snackHistoryList.innerHTML = `<li class="empty">Sem movimentos recentes.</li>`;
    return;
  }

  rows.forEach((r) => {
    const li = document.createElement("li");
    const dt = new Date(r.ts).toLocaleString("pt-BR");
    li.innerHTML = `<b>${escapeHtml(dt)}</b> • <b>${escapeHtml(r.nucleus)}</b> • ${escapeHtml(r.detail)} • <span class="muted">${escapeHtml(r.by || "-")}</span>`;
    ui.snackHistoryList.appendChild(li);
  });
}

function applySnackDelta(nucleus, delta) {
  const user = currentUser();
  if (!user) return;

  // ✅ usa a DATA escolhida na aba (não week input)
  const dateIso = ui.snackDate?.value || isoToday();
  const weekKey = weekKeyFromIsoDate(dateIso);

  // ✅ permissões:
  // - prof: só pode dar baixa (delta negativo)
  // - admin/gestão: pode + e -
  const mode = snackEditMode();
  if (mode === "prof" && delta > 0) {
    if (ui.snackStatus) {
      ui.snackStatus.textContent = "Reposição (+) é somente Admin/Gestão.";
      ui.snackStatus.classList.remove("report-status-success");
    }
    return;
  }
  if (mode === "none") return;

  const res = adjustSnackStock(state.currentProjectKey, nucleus, weekKey, delta);

  if (!res.ok) {
    if (ui.snackStatus) {
      ui.snackStatus.textContent = res.msg || "Não foi possível ajustar.";
      ui.snackStatus.classList.remove("report-status-success");
    }
    return;
  }

  const kind = delta >= 0 ? "Entrada" : "Saída";
  const sign = delta >= 0 ? "+" : "";
  pushNucleusLog(
    nucleus,
    "Estoque Lanche",
    `${kind} ${sign}${delta} • Semana ${weekKey}`,
    user
  );

  if (ui.snackStatus) {
    ui.snackStatus.textContent = `Atualizado ✅ (${nucleus}) • ${kind} ${sign}${delta}`;
    ui.snackStatus.classList.add("report-status-success");
  }

  persist();
  renderSnackStockTab();
}

function renderSnackStockTab() {
  if (!ui.snackCards) return;
  const user = currentUser();
  if (!user) return;

  // só Supergasbras
  if (state.currentProjectKey !== SNACK_PROJECT_KEY) {
    ui.snackCards.innerHTML = `<div class="empty">Estoque de lanches disponível apenas no projeto <b>Supergasbras</b>.</div>`;
    ui.snackHistoryList && (ui.snackHistoryList.innerHTML = "");
    ui.snackHistoryBadge && (ui.snackHistoryBadge.textContent = "0");
    ui.snackBadge && (ui.snackBadge.textContent = "—");
    return;
  }

  hydrateSnackControls();

  // ✅ Data escolhida (mais intuitivo)
const dateIso = ui.snackDate?.value || isoToday();

// ✅ Semana calculada a partir da data
const weekKey = weekKeyFromIsoDate(dateIso);

// ✅ Badge mais amigável
if (ui.snackBadge) {
  const m = String(weekKey).match(/^(\d{4})-W(\d{2})$/);
  const year = m ? m[1] : "";
  const week = m ? String(parseInt(m[2], 10)) : weekKey;
  ui.snackBadge.textContent = `Semana ${week} • ${year} (Data: ${formatDateLabel(dateIso)})`;
}

const nucleiAll = SNACK_NUCLEI.slice();
const filter = ui.snackNucleusFilter?.value || (currentUser()?.role === "professor" ? nucleiAll[0] : "todos");
const nuclei = (filter === "todos") ? nucleiAll : nucleiAll.filter((n) => n === filter);

// ✅ Permissões
const mode = snackEditMode();                         // "admin" | "prof" | "none"
const canAdd = mode === "admin";                      // + só admin/gestão
const canRemove = mode === "admin" || mode === "prof"; // - admin/gestão/prof

ui.snackCards.innerHTML = "";

if (!nuclei.length) {
  ui.snackCards.innerHTML = `
    <div class="empty">
      Nenhum núcleo disponível para estoque de lanches neste usuário.<br>
      <span class="muted">Verifique se o usuário Colaborador está com núcleo "Freguesia" ou "Realengo".</span>
    </div>
  `;
  renderSnackHistory(weekKey);
  return;
}

nuclei.forEach((nucleus) => {
  const balance = getSnackStock(state.currentProjectKey, nucleus, weekKey);
  const low = balance <= 20;

  const card = document.createElement("article");
  card.className = "snack-card";
  card.innerHTML = `
    <div class="snack-card-head">
      <div>
        <h3 class="snack-title">${escapeHtml(nucleus)}</h3>
        <div class="snack-sub">Saldo semanal</div>
      </div>
      <span class="snack-pill ${low ? "low" : ""}">${low ? "⚠️ Baixo" : "OK"}</span>
    </div>

    <div class="snack-balance">${balance}</div>

    <div class="snack-quick">
      <button type="button" class="negative"
        data-snack-n="${escapeHtml(nucleus)}" data-snack-d="-5"
        ${canRemove ? "" : "disabled"}>-5</button>

      <button type="button" class="negative"
        data-snack-n="${escapeHtml(nucleus)}" data-snack-d="-1"
        ${canRemove ? "" : "disabled"}>Lanche entregue (-1)</button>

      <button type="button" class="positive"
        data-snack-n="${escapeHtml(nucleus)}" data-snack-d="1"
        ${canAdd ? "" : "disabled"}>+1</button>

      <button type="button" class="positive"
        data-snack-n="${escapeHtml(nucleus)}" data-snack-d="5"
        ${canAdd ? "" : "disabled"}>+5</button>
    </div>

    <div class="snack-row">
      <input type="number" value="1" min="1" step="1"
        data-snack-custom="${escapeHtml(nucleus)}" ${canAdd ? "" : "disabled"}>

      <button type="button" class="apply"
        data-snack-apply="${escapeHtml(nucleus)}" ${canAdd ? "" : "disabled"}>Aplicar</button>

      <input type="text" placeholder="Obs (opcional): reposição, entrega..."
        data-snack-note="${escapeHtml(nucleus)}" ${canAdd || canRemove ? "" : "disabled"}>
    </div>

    ${
      mode === "none"
        ? `<p class="muted" style="margin-top:8px;font-size:.85rem">Sem permissão para movimentar o estoque.</p>`
        : mode === "prof"
          ? `<p class="muted" style="margin-top:8px;font-size:.85rem">Você pode dar baixa (lanche entregue). Reposição é somente Admin/Gestão.</p>`
          : ``
    }
  `;

  ui.snackCards.appendChild(card);
});

renderSnackHistory(weekKey);
} 

function ensureSnackLog(student) {
  if (!Array.isArray(student.snackLog)) student.snackLog = [];
  return student.snackLog;
}

function deliverSnackToStudent(student, actor) {
  if (!snackEnabledForCurrentProject()) return { ok: false, msg: "Lanches só no projeto Supergasbras." };
  if (!SNACK_NUCLEI.includes(student.nucleus)) return { ok: false, msg: "Esse núcleo não tem lanches." };

  const weekKey = isoWeekKey(new Date());
  const res = adjustSnackStock(state.currentProjectKey, student.nucleus, weekKey, -1);
  if (!res.ok) return res;

  ensureSnackLog(student).unshift({
    ts: new Date().toISOString(),
    weekKey,
    nucleus: student.nucleus,
    by: actor?.username || "-",
  });

  pushNucleusLog(student.nucleus, "Lanche", `Entregue para ${student.name} • Semana ${weekKey}`, actor);
  pushHistory(student, actor, "lanche", `Lanche entregue • Semana ${weekKey}`);
  persist();
  return { ok: true, msg: "Lanche entregue e estoque baixado ✅" };
}

// =========================
// DOC DO RELATÓRIO (GLOBAL)
// =========================
const INSTITUTIONAL_EMAIL = "contato@iinbrasil.org"; // troque aqui

function pad2(n) { return String(n).padStart(2, "0"); }

function formatIssuedAt(dt = new Date()) {
  // Ex: 09/02/2026 14:47
  return `${dt.toLocaleDateString("pt-BR")} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

function makeReportDocId(projectKey = state.currentProjectKey) {
  const d = new Date();
  const stamp =
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;

  const rnd = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `IIN-${String(projectKey || "PRJ").toUpperCase()}-${stamp}-${rnd}`;
}

// pega lista de presenças do aluno (do projeto atual) ordenada mais recente primeiro
function getStudentAttendanceRows(student) {
  const log = ensureAttendanceLog(student).filter((x) => x.project === state.currentProjectKey);
  // tenta ordenar por data ISO (YYYY-MM-DD) desc
  return log.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// estatísticas de faltas nas últimas N aulas (ignorando S/A)
function absenceStats(student, lastN = 10) {
  const rows = getStudentAttendanceRows(student).filter((r) => r.status !== "sa");
  const slice = rows.slice(0, lastN);

  const faltas = slice.filter((r) => r.status === "falta").length;

  let consecutivas = 0;
  for (const r of slice) {
    if (r.status === "falta") consecutivas++;
    else break;
  }
  return { faltas, consecutivas, analisadas: slice.length };
}

// define nível do alerta do aluno
function getStudentAlertLevel(student) {
  const f = frequencyOf(student);
  const abs = absenceStats(student, 10);

  // frequência crítica
  if (f.total >= ALERT_MIN_AULAS && f.pct < ALERT_FREQ_CRIT_PCT) {
    return { level: "crit", reason: `Frequência baixa (${f.pct}%)`, f, abs };
  }

  // faltas críticas
  if (abs.faltas >= ALERT_FALTAS_CRIT) {
    return { level: "crit", reason: `${abs.faltas} faltas (últimas ${abs.analisadas})`, f, abs };
  }

  // faltas aviso
  if (abs.faltas >= ALERT_FALTAS_WARN) {
    return { level: "warn", reason: `${abs.faltas} faltas (últimas ${abs.analisadas})`, f, abs };
  }

  return { level: "ok", reason: "", f, abs };
}

function pickWhatsappPhone(student) {
  const raw = student.guardian?.phone || student.contact || "";
  const phone = String(raw).replace(/\D/g, "");
  return phone; // só números
}

function openWhatsappToStudent(student, extraMsg = "") {
  const phone = pickWhatsappPhone(student);
  if (!phone) {
    alert("Esse aluno não tem telefone válido (aluno ou responsável).");
    return;
  }

  const staff = getAttendanceStaffByNucleus(student.nucleus);
  const date = staff.classDate ? formatDateLabel(staff.classDate) : formatDateLabel(isoToday());
  const schedule = staff.classSchedule || "(horário não definido)";

  const alertInfo = getStudentAlertLevel(student);
  const base = [
    `Olá! Aqui é do Instituto Irmãos Nogueira (IIN).`,
    `Aluno(a): ${student.name}`,
    `Núcleo: ${student.nucleus}`,
    `Turma: ${schedule}`,
    `Data referência: ${date}`,
    alertInfo.level !== "ok" ? `⚠️ Alerta: ${alertInfo.reason}` : "",
    extraMsg ? `Obs: ${extraMsg}` : "",
    "",
    `Podemos conversar para apoiar a presença e evolução do(a) aluno(a)?`,
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(base)}`, "_blank");
}

// Helper: alterna visibilidade da senha + troca ícone
function togglePasswordVisibility(rowEl, userId) {
  const inp = rowEl.querySelector(`[data-pass="${userId}"]`);
  const iconWrap = rowEl.querySelector(`[data-eye-icon="${userId}"]`);
  if (!inp) return;

  const show = inp.type === "password";
  inp.type = show ? "text" : "password";

  if (iconWrap) iconWrap.innerHTML = show ? ICON_EYE_CLOSED : ICON_EYE_OPEN;
}

// ✅ ESSA FUNÇÃO PRECISA EXISTIR GLOBAL
function currentUser() {
  if (!state.sessionUserId) return null;
  return getProjectUsers().find((u) => u.id === state.sessionUserId) || null;
}

/* ========= DEFAULT DATA / STORAGE ========= */
function createDefaultUsersForProject(projectKey) {
  const base = [
    { username: "iin.admin", password: "IIN@Admin2026!", role: "admin", nucleus: null },
    { username: "iin.gestao", password: "IIN@Gestao2026!", role: "gestao", nucleus: null },
    { username: "iin.supervisao", password: "IIN@Supervisao2026!", role: "supervisao", nucleus: null },

    { username: "colab.campogrande", password: "IIN@CampoGrande2026!", role: "professor", nucleus: "Campo Grande" },
    { username: "colab.realengo", password: "IIN@Realengo2026!", role: "professor", nucleus: "Realengo" },
    { username: "colab.jacarezinho", password: "IIN@Jacarezinho2026!", role: "professor", nucleus: "Jacarezinho" },
    { username: "colab.penha", password: "IIN@Penha2026!", role: "professor", nucleus: "Penha" },
    { username: "colab.freguesia", password: "IIN@Freguesia2026!", role: "professor", nucleus: "Freguesia" },
    { username: "colab.santacruz", password: "IIN@SantaCruz2026!", role: "professor", nucleus: "Santa Cruz" },
    { username: "colab.macae", password: "IIN@Macae2026!", role: "professor", nucleus: "Macaé" },
  ];
  return base.map((u) => ({ id: crypto.randomUUID(), project: projectKey, ...u }));
}

function ensureRequiredUsers() {
  const allRequired = PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));
  allRequired.forEach((req) => {
    const idx = state.users.findIndex((u) => u.project === req.project && u.username === req.username);
    if (idx === -1) state.users.push(req);
    else state.users[idx] = { ...state.users[idx], role: req.role, nucleus: req.nucleus, password: req.password };
  });
}

function createEmptyStockByNucleus(projectKey) {
  return Object.fromEntries(
    getVisibleNuclei(projectKey).map((n) => [
      n,
      Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0])),
    ])
  );
}
function createUniformStockByProject() {
  return Object.fromEntries(PROJECTS.map((p) => [p.key, createEmptyStockByNucleus(p.key)]));
}
function createEmptyCalendarByNucleus(projectKey) {
  return Object.fromEntries(getVisibleNuclei(projectKey).map((n) => [n, { days: [], schedules: [] }]));
}
function createProjectCalendars() {
  return Object.fromEntries(PROJECTS.map((p) => [p.key, createEmptyCalendarByNucleus(p.key)]));
}
function createAttendanceStaffByProject() {
  return Object.fromEntries(
    PROJECTS.map((p) => [
      p.key,
      Object.fromEntries(
        getVisibleNuclei(p.key).map((n) => [
          n,
          { classDate: "", classSchedule: "", professorName: "", monitorName: "" },
        ])
      ),
    ])
  );
}
function createClassLocksByProject() {
  return Object.fromEntries(
    PROJECTS.map((p) => [
      p.key,
      Object.fromEntries(
        getVisibleNuclei(p.key).map((n) => [n, { locked: false, lockedAt: "", lockedDate: "" }])
      ),
    ])
  );
}
function createMestreDocsByProject() {
  return Object.fromEntries(
    PROJECTS.map((p) => [p.key, Object.fromEntries(MESTRE_THEMES.map((t) => [t, null]))])
  );
}
function createSettingsByProject() {
  return Object.fromEntries(PROJECTS.map((p) => [p.key, { whatsappGroupLink: "" }]));
}
function createEmptyDeliveryItems() {
  return Object.fromEntries(STOCK_CATEGORIES.map((item) => [item.key, false]));
}

function normalizeStudentData(s) {
  return {
    ...s,
    uniform: { ...(s.uniform || {}), items: { ...createEmptyDeliveryItems(), ...(s.uniform?.items || {}) } },
    attendanceLog: Array.isArray(s.attendanceLog) ? s.attendanceLog : [],
    absences: Array.isArray(s.absences) ? s.absences : [],
    snackLog: Array.isArray(s.snackLog) ? s.snackLog : [],
    guardian: {
      name: s.guardian?.name || "",
      phone: s.guardian?.phone || "",
      email: s.guardian?.email || "",
      cpf: s.guardian?.cpf || "",
    },
    school: {
      name: s.school?.name || "",
      type: s.school?.type || "",
      year: s.school?.year || "",
    },
    address: {
      street: s.address?.street || "",
      number: s.address?.number || "",
      district: s.address?.district || "",
      zip: s.address?.zip || "",
      complement: s.address?.complement || "",
      uf: s.address?.uf || "",
    },
    sizes: {
      shirt: s.sizes?.shirt || "",
      short: s.sizes?.short || "",
      kimono: s.sizes?.kimono || "",
    },
    extra: {
      cpf: s.extra?.cpf || "",
      gender: s.extra?.gender || "",
      parents: s.extra?.parents || "",
      enrollDate: s.extra?.enrollDate || s.startDate || "",
    },
    pcd: Boolean(s.pcd),
  };
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.users = PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));
    state.students = [];
    state.visitors = [];
    state.history = [];
    state.uniformStockByProject = createUniformStockByProject();
    state.classDaysByProject = createProjectCalendars();
    state.attendanceStaffByProject = createAttendanceStaffByProject();
    state.planningByProject = {};
    state.classLocksByProject = createClassLocksByProject();
    state.nucleusLogsByProject = {};
    state.mestreDocsByProject = createMestreDocsByProject();
    state.settingsByProject = createSettingsByProject();
    state.snackStockByProject = createSnackStockByProject();
    persist();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.lessonsByProject = parsed.lessonsByProject || {};
    state.students = Array.isArray(parsed.students) ? parsed.students.map(normalizeStudentData) : [];
    state.visitors = Array.isArray(parsed.visitors) ? parsed.visitors : [];
    state.users = Array.isArray(parsed.users) ? parsed.users : PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));
    state.history = Array.isArray(parsed.history) ? parsed.history : [];
    state.uniformStockByProject = parsed.uniformStockByProject || createUniformStockByProject();
    state.classDaysByProject = parsed.classDaysByProject || createProjectCalendars();
    state.attendanceStaffByProject = parsed.attendanceStaffByProject || createAttendanceStaffByProject();
    state.planningByProject = parsed.planningByProject || {};
    state.classLocksByProject = parsed.classLocksByProject || createClassLocksByProject();
    state.nucleusLogsByProject = parsed.nucleusLogsByProject || {};
    state.mestreDocsByProject = parsed.mestreDocsByProject || createMestreDocsByProject();
    state.settingsByProject = parsed.settingsByProject || createSettingsByProject();
    state.supervisaoByProject = parsed.supervisaoByProject || {};
    state.snackStockByProject = parsed.snackStockByProject || createSnackStockByProject();
  } catch (e) {
    console.error("Erro ao carregar storage:", e);
    localStorage.removeItem(STORAGE_KEY);
    loadData();
    return;
  }

  ensureRequiredUsers();
  ensureNucleusLogs();
  ensureMestreDocs();
  ensureProjectSettings();
  persist();
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      students: state.students,
      visitors: state.visitors,
      users: state.users,
      history: state.history,
      uniformStockByProject: state.uniformStockByProject,
      snackStockByProject: state.snackStockByProject,
      classDaysByProject: state.classDaysByProject,
      attendanceStaffByProject: state.attendanceStaffByProject,
      planningByProject: state.planningByProject,
      classLocksByProject: state.classLocksByProject,
      nucleusLogsByProject: state.nucleusLogsByProject,
      mestreDocsByProject: state.mestreDocsByProject,
      settingsByProject: state.settingsByProject,
      supervisaoByProject: state.supervisaoByProject,

      // ✅ NOVO
      lessonsByProject: state.lessonsByProject,
    })
  );
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.sessionUserId = parsed?.sessionUserId || null;
    state.currentProjectKey = parsed?.currentProjectKey || state.currentProjectKey;
    state.activeTab = parsed?.activeTab || state.activeTab;
  } catch {
    state.sessionUserId = null;
  }
}
function persistSession() {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      sessionUserId: state.sessionUserId,
      currentProjectKey: state.currentProjectKey,
      activeTab: state.activeTab,
    })
  );
}

/* ========= REPORT PREFS ========= */
function loadReportPrefs() {
  const raw = localStorage.getItem(REPORT_PREFS_KEY);
  const defaults = Object.fromEntries(CUSTOM_FIELDS.map((f) => [f.key, true]));
  if (!raw) {
    state.reportPrefs = { printType: "completo", fields: defaults };
    return;
  }
  try {
    const p = JSON.parse(raw);
    state.reportPrefs = {
      printType: p?.printType || "completo",
      fields: { ...defaults, ...(p?.fields || {}) },
    };
  } catch {
    state.reportPrefs = { printType: "completo", fields: defaults };
  }
}
function saveReportPrefs() {
  localStorage.setItem(REPORT_PREFS_KEY, JSON.stringify(state.reportPrefs));
}

/* ========= PROJECT BAG GETTERS ========= */
function getProjectStudents(projectKey = state.currentProjectKey) {
  return state.students.filter((s) => s.project === projectKey);
}
function getScopedStudents() {
  const user = currentUser();
  const all = getProjectStudents();

  if (user?.role === "professor") {
    return all.filter((s) => s.nucleus === user.nucleus);
  }
  return all;
}
function getProjectVisitors(projectKey = state.currentProjectKey) {
  return state.visitors.filter((v) => v.project === projectKey);
}
function getProjectUsers(projectKey = state.currentProjectKey) {
  return state.users.filter((u) => u.project === projectKey);
}
function getProjectStock(projectKey = state.currentProjectKey) {
  if (!state.uniformStockByProject[projectKey]) state.uniformStockByProject[projectKey] = createEmptyStockByNucleus(projectKey);
  return state.uniformStockByProject[projectKey];
}
function getProjectCalendar(projectKey = state.currentProjectKey) {
  if (!state.classDaysByProject[projectKey]) state.classDaysByProject[projectKey] = createEmptyCalendarByNucleus(projectKey);
  return state.classDaysByProject[projectKey];
}
function getProjectAttendanceStaff(projectKey = state.currentProjectKey) {
  if (!state.attendanceStaffByProject[projectKey]) {
    state.attendanceStaffByProject[projectKey] = createAttendanceStaffByProject()[projectKey];
  }
  return state.attendanceStaffByProject[projectKey];
}
function getAttendanceStaffByNucleus(nucleus) {
  const bag = getProjectAttendanceStaff();
  if (!bag[nucleus]) bag[nucleus] = { classDate: "", classSchedule: "", professorName: "", monitorName: "" };
  return bag[nucleus];
}
function getProjectPlanning(projectKey = state.currentProjectKey) {
  if (!state.planningByProject[projectKey]) state.planningByProject[projectKey] = [];
  return state.planningByProject[projectKey];
}
function getProjectLocks(projectKey = state.currentProjectKey) {
  if (!state.classLocksByProject[projectKey]) state.classLocksByProject[projectKey] = createClassLocksByProject()[projectKey];
  return state.classLocksByProject[projectKey];
}
function getLock(nucleus) {
  const locks = getProjectLocks();
  if (!locks[nucleus]) locks[nucleus] = { locked: false, lockedAt: "", lockedDate: "" };
  return locks[nucleus];
}
function ensureNucleusLogs(projectKey = state.currentProjectKey) {
  if (!state.nucleusLogsByProject[projectKey]) {
    state.nucleusLogsByProject[projectKey] = Object.fromEntries(getVisibleNuclei(projectKey).map((n) => [n, []]));
  }
  getVisibleNuclei(projectKey).forEach((n) => {
    if (!state.nucleusLogsByProject[projectKey][n]) state.nucleusLogsByProject[projectKey][n] = [];
  });
  return state.nucleusLogsByProject[projectKey];
}
function ensureMestreDocs(projectKey = state.currentProjectKey) {
  if (!state.mestreDocsByProject[projectKey]) {
    state.mestreDocsByProject[projectKey] = Object.fromEntries(MESTRE_THEMES.map((t) => [t, null]));
  }
  MESTRE_THEMES.forEach((t) => {
    if (!(t in state.mestreDocsByProject[projectKey])) state.mestreDocsByProject[projectKey][t] = null;
  });
  return state.mestreDocsByProject[projectKey];
}
function ensureProjectSettings(projectKey = state.currentProjectKey) {
  if (!state.settingsByProject[projectKey]) state.settingsByProject[projectKey] = { whatsappGroupLink: "" };
  if (!("whatsappGroupLink" in state.settingsByProject[projectKey])) {
    state.settingsByProject[projectKey].whatsappGroupLink = "";
  }
  return state.settingsByProject[projectKey];
}

function getSupervisaoBag(projectKey = state.currentProjectKey) {
  if (!state.supervisaoByProject[projectKey]) {
    state.supervisaoByProject[projectKey] = [];
  }
  return state.supervisaoByProject[projectKey];
}

/* ========= LOG / HISTORY ========= */
function pushNucleusLog(nucleus, eventLabel, detail, byUser) {
  const bag = ensureNucleusLogs();
  if (!bag[nucleus]) bag[nucleus] = [];
  bag[nucleus].unshift({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    nucleus,
    event: eventLabel,
    by: byUser?.username || "-",
    detail: detail || "-",
    project: state.currentProjectKey,
  });
  bag[nucleus] = bag[nucleus].slice(0, 500);
}
function getNucleusLogs(nucleus) {
  const bag = ensureNucleusLogs();
  return (bag[nucleus] || []).slice();
}
function pushHistory(student, user, type, detail) {
  state.history.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    nucleus: student.nucleus,
    studentName: student.name,
    by: user?.username || "-",
    type,
    detail,
    project: state.currentProjectKey,
  });
  state.history = state.history.slice(0, 5000);
}

/* ========= ATTENDANCE / FREQUENCY ========= */
function ensureAttendanceLog(student) {
  if (!Array.isArray(student.attendanceLog)) student.attendanceLog = [];
  return student.attendanceLog;
}
function upsertAttendanceLog(student, dateISO, status, meta = {}) {
  const log = ensureAttendanceLog(student);
  const key = `${state.currentProjectKey}|${dateISO}`;
  const idx = log.findIndex((x) => x.key === key);
  const row = { key, project: state.currentProjectKey, date: dateISO, status, meta };
  if (idx === -1) log.push(row);
  else log[idx] = row;
}
function frequencyOf(student) {
  const log = ensureAttendanceLog(student).filter((x) => x.project === state.currentProjectKey);
  const effective = log.filter((x) => x.status !== "sa");
  const total = effective.length;
  const present = effective.filter((x) => x.status === "presente" || x.status === "justificado").length;
  const pct = total ? Math.round((present / total) * 100) : 0;
  return { present, total, pct };
}
function attendanceCode(attendance) {
  if (attendance === "presente") return "P";
  if (attendance === "falta") return "F";
  if (attendance === "justificado") return "J";
  if (attendance === "sa") return "S/A";
  return "-";
}
function attendanceCodePrint(attendance) {
  const code = attendanceCode(attendance);
  if (code === "F") return `<span style="font-weight:700;color:#b31d2f">F</span>`;
  if (code === "J") return `<span style="font-weight:700;color:#2c3f8f">J</span>`;
  if (code === "P") return `<span style="font-weight:700;color:#1f8a57">P</span>`;
  return code;
}

/* ========= KIT / STOCK ========= */
function labelStockCategory(categoryKey) {
  return STOCK_CATEGORIES.find((i) => i.key === categoryKey)?.label || categoryKey;
}
function getAllowedItemsByModality(modality) {
  return MODALITY_ITEMS[modality] || [];
}
function normalizeDeliveryItems(student) {
  const allowed = getAllowedItemsByModality(student.modality);
  const base = createEmptyDeliveryItems();
  const saved = student.uniform?.items || {};
  allowed.forEach((k) => (base[k] = Boolean(saved[k])));
  return base;
}
function isKitDelivered(student) {
  const allowed = getAllowedItemsByModality(student.modality);
  if (!allowed.length) return false;
  const items = student.uniform?.items || normalizeDeliveryItems(student);
  return allowed.every((k) => items[k] === true);
}
function formatAllowedItems(modality) {
  const items = getAllowedItemsByModality(modality);
  return items.length ? items.map(labelStockCategory).join(", ") : "Sem itens configurados";
}

/* ========= HYDRATE UI ========= */
function hydrateProjectSelects() {
  if (!ui.loginProject) return;
  ui.loginProject.innerHTML = "";
  PROJECTS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = p.label;
    ui.loginProject.appendChild(opt);
  });
  ui.loginProject.value = state.currentProjectKey;
}

function hydrateNucleusSelects() {
  const ids = [
    "studentNucleus",
    "calendarNucleus",
    "newNucleus",
    "attendanceNucleusFilter",
    "uniformNucleusFilter",
    "adminReportNucleusFilter",
    "visitorNucleus",
    "dashNucleusFilter",
    "adminLogNucleusFilter",
  ];
  const visible = getVisibleNuclei();

  ids.forEach((id) => {
    const node = el(id);
    if (!node) return;

    const needsTodos =
      id.endsWith("Filter") || id.includes("ReportNucleusFilter") || id === "dashNucleusFilter";
    node.innerHTML = needsTodos ? `<option value="todos">Todos os núcleos</option>` : "";

    visible.forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      node.appendChild(opt);
    });

    if (!needsTodos && visible.length) node.value = visible[0];
  });
}

function hydrateAulasCategoryOptions() {
  if (!ui.aulasCategory) return;

  const current = ui.aulasCategory.value || "";
  ui.aulasCategory.innerHTML = `<option value="">Todas as categorias</option>`;

  LESSON_CATEGORIES.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    ui.aulasCategory.appendChild(opt);
  });

  // tenta manter o valor selecionado
  if ([...ui.aulasCategory.options].some((o) => o.value === current)) {
    ui.aulasCategory.value = current;
  } else {
    ui.aulasCategory.value = "";
  }
}

function hydrateStudentScheduleOptions() {
  if (!ui.studentSchedule) return;
  const nucleus = el("studentNucleus")?.value;
  const schedules = getProjectCalendar()?.[nucleus]?.schedules || [];

  ui.studentSchedule.innerHTML = `<option value="">Selecione (opcional)</option>`;
  schedules.forEach((slot) => {
    const value = `${slot.start} às ${slot.end}`;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    ui.studentSchedule.appendChild(opt);
  });
}
function hydrateStudentModalityOptions() {
  if (!ui.studentModality) return;
  const mods = PROJECT_MODALITIES[state.currentProjectKey] || [];
  ui.studentModality.innerHTML = "";
  mods.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    ui.studentModality.appendChild(opt);
  });
}

function hydratePrintFieldsUI() {
  if (!ui.printFieldsGrid) return;
  ui.printFieldsGrid.innerHTML = "";

  CUSTOM_FIELDS.forEach((f) => {
    const wrap = document.createElement("label");
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = ".4rem";
    wrap.style.fontWeight = "600";
    wrap.style.fontSize = ".9rem";
    wrap.innerHTML = `<input type="checkbox" ${state.reportPrefs.fields[f.key] ? "checked" : ""} data-key="${f.key}" /> ${escapeHtml(f.label)}`;
    const chk = wrap.querySelector("input");
    chk.addEventListener("change", () => {
      state.reportPrefs.fields[f.key] = chk.checked;
      saveReportPrefs();
    });
    ui.printFieldsGrid.appendChild(wrap);
  });

  if (ui.printType) {
    ui.printType.value = state.reportPrefs.printType || "completo";
    ui.printCustomBox?.classList.toggle("hidden", ui.printType.value !== "personalizado");
  }
}

/* ========= ADMIN EXTRA PANEL (grupo whatsapp + aulas) ========= */
function ensureAdminExtraPanels() {
  const adminArea = el("adminArea");
  if (!adminArea) return;

  // 1) Painel WhatsApp
  if (!el("adminWhatsGroupLink")) {
    const panel = document.createElement("section");
    panel.className = "panel";
    panel.style.marginTop = "12px";
    panel.innerHTML = `
      <div class="panel-title-row">
        <h2>Configuração do Grupo WhatsApp</h2>
        <span class="badge">Admin</span>
      </div>
      <div class="grid-form">
        <label>Link do grupo WhatsApp
          <input id="adminWhatsGroupLink" type="url" placeholder="https://chat.whatsapp.com/..." />
        </label>
        <button id="adminWhatsGroupSave" type="button" class="primary">Salvar link do grupo</button>
      </div>
      <p id="adminWhatsGroupStatus" class="report-status">Defina o link para o botão do professor abrir direto o grupo.</p>
    `;
    adminArea.appendChild(panel);
  } // ✅ FECHA AQUI (esse era o erro)

  // 2) Painel Admin: cadastrar aula (YouTube/Drive)
  if (!el("adminLessonForm")) {
    const panel2 = document.createElement("section");
    panel2.className = "panel";
    panel2.style.marginTop = "12px";
    panel2.innerHTML = `
      <div class="panel-title-row">
        <h2>Admin • Aulas (EAD)</h2>
        <span class="badge">Admin</span>
      </div>

      <form id="adminLessonForm" class="grid-form">
        <label>Título da aula
          <input id="lessonTitle" type="text" placeholder="Ex: Aula 01 — Bases do Boxe" required />
        </label>

        <label>Categoria
          <select id="lessonCategory">
            <option value="">Selecione</option>
          </select>
        </label>

        <label>Nível
          <select id="lessonLevel">
            <option value="">Selecione</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </label>

        <label>Link do vídeo (YouTube ou Google Drive)
          <input id="lessonUrl" type="url" placeholder="Cole aqui o link do vídeo" required />
        </label>

        <label>Descrição (opcional)
          <textarea id="lessonDesc" rows="3" placeholder="Breve descrição / objetivos da aula"></textarea>
        </label>

        <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap">
          <button type="submit" class="primary">Salvar aula</button>
          <button type="button" id="lessonClear" class="ghost">Limpar</button>
          <span id="lessonStatus" class="report-status">Cadastre aulas para aparecerem na plataforma.</span>
        </div>
      </form>

      <div class="table-wrapper" style="margin-top:10px">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoria</th>
              <th>Nível</th>
              <th>Fonte</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="adminLessonsTableBody">
            <tr><td colspan="5" class="empty">Sem aulas cadastradas.</td></tr>
          </tbody>
        </table>
      </div>
    `;
    adminArea.appendChild(panel2);
  }
}

function patchSizeDropdowns() {
  const uniformSizes = ["6 anos", "8 anos", "10 anos", "12 anos", "14 anos", "PP", "P", "M", "G", "GG", "XG"];
  const kimonoSizes = ["M0", "M1", "M2", "M3", "M4", "A0", "A1", "A2", "A3", "A4", "A5", "KIMONOS"];

  replaceInputWithSelect("sizeShirt", uniformSizes, "Selecione");
  replaceInputWithSelect("sizeShort", uniformSizes, "Selecione");
  replaceInputWithSelect("sizeKimono", kimonoSizes, "Selecione");
}

function replaceInputWithSelect(id, options, firstLabel = "Selecione") {
  const node = el(id);
  if (!node) return;

  // Se já for select, só atualiza
  if (node.tagName === "SELECT") {
    const current = node.value || "";
    node.innerHTML = `<option value="">${firstLabel}</option>` +
      options.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("");
    if ([...node.options].some((o) => o.value === current)) node.value = current;
    return;
  }

  // Troca input por select mantendo id/name/classes
  const select = document.createElement("select");
  select.id = node.id;
  select.name = node.name || "";
  select.className = node.className || "";
  select.innerHTML = `<option value="">${firstLabel}</option>` +
    options.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("");

  if (node.value && options.includes(node.value)) select.value = node.value;

  node.replaceWith(select);
}

function patchVisitorBirthDateField() {
  if (!ui.visitorForm) return;
  if (el("visitorBirthDate")) return; // já existe

  const visitorDateInput = el("visitorDate");
  const visitorDateLabel = visitorDateInput ? visitorDateInput.closest("label") : null;
  const birthLabel = document.createElement("label");
  birthLabel.innerHTML = `
    Data de nascimento
    <input id="visitorBirthDate" type="date" />
  `;

  // tenta inserir perto da data da visita
  if (visitorDateLabel && visitorDateLabel.parentNode) {
    visitorDateLabel.insertAdjacentElement("afterend", birthLabel);
  } else {
    ui.visitorForm.appendChild(birthLabel);
  }
}

function patchVisitorFormButtons() {
  if (!ui.visitorForm) return;
  if (el("visitorFormActions")) return;

  // botão existente (submit) vira "Salvar visita"
  const submitBtn = ui.visitorForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Salvar visita";

  const actions = document.createElement("div");
  actions.id = "visitorFormActions";
  actions.className = "toolbar";
  actions.style.gridColumn = "1 / -1";
  actions.innerHTML = `
    <button type="button" id="visitorToStudentBtn" class="ghost">Cadastrar aluno</button>
  `;

  // coloca depois do botão submit
  if (submitBtn) {
    submitBtn.insertAdjacentElement("afterend", actions);
  } else {
    ui.visitorForm.appendChild(actions);
  }

  el("visitorToStudentBtn")?.addEventListener("click", convertVisitorFormToStudent);
}

function convertVisitorFormToStudent() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = ui.visitorName?.value?.trim() || "";
  const nucleus = ui.visitorNucleus?.value || "";
  const contact = ui.visitorContact?.value?.trim() || "";
  const notes = ui.visitorNotes?.value?.trim() || "";
  const birthDate = el("visitorBirthDate")?.value || "";

  if (!name || !nucleus) {
    alert("Preencha ao menos nome e núcleo do visitante para cadastrar como aluno.");
    return;
  }

  setActiveTab("tab-gestao");

  if (el("studentName")) el("studentName").value = name;
  if (el("studentNucleus")) el("studentNucleus").value = nucleus;
  hydrateStudentScheduleOptions();
  if (el("studentContact")) el("studentContact").value = contact;
  if (el("studentBirthDate")) el("studentBirthDate").value = birthDate;
  if (el("studentRequirements")) {
    el("studentRequirements").value = `Cadastro vindo de visitante${notes ? " • " + notes : ""}`;
  }

  pushNucleusLog(nucleus, "Visitante → Cadastro", `Pré-preenchido para matrícula: ${name}`, user);
  persist();

  // foco em responsável
  el("guardianName")?.focus();
}
/* ========= AUTH ========= */
function onLogin(event) {
  event.preventDefault();
  const username = ui.loginUsername?.value?.trim() || "";
  const password = ui.loginPassword?.value || "";
  const projectKey = ui.loginProject?.value || state.currentProjectKey;
  state.currentProjectKey = projectKey;

  const user = getProjectUsers(projectKey).find((u) => u.username === username && u.password === password);
  if (!user) {
    if (ui.loginMessage) {
      ui.loginMessage.textContent = "Usuário ou senha inválidos.";
      ui.loginMessage.classList.remove("report-status-success");
    }
    return;
  }

  state.sessionUserId = user.id;
  state.activeTab = "tab-dashboard";
  persistSession();

  if (ui.loginMessage) {
    ui.loginMessage.textContent = "Acesso liberado.";
    ui.loginMessage.classList.add("report-status-success");
  }

  hydrateNucleusSelects();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  render();
}

function onLogout() {
  state.sessionUserId = null;
  persistSession();
  render();
}

function hydrateLessonAdminCategorySelect() {
  const sel = el("lessonCategory");
  if (!sel) return;
  sel.innerHTML = `<option value="">Selecione</option>` + LESSON_CATEGORIES.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function renderLessonsGrid() {
  if (!ui.aulasGrid || !ui.aulasBadge) return;

  const lessons = ensureLessonsBag().slice();
  ui.aulasBadge.textContent = `${lessons.length} aulas`;
  ui.aulasGrid.innerHTML = "";

  // filtros
  const q = safeLower(ui.aulasSearch?.value || "");
  const cat = ui.aulasCategory?.value || "";
  const lvl = ui.aulasLevel?.value || "";

  const filtered = lessons.filter((a) => {
    const okQ = !q || safeLower(a.title).includes(q) || safeLower(a.desc).includes(q);
    const okC = !cat || a.category === cat;
    const okL = !lvl || a.level === lvl;
    return okQ && okC && okL;
  });

  if (!filtered.length) {
    ui.aulasGrid.innerHTML = `<div class="empty">Nenhuma aula encontrada para esse filtro.</div>`;
    return;
  }

  filtered.forEach((a) => {
    const card = document.createElement("article");
    card.className = "calendar-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div style="display:flex; gap:10px; align-items:flex-start">
        <div style="width:110px; height:70px; border:1px solid #e5e7ef; border-radius:10px; overflow:hidden; background:#fafafa; display:flex; align-items:center; justify-content:center; font-size:12px; color:#666">
          ${a.thumb ? `<img src="${a.thumb}" style="width:100%; height:100%; object-fit:cover" />` : `${escapeHtml(a.provider.toUpperCase())}`}
        </div>
        <div style="flex:1">
          <strong>${escapeHtml(a.title)}</strong>
          <div class="muted" style="margin-top:3px; font-size:12px">
            ${escapeHtml(a.category || "-")} • ${escapeHtml(a.level || "-")}
          </div>
          ${a.desc ? `<div class="muted" style="margin-top:6px; font-size:12px">${escapeHtml(a.desc)}</div>` : ""}
        </div>
      </div>
    `;
    card.addEventListener("click", () => openLesson(a.id));
    ui.aulasGrid.appendChild(card);
  });
}

function openLesson(lessonId) {
  const lesson = ensureLessonsBag().find((x) => x.id === lessonId);
  if (!lesson) return;

  state.lessonUI.selectedId = lessonId;

  if (ui.aulaPlayer) {
    ui.aulaPlayer.innerHTML = `
      <iframe
        src="${lesson.embedUrl}"
        style="width:100%; height:420px; border:0; border-radius:12px;"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
  }

  if (ui.aulaMetaBadge) {
    ui.aulaMetaBadge.textContent = `${lesson.category || "-"} • ${lesson.level || "-"}`;
  }
}

function renderAdminLessonsTable() {
  const body = el("adminLessonsTableBody");
  if (!body) return;

  const lessons = ensureLessonsBag().slice();

  if (!lessons.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty">Sem aulas cadastradas.</td></tr>`;
    return;
  }

  body.innerHTML = lessons.map((a) => `
    <tr>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(a.category || "-")}</td>
      <td>${escapeHtml(a.level || "-")}</td>
      <td>${escapeHtml(a.provider)}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap">
        <button type="button" class="small-btn" data-open="${a.id}">Abrir</button>
        <button type="button" class="ghost" data-del="${a.id}">Excluir</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveTab("tab-aulas");
      openLesson(btn.getAttribute("data-open"));
    });
  });

  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      state.lessonsByProject[state.currentProjectKey] = ensureLessonsBag().filter((x) => x.id !== id);
      persist();
      renderAdminLessonsTable();
      renderLessonsGrid();
    });
  });
}

function calcAge(birthDateStr) {
  if (!birthDateStr) return "";
  const d = new Date(birthDateStr);
  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age < 0 ? "" : String(age);
}

function salvarChecklistSupervisao() {
  const user = currentUser();
  if (!user || user.role !== "supervisao") {
    alert("Apenas o perfil de Supervisão pode salvar este checklist.");
    return;
  }

  const registro = {
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    createdAt: new Date().toISOString(),

    data: el("supervisaoData")?.value || "",
    nucleo: el("supervisaoNucleo")?.value || "",
    modalidade: el("supervisaoModalidade")?.value || "",
    instrutor: el("supervisaoInstrutor")?.value?.trim() || "",

    observacoesGerais: el("supervisaoObsGerais")?.value?.trim() || "",
    avaliacaoGeral: el("supervisaoAvaliacaoGeral")?.value || "",
    supervisor: el("supervisaoSupervisor")?.value?.trim() || "",
    supervisorCpf: el("supervisaoSupervisorCpf")?.value?.trim() || "",
    instrutorCpf: el("supervisaoInstrutorCpf")?.value?.trim() || "",

    mes: el("supervisaoMes")?.value || "",
    dia: el("supervisaoDia")?.value || "",
    supervisorMensal: el("supervisaoSupervisorMensal")?.value?.trim() || "",
    gerenteGeral: el("supervisaoGerenteGeral")?.value?.trim() || "",
    finalizacao: el("supervisaoFinalizacao")?.value || "",
    supervisorMensalCpf: el("supervisaoSupervisorMensalCpf")?.value?.trim() || "",
    gerenteCpf: el("supervisaoGerenteCpf")?.value?.trim() || "",

    checklistDiario: {},
    metodologiaInstrutores: {},
    metodologiaTurmas: {},
  };

  document.querySelectorAll("#supervisaoChecklistDiarioBody select").forEach((select) => {
    registro.checklistDiario[select.name] = select.value || "";
  });

  document.querySelectorAll("#supervisaoMetodologiaInstrutoresBody select").forEach((select) => {
    registro.metodologiaInstrutores[select.name] = select.value || "";
  });

  document.querySelectorAll("#supervisaoMetodologiaTurmasBody select").forEach((select) => {
    registro.metodologiaTurmas[select.name] = select.value || "";
  });

  if (!registro.data || !registro.nucleo) {
    alert("Preencha pelo menos a data e o núcleo da supervisão.");
    return;
  }

  getSupervisaoBag().unshift(registro);
  persist();

  alert("Checklist da supervisão salvo com sucesso.");
}

/* ========= EVENTS ========= */
function bindEvents() {
  // ✅ LOGIN (isso estava faltando)
  ui.loginForm?.addEventListener("submit", onLogin);

ui.snackDate?.addEventListener("change", renderSnackStockTab);
ui.snackNucleusFilter?.addEventListener("change", renderSnackStockTab);

ui.snackTodayBtn?.addEventListener("click", () => {
  if (ui.snackDate) ui.snackDate.value = isoToday();
  renderSnackStockTab();
});

  // Projeto (troca de projeto no login)
  ui.loginProject?.addEventListener("change", (e) => {
    state.currentProjectKey = e.target.value;
    persistSession();

    hydrateNucleusSelects();
    hydrateStudentScheduleOptions();
    hydrateStudentModalityOptions();
    ensureNucleusLogs();
    ensureMestreDocs();
    ensureProjectSettings();

    // mantém o filtro da listagem de relatórios sincronizado com o seletor do topo
    state.attendanceFilter = ui.adminReportNucleusFilter?.value || "todos";

    render();
    updateReportRangeInfo();
  });

  // ✅ AULAS: filtros
  ui.aulasSearch?.addEventListener("input", () => {
    if (state.lessonUI) state.lessonUI.search = ui.aulasSearch.value || "";
    renderLessonsGrid();
  });

  ui.aulasCategory?.addEventListener("change", () => {
    if (state.lessonUI) state.lessonUI.category = ui.aulasCategory.value || "";
    renderLessonsGrid();
  });

  ui.aulasLevel?.addEventListener("change", () => {
    if (state.lessonUI) state.lessonUI.level = ui.aulasLevel.value || "";
    renderLessonsGrid();
  });

  // ✅ AULAS: admin cadastro
  el("adminLessonForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const status = el("lessonStatus");

    const title = el("lessonTitle")?.value?.trim() || "";
    const category = el("lessonCategory")?.value || "";
    const level = el("lessonLevel")?.value || "";
    const url = el("lessonUrl")?.value || "";
    const desc = el("lessonDesc")?.value?.trim() || "";

    const parsed = normalizeVideoUrl(url);
    if (!parsed.ok) {
      if (status) status.textContent = parsed.error;
      return;
    }

    const lesson = {
      id: crypto.randomUUID(),
      title,
      category,
      level,
      desc,
      provider: parsed.provider,
      embedUrl: parsed.embedUrl,
      thumb: parsed.thumb,
      createdAt: new Date().toISOString(),
      project: state.currentProjectKey,
    };

    ensureLessonsBag().unshift(lesson);
    persist();

    if (status) status.textContent = "Aula salva ✅";
    e.target.reset();

    renderAdminLessonsTable();
    renderLessonsGrid();
  });

  el("lessonClear")?.addEventListener("click", () => {
    el("adminLessonForm")?.reset();
    const status = el("lessonStatus");
    if (status) status.textContent = "Formulário limpo.";
  });

  // Gestão: núcleo altera horários
  el("studentNucleus")?.addEventListener("change", hydrateStudentScheduleOptions);

  // Tabs
  ui.tabsBar?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    setActiveTab(btn.dataset.tab);
  });

  // Chamada: busca
  ui.attendanceSearch?.addEventListener("input", (e) => {
    state.search = safeLower(e.target.value);
    const user = currentUser();
    if (user?.role === "professor") renderProfessorArea(user);
  });

  // Professor: salvar aula / encerrar aula
  ui.professorClassSave?.addEventListener("click", () => {
    const user = currentUser();
    if (user?.role === "professor") saveAttendanceStaff(user.nucleus);
  });

  ui.endClassBtn?.addEventListener("click", () => {
    const user = currentUser();
    if (user?.role === "professor") lockClass(user.nucleus);
  });

  // Planejamento / histórico
  ui.planningForm?.addEventListener("submit", onSavePlanning);

  ui.professorHistoryDate?.addEventListener("change", () => {
    const user = currentUser();
    if (user?.role === "professor") renderProfessorHistory(user.nucleus);
  });

  // Atestado
  ui.teacherAbsType?.addEventListener("change", () => {
    const isAluno = (ui.teacherAbsType.value || "aluno") === "aluno";
    ui.teacherAbsStudentWrap?.classList.toggle("hidden", !isAluno);
  });

  ui.teacherAbsSave?.addEventListener("click", onTeacherSaveAtestado);

  // Momento do mestre (prof)
  ui.teacherMestreOpen?.addEventListener("click", onTeacherOpenMestrePDF);

  // WhatsApp (prof)
  ui.teacherWhatsappBtn?.addEventListener("click", onTeacherWhatsapp);

  ui.teacherWhatsappCopy?.addEventListener("click", () => {
    const user = currentUser();
    if (!user || user.role !== "professor") return;
    copyToClipboard(buildTeacherWhatsappText(user.nucleus));
  });

  // Gestão: aluno / calendário
  ui.studentForm?.addEventListener("submit", onAddStudent);
  ui.classCalendarForm?.addEventListener("submit", onSaveClassCalendar);
  ui.gestaoAlunoBusca?.addEventListener("input", renderListaAlunosGestao);
  ui.gestaoAlunoFiltroNucleo?.addEventListener("change", renderListaAlunosGestao);
  ui.gestaoAlunoFiltroModalidade?.addEventListener("change", renderListaAlunosGestao);

  // ✅ Relatórios: núcleo do topo controla a listagem
  ui.adminReportNucleusFilter?.addEventListener("change", () => {
    updateReportRangeInfo();
    state.attendanceFilter = ui.adminReportNucleusFilter.value || "todos";
    renderAttendanceReport();
  });

  // Gestão: uniforme
  ui.uniformNucleusFilter?.addEventListener("change", () => {
    state.uniformFilter = ui.uniformNucleusFilter.value;
    renderUniformTable();
  });

  // Visitantes / Whats
  ui.visitorForm?.addEventListener("submit", onAddVisitor);
  ui.whatsForm?.addEventListener("submit", onOpenWhatsapp);

  // Admin: usuários
  ui.userForm?.addEventListener("submit", onCreateUser);

  ui.newRole?.addEventListener("change", () => {
  const nuc = el("newNucleus");
  if (nuc) nuc.disabled = ui.newRole.value !== "professor";
});

  // Admin: estoque
  ui.stockForm?.addEventListener("submit", onAdjustStock);

  // Relatórios: período
  ui.adminReportPeriod?.addEventListener("change", updateReportRangeInfo);

  // Tipo de impressão + checklist
  ui.printType?.addEventListener("change", (e) => {
    state.reportPrefs.printType = e.target.value || "completo";
    ui.printCustomBox?.classList.toggle("hidden", state.reportPrefs.printType !== "personalizado");
    saveReportPrefs();
  });

  // Admin: salvar PDF Momento do Mestre
  ui.adminMestreSave?.addEventListener("click", onAdminSaveMestreThemePDF);

  // Admin: salvar link do grupo
  el("adminWhatsGroupSave")?.addEventListener("click", onAdminSaveGroupLink);

  // Histórico por núcleo (aba Relatórios)
  ui.adminOpenLogModal?.addEventListener("click", () => {
    const nucleus = ui.adminLogNucleusFilter?.value || "todos";
    openLogModal(
      nucleus,
      nucleus === "todos" ? "Registros • Todos os núcleos" : `Registros • ${nucleus}`
    );
  });

  // Modais
  ui.logModalClose?.addEventListener("click", closeLogModal);
  ui.logModal?.addEventListener("click", (e) => {
    if (e.target === ui.logModal) closeLogModal();
  });

  ui.pdfModalClose?.addEventListener("click", closePdfModal);
  ui.pdfModal?.addEventListener("click", (e) => {
    if (e.target === ui.pdfModal) closePdfModal();
  });

  // Dashboard mini chart
  [ui.dashShowFixed, ui.dashShowVisitors, ui.dashShowPCD].forEach((n) =>
    n?.addEventListener("change", renderDashboardMiniChart)
  );

  ui.dashNucleusFilter?.addEventListener("change", renderDashboardChart);

   // ✅ Delegação em CAPTURE (instala só uma vez)
  if (!bindEvents.__delegationInstalled) {
    bindEvents.__delegationInstalled = true;

    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;

        // Sair
        if (t.closest?.("#logoutBtn")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onLogout();
          return;
        }

        // Baixar TXT
        if (t.closest?.("#adminGenerateReportBtn")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onGenerateReportTXT();
          return;
        }

        // Imprimir / Salvar PDF
        if (t.closest?.("#adminPrintReportBtn")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onPrintReport();
          return;
        }

        // Estoque lanches: botões rápidos (+/-)
        const quickSnack = t.closest?.("[data-snack-d]");
        if (quickSnack) {
          e.preventDefault();
          const nucleus = quickSnack.getAttribute("data-snack-n");
          const delta = Number(quickSnack.getAttribute("data-snack-d") || 0);
          const note =
            document.querySelector(`[data-snack-note="${cssEscape(nucleus)}"]`)?.value || "";
          applySnackDelta(nucleus, delta, note.trim());
          return;
        }

        // Estoque lanches: aplicar valor custom
        const applySnack = t.closest?.("[data-snack-apply]");
        if (applySnack) {
          e.preventDefault();
          const nucleus = applySnack.getAttribute("data-snack-apply");
          const qty = Number(
            document.querySelector(`[data-snack-custom="${cssEscape(nucleus)}"]`)?.value || 0
          );
          const note =
            document.querySelector(`[data-snack-note="${cssEscape(nucleus)}"]`)?.value || "";
          if (!Number.isFinite(qty) || qty <= 0) return;
          applySnackDelta(nucleus, qty, note.trim());
          return;
        }
      },
      true
    );
  }

  // Resize (gráficos)
el("salvarSupervisaoBtn")?.addEventListener("click", salvarChecklistSupervisao);

  window.addEventListener("resize", () => {
    renderDashboardChart();
    renderDashboardMiniChart();
  });
}

/* ========= TABS ========= */
function setActiveTab(tabId) {
  state.activeTab = tabId;
  persistSession();

  function openTab(id) {
  return setActiveTab(id);
}

  // marca a aba ativa no body (ajuda CSS/controle)
  document.body.dataset.activeTab = tabId;

  // alterna páginas
  ui.tabPages.forEach((page) => {
    if (!page) return;
    page.classList.toggle("hidden", page.id !== tabId);
  });

  // alterna botões
  ui.tabsBar?.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // ✅ EAD: esconde/mostra o painel inteiro (inclui o título)
  const eadRoot = document.getElementById("eadRoot");
  const eadPanel = eadRoot?.closest("section.panel");
  if (eadPanel) eadPanel.style.display = (tabId === "tab-aulas") ? "" : "none";

  // ✅ ADMIN: Momento do Mestre só aparece no tab-admin
  const mestrePanel = document.getElementById("adminMestreTheme")?.closest("section.panel");
  if (mestrePanel) mestrePanel.style.display = (tabId === "tab-admin") ? "" : "none";

  // ✅ (extra) garante que o container de admin não “vaze”
  const adminArea = document.getElementById("adminArea");
  if (adminArea) adminArea.style.display = (tabId === "tab-admin") ? "" : "none";

 // ✅ monta/inicializa EAD ao entrar em Aulas
if (tabId === "tab-aulas") {
  const host = document.getElementById("eadApp");
  if (host && typeof window.mountEadPlatform === "function") {
    window.mountEadPlatform();
  }
}

render();
}

function openTab(id) {
  return setActiveTab(id);
}

/* ========= PROFESSOR AULA ========= */
function saveAttendanceStaff(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  const lock = getLock(nucleus);

  if (lock.locked && lock.lockedDate === (ui.professorClassDate?.value || staff.classDate)) {
    ui.professorClassStatus.textContent = "Aula já foi encerrada para esta data.";
    return;
  }

  staff.classDate = ui.professorClassDate?.value || "";
  staff.classSchedule = ui.professorClassSchedule?.value?.trim() || "";
  staff.professorName = ui.professorClassProfessorName?.value?.trim() || "";
  staff.monitorName = ui.professorClassMonitorName?.value?.trim() || "";

  if (!staff.classDate) {
    ui.professorClassStatus.textContent = "Defina a data da aula.";
  } else {
    ui.professorClassStatus.textContent = "Dados da aula salvos. Agora você pode marcar presença.";
  }

  persist();
  render();
}

function lockClass(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  if (!staff.classDate) {
    ui.professorClassStatus.textContent = "⚠️ Defina e salve a data da aula antes de encerrar.";
    return;
  }

  const lock = getLock(nucleus);
  lock.locked = true;
  lock.lockedDate = staff.classDate;
  lock.lockedAt = new Date().toISOString();

  const user = currentUser();
  pushNucleusLog(nucleus, "Aula encerrada", `Data ${formatDateLabel(staff.classDate)}`, user);

  persist();
  ui.professorClassStatus.textContent = "Aula encerrada. Presenças congeladas para esta data.";
  render();
}

/* ========= PLANEJAMENTO ========= */
function onSavePlanning(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "professor") return;

  const weekStart = ui.planningWeek?.value || "";
  const theme = ui.planningTheme?.value?.trim() || "";
  if (!weekStart || !theme) return;

  getProjectPlanning().unshift({
    id: crypto.randomUUID(),
    nucleus: user.nucleus,
    professor: user.username,
    weekStart,
    theme,
    goals: ui.planningGoals?.value?.trim() || "",
    activities: ui.planningActivities?.value?.trim() || "",
    createdAt: new Date().toISOString(),
  });

  pushNucleusLog(user.nucleus, "Planejamento", `Semana ${formatDateLabel(weekStart)} • ${theme}`, user);

  persist();
  ui.planningForm.reset();
  renderPlanningList(user.nucleus);
}

function renderPlanningList(nucleus) {
  if (!ui.planningList) return;
  ui.planningList.innerHTML = "";

  const items = getProjectPlanning()
    .filter((p) => p.nucleus === nucleus)
    .sort((a, b) => String(b.weekStart).localeCompare(String(a.weekStart)))
    .slice(0, 12);

  if (!items.length) {
    ui.planningList.innerHTML = `<li class="empty">Sem planejamento semanal cadastrado.</li>`;
    return;
  }

  items.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${formatDateLabel(p.weekStart)} • Tema: ${p.theme} • Momento do Mestre: ${p.goals || "-"} • Atividades: ${p.activities || "-"}`;
    ui.planningList.appendChild(li);
  });
}

function renderProfessorHistory(nucleus) {
  if (!ui.professorHistory) return;
  ui.professorHistory.innerHTML = "";

  const selectedDate = ui.professorHistoryDate?.value || "";
  const entries = state.history
    .filter((h) => h.project === state.currentProjectKey && h.nucleus === nucleus)
    .filter((h) => (selectedDate ? h.timestamp.startsWith(selectedDate) : true))
    .slice(0, 80);

  if (!entries.length) {
    ui.professorHistory.innerHTML = `<li class="empty">Sem histórico da turma.</li>`;
    return;
  }

  entries.forEach((h) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(h.timestamp).toLocaleString("pt-BR")} • ${h.studentName} • ${h.detail}`;
    ui.professorHistory.appendChild(li);
  });
}

function converterInscricaoEmAlunoLocal(inscricao) {
  if (!inscricao || !inscricao.id_inscricao) {
    throw new Error("Inscrição inválida para conversão.");
  }

  const jaExiste = state.students.some(
    (s) =>
      String(s.inscricaoId || "") === String(inscricao.id_inscricao) ||
      (
        String(s.name || "").trim().toLowerCase() === String(inscricao.aluno_nome || "").trim().toLowerCase() &&
        String(s.nucleus || "").trim().toLowerCase() === String(inscricao.nucleo || "").trim().toLowerCase()
      )
  );

  if (jaExiste) {
    return { ok: true, alreadyExists: true };
  }

  const novoAluno = normalizeStudentData({
    id: crypto.randomUUID(),
    inscricaoId: inscricao.id_inscricao,
    name: inscricao.aluno_nome || "",
    nucleus: inscricao.nucleo || "",
    contact: inscricao.aluno_tel ? String(inscricao.aluno_tel) : "",
    modality: inscricao.modalidade || "",
    classSchedule: inscricao.horario || "",
    birthDate: String(inscricao.aluno_nascimento || "").slice(0, 10),
    startDate: isoToday(),
    requirements: inscricao.observacao || inscricao.obs_interna || "",
    guardian: {
      name: inscricao.resp_nome || "",
      phone: inscricao.resp_whatsapp ? String(inscricao.resp_whatsapp) : "",
      email: inscricao.resp_email || "",
      cpf: inscricao.resp_cpf ? String(inscricao.resp_cpf) : "",
    },
    school: {
      name: inscricao.escola || "",
      type: inscricao.rede_ensino || "",
      year: inscricao.ano ? String(inscricao.ano) : "",
    },
    address: {
      street: inscricao.endereco || "",
      number: inscricao.numero ? String(inscricao.numero) : "",
      district: inscricao.bairro || "",
      zip: inscricao.cep ? String(inscricao.cep) : "",
      complement: inscricao.complemento || "",
      uf: inscricao.uf_emissor || "",
    },
    sizes: {
      shirt: "",
      short: "",
      kimono: "",
    },
    extra: {
      cpf: inscricao.aluno_cpf ? String(inscricao.aluno_cpf) : "",
      gender: inscricao.aluno_genero || "",
      parents: [inscricao.mae_nome, inscricao.pai_nome].filter(Boolean).join(" / "),
      enrollDate: String(inscricao.created_at || "").slice(0, 10) || isoToday(),
    },
    pcd: false,
    uniform: { notes: "", items: createEmptyDeliveryItems() },
    attendance: "não registrado",
    attendanceLog: [],
    project: state.currentProjectKey,
  });

  state.students.unshift(novoAluno);

  try {
    const user = currentUser();
    pushNucleusLog(
      novoAluno.nucleus || "-",
      "Conversão da fila",
      `Inscrito convertido em aluno: ${novoAluno.name}`,
      user || { username: "sistema" }
    );
  } catch (e) {}

  persist();
  render();

  return { ok: true, alreadyExists: false, studentId: novoAluno.id };
}

window.converterInscricaoEmAlunoLocal = converterInscricaoEmAlunoLocal;

/* ========= ADD STUDENT ========= */
function onAddStudent(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = el("studentName")?.value?.trim() || "";
  const nucleus = el("studentNucleus")?.value || "";
  const schedule = ui.studentSchedule?.value?.trim() || "";
  const modality = ui.studentModality?.value?.trim() || "";
  const contact = el("studentContact")?.value?.trim() || "";

  if (!name || !getVisibleNuclei().includes(nucleus)) return;

  const pcd = (el("studentPCD")?.value || "nao") === "sim";

  const student = normalizeStudentData({
    id: crypto.randomUUID(),
    name,
    nucleus,
    contact,
    modality,
    classSchedule: schedule,
    birthDate: el("studentBirthDate")?.value || "",
    startDate: el("studentStartDate")?.value || "",
    requirements: el("studentRequirements")?.value?.trim() || "",
    guardian: {
      name: el("guardianName")?.value?.trim() || "",
      phone: el("guardianPhone")?.value?.trim() || "",
      email: el("guardianEmail")?.value?.trim() || "",
      cpf: "",
    },
    school: {
      name: el("studentSchoolName")?.value?.trim() || "",
      type: el("studentSchoolType")?.value || "",
      year: "",
    },
    address: {
      street: el("addrStreet")?.value?.trim() || "",
      number: el("addrNumber")?.value?.trim() || "",
      district: el("addrDistrict")?.value?.trim() || "",
      zip: el("addrZip")?.value?.trim() || "",
      complement: el("addrComplement")?.value?.trim() || "",
      uf: "",
    },
    sizes: {
      shirt: el("sizeShirt")?.value || "",
      short: el("sizeShort")?.value || "",
      kimono: el("sizeKimono")?.value || "",
    },
    extra: {
      cpf: "",
      gender: "",
      parents: "",
      enrollDate: el("studentStartDate")?.value || "",
    },
    pcd,
    uniform: { notes: "", items: createEmptyDeliveryItems() },
    attendance: "não registrado",
    attendanceLog: [],
    project: state.currentProjectKey,
  });

  state.students.unshift(student);

  pushNucleusLog(nucleus, "Cadastro aluno", `Aluno cadastrado: ${name}`, user);

  persist();
  ui.studentForm.reset();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  render();
}

/* ========= CALENDAR ========= */
function getSchedulesFromForm() {
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const start = ui.calendarStartTimes[i]?.value || "";
    const end = ui.calendarEndTimes[i]?.value || "";
    if (start && end) slots.push({ start, end });
  }
  return slots;
}
function formatSchedules(schedules = []) {
  if (!Array.isArray(schedules) || !schedules.length) return "não definidos";
  return schedules.map((s, i) => `${i + 1}) ${s.start} às ${s.end}`).join(" • ");
}
function onSaveClassCalendar(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = el("calendarNucleus")?.value || "";
  if (!getVisibleNuclei().includes(nucleus)) return;

  const date = el("calendarDate")?.value || "";
  const schedules = getSchedulesFromForm();
  const calendar = getProjectCalendar();
  const nuc = calendar[nucleus] || { days: [], schedules: [] };
  calendar[nucleus] = nuc;

  let changed = false;
  if (date && !nuc.days.includes(date)) {
    nuc.days.push(date);
    nuc.days.sort((a, b) => b.localeCompare(a));
    changed = true;
  }
  if (schedules.length) {
    nuc.schedules = schedules;
    changed = true;
  }
  if (!changed) return;

  pushNucleusLog(nucleus, "Calendário", `Aulas/horários atualizados`, user);

  persist();
  ui.classCalendarForm.reset();
  renderClassDays();
  hydrateStudentScheduleOptions();
}

function hydrateGestaoAlunoFiltroNucleo() {
  if (!ui.gestaoAlunoFiltroNucleo) return;

  const atual = ui.gestaoAlunoFiltroNucleo.value || "todos";
  ui.gestaoAlunoFiltroNucleo.innerHTML = `<option value="todos">Todos os núcleos</option>`;

  getVisibleNuclei().forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    ui.gestaoAlunoFiltroNucleo.appendChild(opt);
  });

  if ([...ui.gestaoAlunoFiltroNucleo.options].some((o) => o.value === atual)) {
    ui.gestaoAlunoFiltroNucleo.value = atual;
  } else {
    ui.gestaoAlunoFiltroNucleo.value = "todos";
  }
}

function renderListaAlunosGestao() {
  const body = ui.gestaoAlunosTableBody;
  if (!body) return;

  const busca = (ui.gestaoAlunoBusca?.value || "").trim().toLowerCase();
  const filtroNucleo = ui.gestaoAlunoFiltroNucleo?.value || "todos";
  const filtroModalidade = ui.gestaoAlunoFiltroModalidade?.value || "todos";

  let alunos = getProjectStudents().slice();

  if (filtroNucleo !== "todos") {
    alunos = alunos.filter((a) => String(a.nucleus || "") === filtroNucleo);
  }

  if (filtroModalidade !== "todos") {
    alunos = alunos.filter((a) => String(a.modality || "") === filtroModalidade);
  }

  if (busca) {
    alunos = alunos.filter((a) => {
      const texto = [
        a.name,
        a.nucleus,
        a.modality,
        a.classSchedule,
        a.guardian?.name,
        a.guardian?.phone,
        a.contact,
      ]
        .map((x) => String(x || "").toLowerCase())
        .join(" | ");

      return texto.includes(busca);
    });
  }

  alunos.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));

  if (ui.gestaoAlunosBadge) {
    ui.gestaoAlunosBadge.textContent = String(alunos.length);
  }

  if (!alunos.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="empty">Nenhum aluno encontrado.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = alunos
    .map((a) => {
      const responsavel = a.guardian?.name || "-";
      const contato = a.guardian?.phone || a.contact || "-";

      return `
        <tr>
          <td>${escapeHtml(a.name || "-")}</td>
          <td>${escapeHtml(a.nucleus || "-")}</td>
          <td>${escapeHtml(a.modality || "-")}</td>
          <td>${escapeHtml(a.classSchedule || "-")}</td>
          <td>${escapeHtml(responsavel)}</td>
          <td>${escapeHtml(contato)}</td>
        </tr>
      `;
    })
    .join("");
}

/* ========= VISITANTES ========= */
function onAddVisitor(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = ui.visitorName?.value?.trim() || "";
  const nucleus = ui.visitorNucleus?.value || "";
  const date = ui.visitorDate?.value || "";
  if (!name || !nucleus || !date) return;

  // tenta achar campo de nascimento no HTML (se você adicionou)
  const birthDateNode =
    el("visitorBirthDate") ||
    ui.visitorForm?.querySelector('input[name="visitorBirthDate"]') ||
    ui.visitorForm?.querySelector('input[data-visitor-birth]');

  const visitor = {
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    name,
    nucleus,
    date,
    birthDate: birthDateNode?.value || "",
    contact: ui.visitorContact?.value?.trim() || "",
    notes: ui.visitorNotes?.value?.trim() || "",
    visits: [{ date, ts: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };

  state.visitors.unshift(visitor);
  pushNucleusLog(nucleus, "Visitante", `Visitante cadastrado: ${name}`, user);

  persist();
  ui.visitorForm.reset();
  renderVisitors();
}

function registerVisitorVisit(visitorId) {
  const user = currentUser();
  const visitor = getProjectVisitors().find((v) => v.id === visitorId);
  if (!visitor) return;

  const today = isoToday();
  if (!Array.isArray(visitor.visits)) visitor.visits = [];
  visitor.visits.unshift({ date: today, ts: new Date().toISOString() });
  visitor.date = today;

  pushNucleusLog(visitor.nucleus, "Visita", `Visita registrada: ${visitor.name}`, user);
  persist();
  renderVisitors();
}

function convertVisitorToStudent(visitorId) {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const v = getProjectVisitors().find((x) => x.id === visitorId);
  if (!v) return;

  setActiveTab("tab-gestao");

  // preenche form de aluno
  el("studentName").value = v.name || "";
  el("studentNucleus").value = v.nucleus || getVisibleNuclei()[0] || "";
  hydrateStudentScheduleOptions();
  el("studentContact").value = v.contact || "";
  if (el("studentBirthDate")) el("studentBirthDate").value = v.birthDate || "";
  if (el("studentRequirements")) el("studentRequirements").value = `Convertido de visitante em ${formatDateLabel(isoToday())}`;
  if (el("guardianName")) el("guardianName").focus();

  pushNucleusLog(v.nucleus, "Conversão visitante", `Visitante enviado para matrícula: ${v.name}`, user);
  persist();
}

function renderVisitors() {
  if (!ui.visitorsList || !ui.visitorsBadge) return;

  const list = getProjectVisitors().slice(0, 50);
  ui.visitorsBadge.textContent = String(getProjectVisitors().length);
  ui.visitorsList.innerHTML = "";

  if (!list.length) {
    ui.visitorsList.innerHTML = `<li class="empty">Sem visitantes cadastrados.</li>`;
    return;
  }

  list.forEach((v) => {
    const li = document.createElement("li");
    li.style.listStyle = "none";
    li.style.border = "1px solid var(--border,#ead9dc)";
    li.style.borderRadius = "12px";
    li.style.padding = ".6rem";
    li.style.marginBottom = ".4rem";
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap">
        <div>
          <strong>${escapeHtml(v.name)}</strong> • ${escapeHtml(v.nucleus)}
          <div class="muted" style="font-size:.86rem;margin-top:.2rem">
            Última visita: ${formatDateLabel(v.date)}
            ${v.birthDate ? " • Nascimento: " + escapeHtml(formatDateLabel(v.birthDate)) : ""}
            ${v.contact ? " • " + escapeHtml(v.contact) : ""}
            ${v.notes ? " • " + escapeHtml(v.notes) : ""}
          </div>
          <div class="muted" style="font-size:.82rem">
            Visitas registradas: ${Array.isArray(v.visits) ? v.visits.length : 1}
          </div>
        </div>
        <div style="display:flex;gap:.4rem;align-items:flex-start;flex-wrap:wrap">
          <button type="button" class="small-btn" data-visit="${v.id}">Registrar visita</button>
          <button type="button" class="ghost" data-convert="${v.id}">Converter em aluno</button>
        </div>
      </div>
    `;
    li.querySelector(`[data-visit="${v.id}"]`)?.addEventListener("click", () => registerVisitorVisit(v.id));
    li.querySelector(`[data-convert="${v.id}"]`)?.addEventListener("click", () => convertVisitorToStudent(v.id));
    ui.visitorsList.appendChild(li);
  });
}
/* ========= BOARD (PROF/GESTÃO) ========= */
function renderBoard(target, students, actor) {
  if (!target || !ui.attendanceCardTemplate) return;
  target.innerHTML = "";

  const nuclei = actor.role === "professor" ? [actor.nucleus] : getVisibleNuclei();

  nuclei.forEach((nucleus) => {
    let grouped = students.filter((s) => s.nucleus === nucleus);
    if (state.search) grouped = grouped.filter((s) => safeLower(s.name).includes(state.search));

    const staff = getAttendanceStaffByNucleus(nucleus);
    const lock = getLock(nucleus);

    const column = document.createElement("article");
    column.className = "nucleus-column";
    column.innerHTML = `
      <div class="nucleus-header">
        <h3>${escapeHtml(nucleus)}</h3>
        <span class="badge">${grouped.length}</span>
      </div>
      <p class="class-meta">
        Data: ${staff.classDate ? formatDateLabel(staff.classDate) : "não definida"}
        • Turma: ${escapeHtml(staff.classSchedule || "horário não definido")}
        • Instrutor: ${escapeHtml(staff.professorName || "não informado")}
        • Monitor: ${escapeHtml(staff.monitorName || "não informado")}
        ${lock.locked ? " • ✅ Aula encerrada" : ""}
      </p>
    `;

    if (!grouped.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Sem alunos neste filtro.";
      column.appendChild(empty);
    }

    grouped
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .forEach((student) => {
        const card = ui.attendanceCardTemplate.content.firstElementChild.cloneNode(true);
        const f = frequencyOf(student);

        card.querySelector(".student-name").textContent = student.name;
        card.querySelector(".freq-pill").textContent = `${f.pct}% (${f.present}/${f.total || 0})`;

        const contactLine = [
          student.contact ? `Aluno: ${student.contact}` : "",
          student.guardian?.phone ? `Resp: ${student.guardian.phone}` : "",
          student.guardian?.email || "",
        ].filter(Boolean).join(" • ");
        card.querySelector(".student-contact").textContent = contactLine || "Contato não informado";

        card.querySelector(".student-class-info").textContent =
          `Turma/Horário: ${student.nucleus} • ${staff.classSchedule || student.classSchedule || "horário não informado"}`;

        card.querySelector(".student-status").textContent = `Status (último): ${student.attendance || "não registrado"}`;

        const classDate = staff.classDate || "";
        const enforceRules = () => {
          if (actor.role !== "professor") return true;
          if (!classDate) {
            ui.professorClassStatus.textContent = "⚠️ Salve a DATA DA AULA antes de marcar presença.";
            return false;
          }
          if (lock.locked && lock.lockedDate === classDate) {
            ui.professorClassStatus.textContent = "⚠️ Aula encerrada. Não é possível alterar.";
            return false;
          }
          return true;
        };

        const setStatus = (status) => {
          if (!enforceRules()) return;
          student.attendance = status;
          upsertAttendanceLog(student, classDate || isoToday(), status);
          pushHistory(student, actor, "chamada", `Status: ${attendanceCode(status)} (${formatDateLabel(classDate || isoToday())})`);
          if (actor.role === "professor") {
            pushNucleusLog(nucleus, "Chamada", `${student.name} → ${attendanceCode(status)}`, actor);
          }
          persist();
          render();
        };

        card.querySelector(".btn-present")?.addEventListener("click", () => setStatus("presente"));
        card.querySelector(".btn-absent")?.addEventListener("click", () => setStatus("falta"));
        card.querySelector(".btn-justified")?.addEventListener("click", () => setStatus("justificado"));
        card.querySelector(".btn-sa")?.addEventListener("click", () => setStatus("sa"));

        column.appendChild(card);
      });

    target.appendChild(column);
  });
}

/* ========= DASHBOARD ========= */
function renderMetrics() {
  const students = getProjectStudents();
  ui.totalStudents && (ui.totalStudents.textContent = String(students.length));
  ui.presentCount && (ui.presentCount.textContent = String(students.filter((s) => s.attendance === "presente").length));
  ui.absentCount && (ui.absentCount.textContent = String(students.filter((s) => s.attendance === "falta").length));
  ui.uniformDelivered && (ui.uniformDelivered.textContent = String(students.filter((s) => isKitDelivered(s)).length));
}

function renderNucleusCounts() {
  if (!ui.nucleusCounts) return;
  const nuclei = getVisibleNuclei();
  const students = getProjectStudents();
  ui.nucleusCounts.innerHTML = "";

  nuclei.forEach((n) => {
    const count = students.filter((s) => s.nucleus === n).length;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<span>${escapeHtml(n)}</span> <b>${count}</b>`;
    ui.nucleusCounts.appendChild(chip);
  });

  if (ui.nucleusCountBadge) ui.nucleusCountBadge.textContent = `${nuclei.length} núcleos`;
}

function ensureDashNucleusOptions() {
  if (!ui.dashNucleusFilter) return;
  const val = ui.dashNucleusFilter.value || "todos";
  ui.dashNucleusFilter.innerHTML = `<option value="todos">Todos os núcleos</option>`;
  getVisibleNuclei().forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    ui.dashNucleusFilter.appendChild(opt);
  });
  ui.dashNucleusFilter.value = [...ui.dashNucleusFilter.options].some((o) => o.value === val) ? val : "todos";
}

function fitCanvasToCSS(canvas, minH = 260) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(320, Math.floor(rect.width || 320));
  const h = Math.max(minH, Math.floor(rect.height || minH));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function renderDashboardChart() {
  const canvas = ui.dashChart;
  if (!canvas) return;
  const fit = fitCanvasToCSS(canvas, 320);
  if (!fit) return;
  const { ctx, w, h } = fit;

  const selected = ui.dashNucleusFilter?.value || "todos";
  const nuclei = selected === "todos" ? getVisibleNuclei() : [selected];

  const data = nuclei.map((n) => {
    const list = getProjectStudents().filter((s) => s.nucleus === n);
    return {
      nucleus: n,
      total: list.length,
      presente: list.filter((s) => s.attendance === "presente").length,
      falta: list.filter((s) => s.attendance === "falta").length,
      justificado: list.filter((s) => s.attendance === "justificado").length,
      sa: list.filter((s) => s.attendance === "sa").length,
    };
  });

  ctx.clearRect(0, 0, w, h);

  const pad = 42;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;

  // eixos
  ctx.strokeStyle = "#cfcfd4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + chartH);
  ctx.lineTo(pad + chartW, pad + chartH);
  ctx.stroke();

  const max = Math.max(1, ...data.map((d) => d.total));
  const step = chartW / Math.max(1, data.length);
  const barW = Math.max(28, step * 0.55);

  data.forEach((d, i) => {
    const x = pad + i * step + (step - barW) / 2;
    let topY = pad + chartH;

    const segs = [
      { v: d.presente, color: "#1f8a57" },
      { v: d.justificado, color: "#2c3f8f" },
      { v: d.falta, color: "#b31d2f" },
      { v: d.sa, color: "#888888" },
    ];

    segs.forEach((seg) => {
      const hh = (seg.v / max) * chartH;
      if (hh <= 0) return;
      topY -= hh;
      ctx.fillStyle = seg.color;
      ctx.fillRect(x, topY, barW, hh);
    });

    // borda
    ctx.strokeStyle = "#d9d9de";
    ctx.strokeRect(x, pad + chartH - (d.total / max) * chartH, barW, (d.total / max) * chartH);

    // rótulos
    ctx.fillStyle = "#222";
    ctx.font = "12px Arial";
    const short = d.nucleus.length > 11 ? d.nucleus.slice(0, 11) + "…" : d.nucleus;
    ctx.fillText(short, x - 4, pad + chartH + 16);

    const pct = d.total ? Math.round(((d.presente + d.justificado) / d.total) * 100) : 0;
    ctx.fillStyle = "#555";
    ctx.fillText(`${pct}%`, x + 2, Math.max(14, pad + chartH - (d.total / max) * chartH - 6));
  });
}

function renderDashboardMiniChart() {
  const canvas = ui.dashMiniChart;
  if (!canvas) return;
  const fit = fitCanvasToCSS(canvas, 240);
  if (!fit) return;

  const { ctx, w, h } = fit;
  ctx.clearRect(0, 0, w, h);

  const showFixed = !!ui.dashShowFixed?.checked;
  const showVisitors = !!ui.dashShowVisitors?.checked;
  const showPCD = !!ui.dashShowPCD?.checked;

  const students = getProjectStudents();
  const visitors = getProjectVisitors();

  // "fixos" = quem tem 5+ registros no attendanceLog
  const fixedCount = students.filter((s) => ensureAttendanceLog(s).filter((x) => x.project === state.currentProjectKey).length >= 5).length;
  const visitorCount = visitors.length;
  const pcdCount = students.filter((s) => !!s.pcd).length;

  const series = [];
  if (showFixed) series.push({ label: "Fixos", value: fixedCount });
  if (showVisitors) series.push({ label: "Visitantes", value: visitorCount });
  if (showPCD) series.push({ label: "PCD", value: pcdCount });

  if (!series.length) {
    if (ui.dashMiniBadge) ui.dashMiniBadge.textContent = "Selecione ao menos 1 série";
    return;
  }

  // gráfico de LINHA (como você pediu)
  const pad = 36;
  const chartW = w - pad * 2;
  const chartH = h - pad * 2;
  const max = Math.max(1, ...series.map((s) => s.value));

  // eixos
  ctx.strokeStyle = "#cfcfd4";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + chartH);
  ctx.lineTo(pad + chartW, pad + chartH);
  ctx.stroke();

  const step = series.length > 1 ? chartW / (series.length - 1) : 0;

  // linha
  ctx.strokeStyle = "#8f1422";
  ctx.lineWidth = 2;
  ctx.beginPath();

  series.forEach((s, i) => {
    const x = pad + i * step;
    const y = pad + chartH - (s.value / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // pontos + labels
  series.forEach((s, i) => {
    const x = pad + i * step;
    const y = pad + chartH - (s.value / max) * chartH;

    ctx.fillStyle = "#8f1422";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.font = "12px Arial";
    ctx.fillText(s.label, x - 18, pad + chartH + 16);
    ctx.fillStyle = "#555";
    ctx.fillText(String(s.value), x - 6, y - 8);
  });

  if (ui.dashMiniBadge) {
    ui.dashMiniBadge.textContent = series.map((s) => `${s.label}: ${s.value}`).join(" • ");
  }
}

/* ========= CALENDÁRIO E RELATÓRIO TEMPO REAL ========= */
function renderClassDays() {
  if (!ui.classCalendarBoard) return;
  ui.classCalendarBoard.innerHTML = "";
  const calendar = getProjectCalendar();

  getVisibleNuclei().forEach((nucleus) => {
    const data = calendar[nucleus] || { days: [], schedules: [] };
    const days = data.days || [];
    const card = document.createElement("article");
    card.className = "calendar-card";
    card.innerHTML = `
      <div class="calendar-header">
        <h3>${escapeHtml(nucleus)}</h3>
        <span class="badge">${days.length} aulas</span>
      </div>
      <p class="muted">Horários: ${escapeHtml(formatSchedules(data.schedules))}</p>
    `;

    if (!days.length) {
      card.innerHTML += `<p class="empty">Sem aulas registradas.</p>`;
    } else {
      const list = document.createElement("ul");
      list.className = "history-list";
      days.slice(0, 12).forEach((d) => {
        const li = document.createElement("li");
        li.textContent = formatDateLabel(d);
        list.appendChild(li);
      });
      card.appendChild(list);
    }
    ui.classCalendarBoard.appendChild(card);
  });
}

function renderAttendanceReport() {
  if (!ui.attendanceReportBoard) return;
  ui.attendanceReportBoard.innerHTML = "";

  const nuclei = state.attendanceFilter === "todos" ? getVisibleNuclei() : [state.attendanceFilter];

  nuclei.forEach((nucleus) => {
    const students = getProjectStudents()
      .filter((s) => s.nucleus === nucleus)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const staff = getAttendanceStaffByNucleus(nucleus);

    const present = students.filter((s) => s.attendance === "presente").length;
    const absent = students.filter((s) => s.attendance === "falta").length;
    const justified = students.filter((s) => s.attendance === "justificado").length;
    const sa = students.filter((s) => s.attendance === "sa").length;
    const pct = students.length ? Math.round(((present + justified) / students.length) * 100) : 0;

    const card = document.createElement("article");
    card.className = "calendar-card";
    card.innerHTML = `
      <div class="calendar-header">
        <h3>${escapeHtml(nucleus)}</h3>
        <span class="badge">${students.length} alunos</span>
      </div>
      <p><strong>Data:</strong> ${staff.classDate ? formatDateLabel(staff.classDate) : "-"}</p>
      <p><strong>Turma:</strong> ${escapeHtml(staff.classSchedule || "-")}</p>
      <p><strong>Professor:</strong> ${escapeHtml(staff.professorName || "-")} • <strong>Monitor:</strong> ${escapeHtml(staff.monitorName || "-")}</p>
      <p><strong>Resumo:</strong> ${present} presentes • ${absent} faltas • ${justified} justificados • ${sa} S/A • ${pct}% presença</p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Aluno</th>
              <th>Status</th>
              <th>Freq</th>
              <th>Responsável</th>
              <th>Escola</th>
            </tr>
          </thead>
          <tbody>
            ${
              students.map((s, idx) => {
                const f = frequencyOf(s);
                const resp = s.guardian?.name
                  ? `${escapeHtml(s.guardian.name)}${s.guardian.phone ? " • " + escapeHtml(s.guardian.phone) : ""}`
                  : "-";
                const escola = s.school?.name
                  ? `${escapeHtml(s.school.name)}${s.school.type ? " • " + escapeHtml(s.school.type) : ""}`
                  : "-";
                return `
                  <tr>
                    <td>#${idx + 1}</td>
                    <td>${escapeHtml(s.name)}</td>
                    <td>${attendanceCodePrint(s.attendance)}</td>
                    <td>${f.present}/${f.total || 0} (${f.pct}%)</td>
                    <td>${resp}</td>
                    <td>${escola}</td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="6" class="empty">Sem alunos.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;
    ui.attendanceReportBoard.appendChild(card);
  });
}

/* ========= ALERTAS ========= */
function renderAlerts() {
  if (!ui.alertsBoard) return;
  ui.alertsBoard.innerHTML = "";

  // escopo: professor só vê o núcleo dele
  const user = currentUser();
  const students = getScopedStudents(); // vamos criar no passo 2

  const alerts = students
    .map((s) => ({ s, a: getStudentAlertLevel(s) }))
    .filter(({ a }) => a.level !== "ok")
    .sort((x, y) => (x.a.level === "crit" ? -1 : 1) - (y.a.level === "crit" ? -1 : 1))
    .slice(0, 40);

  if (!alerts.length) {
    ui.alertsBoard.innerHTML = `<li class="empty">Sem alertas no momento.</li>`;
    return;
  }

  alerts.forEach(({ s, a }) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.gap = "10px";
    li.style.alignItems = "flex-start";
    li.style.flexWrap = "wrap";

    const tag = a.level === "crit" ? "🔴" : "🟠";

    li.innerHTML = `
      <div>
        <strong>${tag} ${escapeHtml(s.name)}</strong> (${escapeHtml(s.nucleus)})<br/>
        <span class="muted">${escapeHtml(a.reason)}</span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap">
        <button type="button" class="small-btn" data-wa="${s.id}">Avisar no WhatsApp</button>
      </div>
    `;

    li.querySelector(`[data-wa="${s.id}"]`)?.addEventListener("click", () => openWhatsappToStudent(s));
    ui.alertsBoard.appendChild(li);
  });
}

/* ========= WHATSAPP ========= */
function hydrateWhatsStudents() {
  if (!ui.whatsStudent) return;
  const current = ui.whatsStudent.value || "";
  const students = getProjectStudents().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  ui.whatsStudent.innerHTML = "";
  students.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.nucleus})`;
    ui.whatsStudent.appendChild(opt);
  });
  if ([...ui.whatsStudent.options].some((o) => o.value === current)) ui.whatsStudent.value = current;
}

function onOpenWhatsapp(event) {
  event.preventDefault();
  const student = getProjectStudents().find((s) => s.id === ui.whatsStudent?.value);
  if (!student) return;

  const rawPhone = student.contact || student.guardian?.phone || "";
  const phone = rawPhone.replace(/\D/g, "");
  const msg = encodeURIComponent(ui.whatsMessage?.value?.trim() || `Olá ${student.name}, lembramos da sua próxima aula no IIN.`);

  if (!phone) {
    if (ui.whatsStatus) ui.whatsStatus.textContent = "Contato sem número de telefone válido.";
    return;
  }

  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  if (ui.whatsStatus) ui.whatsStatus.textContent = `WhatsApp aberto para ${student.name}.`;
}

function buildTeacherWhatsappText(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  const date = staff.classDate ? formatDateLabel(staff.classDate) : "(data não definida)";
  const schedule = staff.classSchedule || "(horário não definido)";
  const students = getProjectStudents()
    .filter((s) => s.nucleus === nucleus)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const lines = [
    `*IIN • Chamada ${nucleus}*`,
    `Data: ${date}`,
    `Horário: ${schedule}`,
    "",
    "*Lista:*",
  ];

  students.forEach((s, i) => lines.push(`${String(i + 1).padStart(2, "0")}. ${s.name} — ${attendanceCode(s.attendance)}`));
  return lines.join("\n");
}

function onTeacherWhatsapp() {
  const user = currentUser();
  if (!user || user.role !== "professor") return;

  const settings = ensureProjectSettings();
  const groupLink = (settings.whatsappGroupLink || "").trim();

  // se tiver link do grupo configurado, abre o grupo. Se não, abre WhatsApp com texto
  if (groupLink) {
    window.open(groupLink, "_blank");
    pushNucleusLog(user.nucleus, "WhatsApp grupo", "Professor abriu link do grupo", user);
    persist();
    return;
  }

  const text = buildTeacherWhatsappText(user.nucleus);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  pushNucleusLog(user.nucleus, "WhatsApp", "Professor abriu texto pronto", user);
  persist();
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);

  function fallbackCopy(t) {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/* ========= PROFESSOR: ATESTADO + MOMENTO DO MESTRE ========= */
function onTeacherSaveAtestado() {
  const user = currentUser();
  if (!user || user.role !== "professor") return;

  const type = ui.teacherAbsType?.value || "aluno";
  const file = ui.teacherAbsFile?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || "");

    if (type === "aluno") {
      const sid = ui.teacherAbsStudent?.value;
      const student = getProjectStudents().find((s) => s.id === sid);
      if (!student) return;

      if (!Array.isArray(student.absences)) student.absences = [];
      student.absences.unshift({
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        name: file.name,
        dataUrl,
      });

      // marca justificado na data atual da turma (ou hoje)
      const staff = getAttendanceStaffByNucleus(user.nucleus);
      const dateRef = staff.classDate || isoToday();
      student.attendance = "justificado";
      upsertAttendanceLog(student, dateRef, "justificado", { atestado: true, fileName: file.name });

      pushHistory(student, user, "atestado", `Atestado anexado: ${file.name}`);
      pushNucleusLog(user.nucleus, "Atestado aluno", `${student.name} • ${file.name}`, user);
    } else {
      pushNucleusLog(user.nucleus, "Atestado professor", `Arquivo: ${file.name}`, user);
    }

    persist();
    render();
  };

  reader.readAsDataURL(file);
}

function onAdminSaveMestreThemePDF() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;
  const theme = ui.adminMestreTheme?.value;
  const file = ui.adminMestreFile?.files?.[0];
  if (!theme || !file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const bag = ensureMestreDocs();
    bag[theme] = {
      id: crypto.randomUUID(),
      theme,
      ts: new Date().toISOString(),
      name: file.name,
      dataUrl: String(reader.result || ""),
    };

    pushNucleusLog(getVisibleNuclei()[0] || "-", "Momento do Mestre (Admin)", `Tema ${theme} atualizado`, user);
    persist();
    renderAdminMestreTable();
  };
  reader.readAsDataURL(file);
}

function onTeacherOpenMestrePDF() {
  const user = currentUser();
  if (!user || user.role !== "professor") return;
  const theme = ui.teacherMestreTheme?.value;
  if (!theme) return;

  const doc = ensureMestreDocs()[theme];
  if (!doc?.dataUrl) {
    alert("Esse tema ainda não possui PDF cadastrado pelo Admin.");
    return;
  }

  pushNucleusLog(user.nucleus, "Momento do Mestre", `Abriu tema: ${theme}`, user);
  persist();
  openPdfModal(`Momento do Mestre • ${theme}`, doc.dataUrl);
}

function renderAdminMestreTable() {
  if (!ui.adminMestreTableBody) return;
  ui.adminMestreTableBody.innerHTML = "";

  const bag = ensureMestreDocs();

  MESTRE_THEMES.forEach((theme) => {
    const row = bag[theme];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(theme.replaceAll("_", " "))}</td>
      <td>${row ? `✅ ${escapeHtml(row.name)}` : "❌ Sem PDF"}</td>
      <td>
        <button type="button" class="ghost" data-open="${theme}" ${row ? "" : "disabled"}>Abrir</button>
        <button type="button" class="ghost" data-del="${theme}" ${row ? "" : "disabled"}>Remover</button>
      </td>
    `;
    tr.querySelector(`[data-open="${theme}"]`)?.addEventListener("click", () => openPdfModal(`Tema • ${theme}`, bag[theme].dataUrl));
    tr.querySelector(`[data-del="${theme}"]`)?.addEventListener("click", () => {
      const user = currentUser();
      bag[theme] = null;
      pushNucleusLog(getVisibleNuclei()[0] || "-", "Momento do Mestre (Admin)", `Tema ${theme} removido`, user);
      persist();
      renderAdminMestreTable();
    });
    ui.adminMestreTableBody.appendChild(tr);
  });
}

function openPdfModal(title, dataUrl) {
  if (!ui.pdfModal || !ui.pdfFrame) return;
  ui.pdfModalTitle && (ui.pdfModalTitle.textContent = title || "Documento");
  ui.pdfFrame.src = dataUrl || "";
  ui.pdfModal.classList.remove("hidden");
}
function closePdfModal() {
  if (!ui.pdfModal || !ui.pdfFrame) return;
  ui.pdfFrame.src = "";
  ui.pdfModal.classList.add("hidden");
}

/* ========= LOG MODAL ========= */
function openLogModal(nucleus, title) {
  if (!ui.logModal || !ui.logModalBody) return;

  ui.logModalTitle && (ui.logModalTitle.textContent = title || "Registros");
  ui.logModalBody.innerHTML = "";

  let rows = [];
  if (nucleus === "todos") {
    getVisibleNuclei().forEach((n) => {
      rows = rows.concat(getNucleusLogs(n).map((r) => ({ ...r, nucleus: n })));
    });
    rows.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
    rows = rows.slice(0, 300);
  } else {
    rows = getNucleusLogs(nucleus).slice(0, 300);
  }

  if (!rows.length) {
    ui.logModalBody.innerHTML = `<tr><td colspan="5" class="empty">Sem registros.</td></tr>`;
    ui.logModal.classList.remove("hidden");
    return;
  }

  const tableInModal = ui.logModalBody.closest("table");
  if (tableInModal) {
    ui.logModalBody.innerHTML = rows.map((r) => `
      <tr>
        <td>${escapeHtml(new Date(r.ts).toLocaleString("pt-BR"))}</td>
        <td>${escapeHtml(r.nucleus || "-")}</td>
        <td>${escapeHtml(r.event || "-")}</td>
        <td>${escapeHtml(r.by || "-")}</td>
        <td>${escapeHtml(r.detail || "-")}</td>
      </tr>
    `).join("");
  } else {
    // fallback
    const t = document.createElement("table");
    t.className = "log-table";
    t.innerHTML = `
      <thead><tr><th>Data/Hora</th><th>Núcleo</th><th>Evento</th><th>Usuário</th><th>Detalhe</th></tr></thead>
      <tbody>${rows.map((r) => `
        <tr>
          <td>${escapeHtml(new Date(r.ts).toLocaleString("pt-BR"))}</td>
          <td>${escapeHtml(r.nucleus || "-")}</td>
          <td>${escapeHtml(r.event || "-")}</td>
          <td>${escapeHtml(r.by || "-")}</td>
          <td>${escapeHtml(r.detail || "-")}</td>
        </tr>`).join("")}</tbody>`;
    ui.logModalBody.appendChild(t);
  }

  ui.logModal.classList.remove("hidden");
}
function closeLogModal() {
  ui.logModal?.classList.add("hidden");
}

/* ========= UNIFORMES / ESTOQUE ========= */
function renderItemDeliveryControls(container, student) {
  container.innerHTML = "";
  const allowed = getAllowedItemsByModality(student.modality);
  if (!allowed.length) {
    container.textContent = "Sem itens configurados";
    return null;
  }

  const delivered = allowed.filter((k) => student.uniform?.items?.[k]);
  const p = document.createElement("p");
  p.className = "item-delivery-current";
  p.textContent = delivered.length ? `Recebido: ${delivered.map(labelStockCategory).join(", ")}` : "Recebido: nenhum item";

  const select = document.createElement("select");
  select.className = "item-delivery-select";
  select.innerHTML = `<option value="">Selecionar item entregue</option>`;
  allowed.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${labelStockCategory(k)}${student.uniform?.items?.[k] ? " (já entregue)" : ""}`;
    select.appendChild(opt);
  });

  container.appendChild(p);
  container.appendChild(select);
  return { select };
}

function applyUniformUpdate(student, nextItems) {
  const stockByNucleus = getProjectStock();
  const nucStock =
    stockByNucleus[student.nucleus] ||
    (stockByNucleus[student.nucleus] = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0])));

  const allowed = getAllowedItemsByModality(student.modality);
  const prev = student.uniform.items || createEmptyDeliveryItems();
  const merged = { ...prev, ...nextItems };

  for (const key of allowed) {
    const was = !!prev[key];
    const will = !!merged[key];

    if (!was && will) {
      if ((nucStock[key] || 0) <= 0) {
        merged[key] = false;
        continue;
      }
      nucStock[key] = Math.max(0, (nucStock[key] || 0) - 1);
    }
    if (was && !will) {
      nucStock[key] = (nucStock[key] || 0) + 1;
    }
  }

  student.uniform.items = merged;
  persist();
  render();
}

function renderUniformTable() {
  if (!ui.uniformTableBody) return;
  const user = currentUser();
  if (!user) return;

  const canDelete = user.role === "admin";
  const students = getProjectStudents().filter((s) =>
    state.uniformFilter === "todos" ? true : s.nucleus === state.uniformFilter
  );

  ui.uniformTableBody.innerHTML = "";
  if (!students.length) {
    ui.uniformTableBody.innerHTML = `<tr><td colspan="7" class="empty">Sem alunos para o filtro.</td></tr>`;
    return;
  }

  students.forEach((student) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.nucleus)}</td>
      <td>${escapeHtml(student.modality || "-")}</td>
      <td>${escapeHtml(formatAllowedItems(student.modality))}</td>
      <td data-role="items"></td>
      <td><button class="small-btn" type="button" data-save="${student.id}">Salvar</button></td>
      <td><button class="ghost" type="button" data-del="${student.id}" ${canDelete ? "" : "disabled"}>Excluir</button></td>
    `;

    const itemsCell = tr.querySelector('[data-role="items"]');
    const controls = renderItemDeliveryControls(itemsCell, student);

    tr.querySelector(`[data-save="${student.id}"]`)?.addEventListener("click", () => {
      const next = { ...(student.uniform.items || createEmptyDeliveryItems()) };
      if (controls?.select?.value) next[controls.select.value] = true;
      applyUniformUpdate(student, next);

      const user = currentUser();
      if (controls?.select?.value) {
        pushNucleusLog(student.nucleus, "Kit", `Entregue ${labelStockCategory(controls.select.value)} para ${student.name}`, user);
        persist();
      }
    });

    tr.querySelector(`[data-del="${student.id}"]`)?.addEventListener("click", () => {
      if (!canDelete) return;
      const user = currentUser();
      pushNucleusLog(student.nucleus, "Aluno excluído", `Exclusão: ${student.name}`, user);
      state.students = state.students.filter((x) => x.id !== student.id);
      persist();
      render();
    });

    ui.uniformTableBody.appendChild(tr);
  });
}

function renderStock() {
  if (!ui.stockView) return;
  ui.stockView.innerHTML = "";

  const totals = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0]));
  Object.values(getProjectStock()).forEach((nucStock) => {
    STOCK_CATEGORIES.forEach((i) => {
      totals[i.key] += Number(nucStock?.[i.key] || 0);
    });
  });

  STOCK_CATEGORIES.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stock-card";
    card.innerHTML = `<h4>${escapeHtml(item.label)}</h4><p>${totals[item.key] || 0} unidades</p>`;
    ui.stockView.appendChild(card);
  });
}

function onAdjustStock(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const itemKey = el("stockSize")?.value;
  const delta = Number(el("stockDelta")?.value || 0);
  if (!itemKey || !Number.isFinite(delta)) return;

  // ajuste simples no 1º núcleo do projeto (como estava)
  const nucleus = getVisibleNuclei()[0];
  const stockByNucleus = getProjectStock();
  if (!stockByNucleus[nucleus]) stockByNucleus[nucleus] = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0]));
  stockByNucleus[nucleus][itemKey] = Math.max(0, Number(stockByNucleus[nucleus][itemKey] || 0) + delta);

  pushNucleusLog(nucleus, "Estoque", `Ajuste ${labelStockCategory(itemKey)}: ${delta >= 0 ? "+" : ""}${delta}`, user);

  persist();
  render();
}

/* ========= ADMIN USUÁRIOS ========= */
function onCreateUser(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const username = el("newUsername")?.value?.trim() || "";
  const password = el("newPassword")?.value || "";
  const role = el("newRole")?.value || "professor";
  const nucleus = el("newNucleus")?.value || "";

  if (!username || !password) return;
  if (getProjectUsers().some((u) => u.username === username)) {
    alert("Esse usuário já existe.");
    return;
  }

  state.users.push({
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    username,
    password,
    role,
    nucleus: role === "professor" ? nucleus : null,
  });

  persist();
  ui.userForm?.reset();
  renderUsersTable();
}

function renderUsersTable() {
  if (!ui.usersTableBody) return;
  const admin = currentUser();
  if (!admin || admin.role !== "admin") return;

  ui.usersTableBody.innerHTML = "";

  getProjectUsers().forEach((u) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(labelRole(u.role))}</td>
      <td>${escapeHtml(u.nucleus || "-")}</td>

      <td>
        <div class="pass-wrap">
          <input type="password" value="${escapeHtml(u.password)}" data-pass="${u.id}" />

          <button
            type="button"
            class="ghost eye-btn"
            data-eye="${u.id}"
            aria-label="Mostrar/ocultar senha"
            title="Mostrar/ocultar senha"
          >
            <span class="eye-icon" data-eye-icon="${u.id}">${ICON_EYE_OPEN}</span>
          </button>
        </div>
      </td>

      <td>
        <button type="button" class="small-btn" data-save="${u.id}">Salvar senha</button>
        <button type="button" class="ghost" data-del="${u.id}" ${u.id === admin.id ? "disabled" : ""}>Excluir</button>
      </td>
    `;

    // ✅ alterna senha + troca ícone
    tr.querySelector(`[data-eye="${u.id}"]`)?.addEventListener("click", () => {
      const inp = tr.querySelector(`[data-pass="${u.id}"]`);
      const iconWrap = tr.querySelector(`[data-eye-icon="${u.id}"]`);
      if (!inp) return;

      const show = inp.type === "password";
      inp.type = show ? "text" : "password";

      if (iconWrap) {
        iconWrap.innerHTML = show ? ICON_EYE_CLOSED : ICON_EYE_OPEN;
      }
    });

    // salvar senha
    tr.querySelector(`[data-save="${u.id}"]`)?.addEventListener("click", () => {
      const newPass = tr.querySelector(`[data-pass="${u.id}"]`)?.value || "";
      u.password = newPass;
      persist();
    });

    // excluir usuário
    tr.querySelector(`[data-del="${u.id}"]`)?.addEventListener("click", () => {
      if (u.id === admin.id) return;
      state.users = state.users.filter((x) => x.id !== u.id);
      persist();
      renderUsersTable();
    });

    ui.usersTableBody.appendChild(tr);
  });
}

/* ========= RELATÓRIOS ========= */
function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "diario") return { start: new Date(end), end, label: "Diário" };
  if (period === "mensal") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end, label: "Mensal" };
  if (period === "trimestral") return { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end, label: "Trimestral" };
  if (period === "semestral") return { start: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1), end, label: "Semestral" };
  if (period === "anual") return { start: new Date(now.getFullYear(), 0, 1), end, label: "Anual" };

  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start, end, label: "Semanal" };
}
function getReportNuclei(nucleusFilter = "todos") {
  return nucleusFilter !== "todos" ? [nucleusFilter] : getVisibleNuclei();
}
function updateReportRangeInfo() {
  if (!ui.adminReportRangeInfo) return;
  const period = ui.adminReportPeriod?.value || "semanal";
  const { start, end, label } = getPeriodRange(period);
  ui.adminReportRangeInfo.textContent = `Período selecionado (${label}): ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}.`;
}

function onGenerateReportTXT() {
  const period = ui.adminReportPeriod?.value || "semanal";
  const nucleusFilter = ui.adminReportNucleusFilter?.value || "todos";
  const content = buildReportTXT(period, nucleusFilter);
  downloadReportTXT(content, period, nucleusFilter);
  if (ui.adminReportStatus) ui.adminReportStatus.textContent = "Relatório TXT baixado com sucesso.";
}

function buildReportTXT(period, nucleusFilter = "todos") {
  const { start, end, label } = getPeriodRange(period);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  const project = currentProject();

  const lines = [
    "INSTITUTO IRMÃOS NOGUEIRA",
    `PROJETO: ${project.label}`,
    `PROCESSO: ${project.processNumber || "-"}`,
    `RELATÓRIO: ${label}`,
    `PERÍODO: ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`,
    `GERADO EM: ${new Date().toLocaleString("pt-BR")}`,
    "",
  ];

  getReportNuclei(nucleusFilter).forEach((nucleus) => {
    const students = getProjectStudents()
      .filter((s) => s.nucleus === nucleus)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const staff = getAttendanceStaffByNucleus(nucleus);
    const cal = getProjectCalendar()[nucleus] || { days: [], schedules: [] };
    const daysInPeriod = (cal.days || []).filter((d) => d >= startIso && d <= endIso);

    lines.push(`NÚCLEO: ${nucleus}`);
    lines.push(`Data aula: ${staff.classDate ? formatDateLabel(staff.classDate) : "-"} | Horário: ${staff.classSchedule || "-"} | Professor: ${staff.professorName || "-"} | Monitor: ${staff.monitorName || "-"}`);
    lines.push(`Horários cadastrados: ${formatSchedules(cal.schedules)}`);
    lines.push(`Dias de aula no período: ${daysInPeriod.length ? daysInPeriod.map(formatDateLabel).join(", ") : "nenhum"}`);

    if (!students.length) {
      lines.push("- Sem alunos");
    } else {
      students.forEach((s) => {
        const f = frequencyOf(s);
        lines.push(`- ${s.name} | ${s.modality || "-"} | ${s.classSchedule || "-"} | Status ${attendanceCode(s.attendance)} | Freq ${f.present}/${f.total} (${f.pct}%)`);
      });
    }
    lines.push("");
  });

  return lines.join("\n");
}

function downloadReportTXT(content, period, nucleusFilter = "todos") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const nucleusSlug = String(nucleusFilter || "todos").toLowerCase().replaceAll(" ", "-");
  a.download = `relatorio-${state.currentProjectKey}-${nucleusSlug}-${period}-${toIsoDate(new Date())}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function onPrintReport() {
  const period = ui.adminReportPeriod?.value || "semanal";
  const nucleusFilter = ui.adminReportNucleusFilter?.value || "todos";
  printReport(period, nucleusFilter);
}

function reportModeColumns(mode) {
  // resumido / profissional / completo / personalizado
  if (mode === "resumido") {
    return [
      { key: "_name", label: "Aluno" },
      { key: "_schedule", label: "Turma/Horário" },
      { key: "_status", label: "Status" },
      { key: "_freq", label: "Frequência" },
    ];
  }

  if (mode === "profissional") {
    // importante + nascimento + CPF (pedido)
    return [
      { key: "_name", label: "Aluno" },
      { key: "birthDate", label: "Data nascimento" },
      { key: "cpf", label: "CPF do aluno" },
      { key: "_nucleus", label: "Núcleo" },
      { key: "modality", label: "Modalidade" },
      { key: "_schedule", label: "Turma/Horário" },
      { key: "_status", label: "Status" },
      { key: "_freq", label: "Frequência" },
      { key: "guardianContact", label: "Contato responsável" },
    ];
  }

  if (mode === "personalizado") {
    const selectedCustom = CUSTOM_FIELDS.filter((f) => state.reportPrefs.fields[f.key]);
    return [
      { key: "_name", label: "Aluno" },
      { key: "_schedule", label: "Turma/Horário" },
      { key: "_status", label: "Status" },
      { key: "_freq", label: "Frequência" },
      ...selectedCustom,
    ];
  }

  // completo
  return [
    { key: "_name", label: "Aluno" },
    { key: "_schedule", label: "Turma/Horário" },
    { key: "_status", label: "Status" },
    { key: "_freq", label: "Frequência" },
    ...CUSTOM_FIELDS,
  ];
}

function ageFromBirthDate(birthIso, ref = new Date()) {
  const iso = String(birthIso || "").trim();
  if (!iso) return "";

  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "";

  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;

  if (age < 0) age = 0;
  return String(age);
}

function fieldValueForReport(student, key, staff) {
  const f = frequencyOf(student);

  if (key === "_name") return escapeHtml(student.name || "-");
  if (key === "_schedule") return escapeHtml(staff.classSchedule || student.classSchedule || "-");
  if (key === "_status") return attendanceCodePrint(student.attendance);
  if (key === "_freq") return `${f.present}/${f.total || 0} (${f.pct}%)`;
  if (key === "_nucleus") return escapeHtml(student.nucleus || "-");

  if (key === "cpf") return escapeHtml(student.extra?.cpf || "-");
  if (key === "birthDate") return escapeHtml(student.birthDate ? formatDateLabel(student.birthDate) : "-");
  if (key === "age") return escapeHtml(ageFromBirthDate(student.birthDate) || "-");
  if (key === "gender") return escapeHtml(student.extra?.gender || "-");
  if (key === "uf") return escapeHtml(student.address?.uf || "-");
  if (key === "address") {
    if (!student.address?.street) return "-";
    return escapeHtml(`${student.address.street}, ${student.address.number || "s/n"} • ${student.address.district || "-"}`);
  }
  if (key === "zip") return escapeHtml(student.address?.zip || "-");
  if (key === "pcd") return escapeHtml(student.pcd ? "Sim" : "Não");
  if (key === "parents") return escapeHtml(student.extra?.parents || "-");
  if (key === "school") {
    const txt = [
      student.school?.name || "",
      student.school?.type || "",
      student.school?.year || "",
    ].filter(Boolean).join(" • ");
    return escapeHtml(txt || "-");
  }
  if (key === "uniform") {
    const txt = [
      student.sizes?.shirt ? `Cam ${student.sizes.shirt}` : "",
      student.sizes?.short ? `Short ${student.sizes.short}` : "",
      student.sizes?.kimono ? `Kim ${student.sizes.kimono}` : "",
    ].filter(Boolean).join(" • ");
    return escapeHtml(txt || "-");
  }
  if (key === "nucleus") return escapeHtml(student.nucleus || "-");
  if (key === "modality") return escapeHtml(student.modality || "-");
  if (key === "guardianCpf") return escapeHtml(student.guardian?.cpf || "-");
  if (key === "guardianEmail") return escapeHtml(student.guardian?.email || "-");
  if (key === "guardianContact") return escapeHtml(student.guardian?.phone || student.contact || "-");
  if (key === "enrollDate") return escapeHtml(student.extra?.enrollDate ? formatDateLabel(student.extra.enrollDate) : (student.startDate ? formatDateLabel(student.startDate) : "-"));
  if (key === "schedule") return escapeHtml(student.classSchedule || "-");

  return "-";
}

function buildPrintableInnerHTML(period, nucleusFilter = "todos", doc) {
  const { start, end, label } = getPeriodRange(period);
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);

  const mode = ui.printType?.value || state.reportPrefs.printType || "completo";
  const columns = reportModeColumns(mode);
  const nuclei = getReportNuclei(nucleusFilter);
  const project = currentProject();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const logoUrl = new URL("logo.png", window.location.href).href;
  const docId = doc?.docId || "-";
  const issuedAtLabel = doc?.issuedAtLabel || "-";

  const sections = nuclei.map((nucleus) => {
  const students = getProjectStudents()
    .filter((s) => s.nucleus === nucleus)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const staff = getAttendanceStaffByNucleus(nucleus);

  const cal = getProjectCalendar()[nucleus] || { days: [], schedules: [] };
  const totalEncontros = (cal.days || []).filter((d) => d >= startIso && d <= endIso).length;

  const present = students.filter((s) => s.attendance === "presente").length;
  const absent = students.filter((s) => s.attendance === "falta").length;
  const justified = students.filter((s) => s.attendance === "justificado").length;
  const sa = students.filter((s) => s.attendance === "sa").length;
  const pct = students.length ? Math.round(((present + justified) / students.length) * 100) : 0;

  const thead = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const rows = students.length
    ? students
        .map(
          (s) => `
            <tr>
              ${columns.map((c) => `<td>${fieldValueForReport(s, c.key, staff)}</td>`).join("")}
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="${columns.length}" style="text-align:center;color:#666">Sem alunos cadastrados.</td></tr>`;

  return `
    <section class="sheet-block">
      <div class="sheet-head">
        <div>
          <h3>${escapeHtml(nucleus)}</h3>
          <div class="sheet-meta">
            <span><strong>Data:</strong> ${staff.classDate ? formatDateLabel(staff.classDate) : "-"}</span>
            <span><strong>Turma:</strong> ${escapeHtml(staff.classSchedule || "-")}</span>
            <span><strong>Professor:</strong> ${escapeHtml(staff.professorName || "-")}</span>
            <span><strong>Monitor:</strong> ${escapeHtml(staff.monitorName || "-")}</span>
          </div>
        </div>
        <div class="sheet-resume">
          <span><b>${students.length}</b> alunos</span>
          <span><b>${present}</b> P</span>
          <span><b>${absent}</b> F</span>
          <span><b>${justified}</b> J</span>
          <span><b>${sa}</b> S/A</span>
          <span><b>${totalEncontros}</b> T</span>
          <span><b>${pct}%</b> presença</span>
        </div>
      </div>

      <table class="print-table clean">
        <thead><tr>${thead}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}).join("");

// ✅ Agora o retorno FINAL do relatório (topo + período + seções)
return `
  <div class="print-shell">
    <div class="print-topline">
      <div class="print-brand">
        <img class="print-logo" src="${logoUrl}" alt="Logo IIN" />
        <div>
          <div class="print-title-main">Instituto Irmãos Nogueira • ${escapeHtml(project.label)}</div>
          <div class="print-subline">${escapeHtml(project.subtitle || "")}</div>
          <div class="print-subline">Processo: ${escapeHtml(project.processNumber || "-")}</div>
          <div class="print-subline">E-mail: ${escapeHtml(INSTITUTIONAL_EMAIL)}</div>
        </div>
      </div>

      <div class="print-docbox">
        <div class="print-docid">Documento: <b>${escapeHtml(docId)}</b></div>
        <div class="print-docmeta">Emitido em: ${escapeHtml(issuedAtLabel)}</div>
      </div>
    </div>

    <div class="print-period-line">
      <span><strong>Relatório:</strong> ${escapeHtml(label)}</span>
      <span><strong>Período:</strong> ${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}</span>
      <span><strong>Gerado em:</strong> ${escapeHtml(generatedAt)}</span>
      <span><strong>Núcleo:</strong> ${escapeHtml(nucleusFilter === "todos" ? "Todos" : nucleusFilter)}</span>
    </div>

    ${sections}
  </div>
`;
}

function ensurePrintRoot() {
  let root = el("__printRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "__printRoot";
    document.body.appendChild(root);
  }
  return root;
}

function printReport(period, nucleusFilter = "todos") {
  // 1) GERA primeiro
  const docId = makeReportDocId(state.currentProjectKey);
  const issuedAtLabel = formatIssuedAt(new Date());

  // 2) MONTA o HTML do relatório
  const inner = buildPrintableInnerHTML(period, nucleusFilter, { docId, issuedAtLabel });

  // 3) ABRE a nova aba
  const w = window.open("", "_blank");
  if (!w) {
    alert("O navegador bloqueou a nova aba. Permita pop-up para imprimir o relatório.");
    return;
  }

  const baseHref = new URL("./", window.location.href).href;

  // ✅ CSS COMPLETO DA IMPRESSÃO (é isso que estava faltando)
  const css = `
    *{ box-sizing:border-box; }
    body{ margin:0; font-family: Arial, sans-serif; background:#f2f3f6; color:#111; }

    .top-actions{
      position:sticky; top:0; z-index:10;
      display:flex; justify-content:space-between; align-items:center; gap:10px;
      padding:10px 14px;
      background:linear-gradient(135deg,#0f0f12,#4b0f16,#8b1421);
      color:#fff; border-bottom:3px solid #2a2a2a;
    }
    .top-actions .left{ font-weight:800; font-size:14px; }
    .top-actions .right{ display:flex; gap:8px; }
    .top-actions button{
      border:none; border-radius:10px; padding:8px 12px;
      cursor:pointer; font-weight:800;
    }
    .btn-print{ background:#fff; color:#111; }
    .btn-close{ background:#1f1f24; color:#fff; border:1px solid #444; }

    .page-wrap{ padding:16px; max-width:1700px; margin:0 auto; }

    .legend-box{
      margin:8px 0 12px; border:1px solid #ddd; border-radius:10px;
      padding:8px 10px; background:#fafafa; font-size:12px;
      display:flex; flex-wrap:wrap; gap:10px 14px;
    }

    .print-shell{
      background:#fff; color:#111; padding:16px;
      border-radius:14px; border:1px solid #ddd;
      box-shadow:0 10px 25px rgba(0,0,0,.08);
    }

    .print-topline{
      display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
      margin-bottom:10px; border-bottom:2px solid #111; padding-bottom:8px;
    }

    .print-brand{ display:flex; align-items:center; gap:12px; min-width:0; }
    .print-logo{
      width:52px; height:52px; object-fit:contain;
      border-radius:10px; border:1px solid #ddd; background:#fff;
      flex:0 0 auto;
    }

    .print-title-main{ font-size:20px; font-weight:900; margin-bottom:3px; }
    .print-subline{ font-size:12px; color:#333; margin:1px 0; }

    .print-docbox{
      text-align:right;
      border:1px solid #111; border-radius:12px;
      padding:8px 10px; background:#fff;
      min-width:260px;
    }
    .print-docid{ font-size:12px; }
    .print-docmeta{ font-size:12px; color:#333; margin-top:4px; }

    .print-period-line{
      display:flex; flex-wrap:wrap;
      gap:10px 16px; font-size:12px;
      margin:10px 0 12px;
    }

    .sheet-block{ margin-top:12px; page-break-inside:avoid; }
    .sheet-head{ display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:6px; }
    .sheet-head h3{ margin:0 0 4px; font-size:15px; }
    .sheet-meta{ display:flex; flex-wrap:wrap; gap:8px 12px; font-size:11px; color:#222; }
    .sheet-resume{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:flex-end; font-size:11px; max-width:50%; }
    .sheet-resume span{ border:1px solid #bbb; border-radius:999px; padding:2px 6px; background:#fff; white-space:nowrap; }

    .print-table.clean{ width:100%; border-collapse:collapse; font-size:11px; }
    .print-table.clean th{
      text-align:left; border:1px solid #111;
      background:#f0f0f0; padding:5px; font-weight:800;
    }
    .print-table.clean td{
      border:1px solid #d5d5d5; padding:4px 5px; vertical-align:top;
      word-break:break-word;
    }
    .print-table.clean tbody tr:nth-child(even){ background:#f8f8f8; }

    @media print{
      body{ background:#fff; }
      .top-actions{ display:none !important; }
      .page-wrap{ padding:0; max-width:none; margin:0; }
      .print-shell{ border:none; box-shadow:none; border-radius:0; padding:6mm; }
      @page{ size:auto; margin:8mm; }
    }
  `;

  w.document.open();
  w.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <base href="${baseHref}">
        <title>Relatório IIN</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="top-actions">
          <div class="left">Relatório IIN • Visualização para impressão</div>
          <div class="right">
            <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
            <button class="btn-close" onclick="window.close()">Fechar</button>
          </div>
        </div>

        <div class="page-wrap">
          <div class="legend-box">
            <span><b>P</b> = Presente</span>
            <span><b>F</b> = Falta</span>
            <span><b>J</b> = Justificado</span>
            <span><b>S/A</b> = Sem Aula</span>
            <span><b>T</b> = Total de encontros</span>
          </div>

          ${inner}
        </div>
      </body>
    </html>
  `);
  w.document.close();
}

/* ========= ADMIN CONFIG (grupo) ========= */
function onAdminSaveGroupLink() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const input = el("adminWhatsGroupLink");
  const status = el("adminWhatsGroupStatus");
  const link = (input?.value || "").trim();

  const settings = ensureProjectSettings();
  settings.whatsappGroupLink = link;

  persist();
  if (status) status.textContent = link ? "Link do grupo salvo com sucesso." : "Link removido.";
}

/* ========= RENDER ========= */
function render() {
  const user = currentUser();

  // controla telas login/app
  ui.loginScreen?.classList.toggle("hidden", !!user);
  ui.appShell?.classList.toggle("hidden", !user);

  // controla botão sair no cabeçalho
  if (ui.logoutBtn) {
    ui.logoutBtn.classList.toggle("hidden", !user);
  }

  if (!user) return;

  if (ui.welcomeTitle) ui.welcomeTitle.textContent = `Painel • ${labelRole(user.role)} • ${currentProject().label}`;
  if (ui.projectSubtitle) ui.projectSubtitle.textContent = currentProject().subtitle || "";

  // mostrar/ocultar tabs por perfil
  ui.tabsBar?.querySelectorAll(".tab-btn").forEach((btn) => {
  const tab = btn.dataset.tab;

  if (tab === "tab-estoque") {
    const allowedProject = state.currentProjectKey === SNACK_PROJECT_KEY;
    btn.classList.toggle("hidden", !allowedProject);
  }

  // Admin só admin
  if (tab === "tab-admin") {
    btn.classList.toggle("hidden", user.role !== "admin");
  }

  // Gestão só gestão/admin
  if (tab === "tab-gestao") {
    btn.classList.toggle("hidden", !(user.role === "gestao" || user.role === "admin"));
  }

  // Colaborador e chamada só professor
  if (tab === "tab-professor") {
    btn.classList.toggle("hidden", user.role !== "professor");
  }

  if (tab === "tab-chamada") {
    btn.classList.toggle("hidden", user.role !== "professor");
  }

  // Relatórios: esconder do colaborador
  if (tab === "tab-relatorios") {
    btn.classList.toggle("hidden", user.role === "professor" || user.role === "supervisao");
  }

  // Fila de espera: só admin e gestão
  if (tab === "tab-fila") {
    btn.classList.toggle("hidden", !(user.role === "gestao" || user.role === "admin"));
  }

  // Supervisão: só supervisão
  if (tab === "tab-supervisao") {
    btn.classList.toggle("hidden", user.role !== "supervisao");
  }
});

  if (user.role === "professor" && !["tab-dashboard", "tab-chamada", "tab-professor", "tab-aulas", "tab-estoque"].includes(state.activeTab)) {
  state.activeTab = "tab-chamada";
}

if (user.role === "gestao" && state.activeTab === "tab-admin") {
  state.activeTab = "tab-dashboard";
}

if (user.role === "supervisao" && !["tab-dashboard", "tab-supervisao"].includes(state.activeTab)) {
  state.activeTab = "tab-supervisao";
}

  ui.tabPages.forEach((p) => p && p.classList.toggle("hidden", p.id !== state.activeTab));
  ui.tabsBar?.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === state.activeTab));

  if (ui.dashBadge) ui.dashBadge.textContent = `${getProjectStudents().length} alunos`;

  // admin config sync
  const adminGroupInput = el("adminWhatsGroupLink");
  if (adminGroupInput) adminGroupInput.value = ensureProjectSettings().whatsappGroupLink || "";

  ensureDashNucleusOptions();
  renderMetrics();
  renderNucleusCounts();
  renderVisitors();
  renderClassDays();
  renderAttendanceReport();
  hydrateGestaoAlunoFiltroNucleo();
  renderListaAlunosGestao();
  renderUniformTable();
  renderStock();
  renderAlerts();
  renderSnackStockTab();
  hydrateWhatsStudents();
  renderDashboardChart();
  renderDashboardMiniChart();
  renderAdminMestreTable();
  hydrateSupervisaoNucleo();

if (user.role === "professor") renderProfessorArea(user);
if (user.role === "admin") renderUsersTable();

updateReportRangeInfo();
}

function renderProfessorArea(user) {
  if (ui.professorNucleusBadge) ui.professorNucleusBadge.textContent = `Turma: ${user.nucleus}`;

  const staff = getAttendanceStaffByNucleus(user.nucleus);
  if (ui.professorClassDate) ui.professorClassDate.value = staff.classDate || "";
  if (ui.professorClassSchedule) ui.professorClassSchedule.value = staff.classSchedule || "";
  if (ui.professorClassProfessorName) ui.professorClassProfessorName.value = staff.professorName || "";
  if (ui.professorClassMonitorName) ui.professorClassMonitorName.value = staff.monitorName || "";

  const lock = getLock(user.nucleus);
  ui.classLockBadge?.classList.toggle("hidden", !(lock.locked && lock.lockedDate === staff.classDate));

  const students = getProjectStudents().filter((s) => s.nucleus === user.nucleus);
  renderBoard(ui.professorBoard, students, user);

  renderPlanningList(user.nucleus);
  renderProfessorHistory(user.nucleus);

  // combo do atestado
  if (ui.teacherAbsStudent) {
    ui.teacherAbsStudent.innerHTML = "";
    students
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        ui.teacherAbsStudent.appendChild(opt);
      });
  }

  // exibir/ocultar seletor aluno no atestado
  const isAluno = (ui.teacherAbsType?.value || "aluno") === "aluno";
  ui.teacherAbsStudentWrap?.classList.toggle("hidden", !isAluno);
}

/* ========= RUNTIME STYLE (IMPRESSÃO + pequenos ajustes) ========= */
function injectRuntimeStyles() {
  if (el("__iinRuntimeStyle")) return;
  const style = document.createElement("style");
  style.id = "__iinRuntimeStyle";
  style.textContent = `
    /* visual geral melhorado */
    body{
      background:
        radial-gradient(circle at 15% 10%, rgba(139,20,33,.18), transparent 35%),
        radial-gradient(circle at 85% 15%, rgba(255,255,255,.05), transparent 30%),
        linear-gradient(180deg,#0f1013 0%, #17191e 18%, #1b1d22 100%);
      min-height:100vh;
    }

    .app-shell{
      max-width:none !important;
      width:100%;
      margin:0 !important;
      padding:0 10px 32px !important;
    }

    .login-screen{
      background:
        radial-gradient(circle at 20% 10%, rgba(139,20,33,.22), transparent 38%),
        linear-gradient(180deg,#0f1013,#17191f);
    }

    .login-card{
      background:rgba(255,255,255,.98);
      border:1px solid rgba(255,255,255,.18);
      box-shadow:0 18px 40px rgba(0,0,0,.28);
    }

    .hero{
      background: linear-gradient(135deg,#090a0c 0%, #1a0f12 35%, #5f0d16 70%, #8b1421 100%) !important;
      border-bottom:3px solid rgba(255,255,255,.08) !important;
      border-radius:0 0 14px 14px;
      box-shadow:0 8px 24px rgba(0,0,0,.22);
      margin:0 -10px;
      padding:14px 16px !important;
    }

    .tabs-bar{
      padding:4px 2px 0;
    }

    .tab-btn{
      border:1px solid rgba(255,255,255,.12);
      background:#ffffff;
      box-shadow:0 4px 10px rgba(0,0,0,.06);
    }

    .tab-btn.active{
      background:linear-gradient(135deg,#8b1421,#5f0d16) !important;
      border-color:#8b1421 !important;
      color:#fff !important;
    }

    .panel, .metric-card, .calendar-card, .stock-card, .nucleus-column{
      border:1px solid rgba(255,255,255,.22);
      box-shadow:0 10px 22px rgba(0,0,0,.10);
    }

    .logo{
      background: transparent !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      object-fit: contain;
    }

    /* impressão antiga (fallback) */
    #__printRoot { display:none; }
    .print-shell{
      background:#fff;
      color:#111;
      padding:16px;
      font-family: Arial, sans-serif;
    }
    .print-topline{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:12px;
      margin-bottom:10px;
      border-bottom:2px solid #111;
      padding-bottom:8px;
    }
    .print-title-main{ font-size:20px; font-weight:800; margin-bottom:3px; }
    .print-subline{ font-size:12px; color:#333; margin:1px 0; }
    .print-badge-mode{
      border:1px solid #111;
      border-radius:999px;
      padding:4px 10px;
      font-weight:700;
      font-size:12px;
      white-space:nowrap;
    }
    .print-period-line{
      display:flex;
      flex-wrap:wrap;
      gap:10px 16px;
      font-size:12px;
      margin:10px 0 12px;
    }
    .sheet-block{
      margin-top:12px;
      page-break-inside:avoid;
    }
    .sheet-head{
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:flex-start;
      margin-bottom:6px;
    }
    .sheet-head h3{ margin:0 0 4px; font-size:15px; }
    .sheet-meta{
      display:flex;
      flex-wrap:wrap;
      gap:8px 12px;
      font-size:11px;
      color:#222;
    }
    .sheet-resume{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      align-items:center;
      justify-content:flex-end;
      font-size:11px;
      max-width:45%;
    }
    .sheet-resume span{
      border:1px solid #bbb;
      border-radius:999px;
      padding:2px 6px;
      background:#fff;
      white-space:nowrap;
    }
    .print-table.clean{
      width:100%;
      border-collapse:collapse;
      font-size:11px;
    }
    .print-table.clean th{
      text-align:left;
      border:1px solid #111;
      background:#f0f0f0;
      padding:5px;
      font-weight:700;
    }
    .print-table.clean td{
      border:1px solid #d5d5d5;
      padding:4px 5px;
      vertical-align:top;
    }
    .print-table.clean tbody tr:nth-child(even){ background:#f8f8f8; }

    @media (max-width: 680px){
      .hero{ margin:0 -10px; border-radius:0 0 12px 12px; }
    }

    @media print {
      body * { visibility:hidden !important; }
      #__printRoot, #__printRoot * { visibility:visible !important; }
      #__printRoot {
        display:block !important;
        position:absolute;
        inset:0;
        background:#fff;
      }
      .print-shell { padding:8mm; }
      @page { size: auto; margin: 8mm; }
    }
  `;
  document.head.appendChild(style);
}

function fmtDateBR(iso) {
  if (!iso) return "";
  // se vier "2026-03-03T..." pega só a parte da data
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function statusLabel(s) {
  const v = String(s || "novo").toLowerCase();
  if (v === "confirmado") return "🟢 Confirmada";
  if (v === "aguardando") return "🟡 Aguardando";
  if (v === "sem_resposta") return "🔴 Sem resposta";
  return "🟡 Aguardando";
}

function waLink(phone, msg) {
  const p = String(phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(msg || "");
  return `https://wa.me/55${p}?text=${text}`;
}

function abrirWhatsApp(phone, encMsg) {
  const p = String(phone || "").replace(/\D/g, "");
  if (!p) return alert("Sem WhatsApp do responsável.");
  const msg = decodeURIComponent(encMsg || "");
  window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`, "_blank");
}

function calcAgeFromISO(dateStr) {
  if (!dateStr) return "";

  const s = String(dateStr).trim();

  // aceita DD/MM/YYYY
  let d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else {
    // aceita YYYY-MM-DD ou YYYY-MM-DDTHH:mm...
    const iso = s.slice(0, 10);
    const [y, m, day] = iso.split("-");
    if (!y || !m || !day) return "";
    d = new Date(Number(y), Number(m) - 1, Number(day));
  }

  if (Number.isNaN(d.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();

  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;

  return age >= 0 && age <= 120 ? String(age) : "";
}

// ===============================
// TROCA DE ABAS POR data-tab
// ===============================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn[data-tab]");
  if (!btn) return;

  const tabId = btn.getAttribute("data-tab");
  if (!tabId) return;

  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  document.querySelectorAll(".tab-page").forEach((p) => p.classList.add("hidden"));
  const page = document.getElementById(tabId);
  if (page) page.classList.remove("hidden");

  if (tabId === "tab-fila") {
    loadFilaAdmin();
  }
});