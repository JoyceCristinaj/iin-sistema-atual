"use strict";

const cssEscape = (s) =>
  (window.CSS && CSS.escape)
    ? CSS.escape(String(s))
    : String(s).replace(/"/g, '\\"');

function el(id) {
  return document.getElementById(id);
}

window.el = el;

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
  "tab-mestre",
  "tab-aulas",
  "tab-gestao",
  "tab-estoque",
  "tab-relatorios",
  "tab-acompanhamento",
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
  dashFixedValue: el("dashFixedValue"),
  dashVisitorsValue: el("dashVisitorsValue"),
  dashPCDValue: el("dashPCDValue"),

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
  professorScheduleHint: el("professorScheduleHint"),
  professorClassSave: el("professorClassSave"),
  professorClassStatus: el("professorClassStatus"),
  endClassBtn: el("endClassBtn"),
  classLockBadge: el("classLockBadge"),

  teacherAbsHint: el("teacherAbsHint"),
  planningForm: el("planningForm"),
  planningWeek: el("planningWeek"),
  planningTheme: el("planningTheme"),
  planningGoals: el("planningGoals"),
  planningActivities: el("planningActivities"),
  planningList: el("planningList"),

  teacherAbsType: el("teacherAbsType"),
  teacherAbsStudentWrap: el("teacherAbsStudentWrap"),
  teacherAbsStudent: el("teacherAbsStudent"),
  teacherAbsCollaboratorWrap: el("teacherAbsCollaboratorWrap"),
  teacherAbsCollaboratorName: el("teacherAbsCollaboratorName"),
  teacherAbsTextWrap: el("teacherAbsTextWrap"),
  teacherAbsTextLabel: el("teacherAbsTextLabel"),
  teacherAbsFile: el("teacherAbsFile"),
  teacherAbsFileWrap: el("teacherAbsFileWrap"),
  teacherAbsFileLabel: el("teacherAbsFileLabel"),
  teacherAbsText: el("teacherAbsText"),
  teacherAbsSave: el("teacherAbsSave"),
  teacherAbsStatus: el("teacherAbsStatus"),

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

  scheduleConfigPanel: el("scheduleConfigPanel"),
  scheduleConfigToggle: el("scheduleConfigToggle"),
  scheduleConfigNucleus: el("scheduleConfigNucleus"),
  scheduleConfigStatus: el("scheduleConfigStatus"),
  scheduleDayDate: el("scheduleDayDate"),
  scheduleRegisterDayBtn: el("scheduleRegisterDayBtn"),
  scheduleResetDefaultsBtn: el("scheduleResetDefaultsBtn"),
  scheduleSaveStandardBtn: el("scheduleSaveStandardBtn"),
  scheduleExceptionDate: el("scheduleExceptionDate"),
  scheduleSaveExceptionBtn: el("scheduleSaveExceptionBtn"),
  scheduleRemoveExceptionBtn: el("scheduleRemoveExceptionBtn"),
  scheduleDayInputs: Object.fromEntries(
    SCHEDULE_WEEKDAYS.map((day) => [day, el(`scheduleDay${day}`)])
  ),
  scheduleExceptionText: el("scheduleExceptionText"),
  classCalendarBoard: el("classCalendarBoard"),

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
  adminSupportTypeFilter: el("adminSupportTypeFilter"),
  adminSupportRecordsBoard: el("adminSupportRecordsBoard"),

  adminLogNucleusFilter: el("adminLogNucleusFilter"),
  adminOpenLogModal: el("adminOpenLogModal"),

  acompanhamentoTypeFilter: el("acompanhamentoTypeFilter"),
  acompanhamentoNucleusFilter: el("acompanhamentoNucleusFilter"),
  acompanhamentoStudentFilter: el("acompanhamentoStudentFilter"),
  acompanhamentoCollaboratorFilter: el("acompanhamentoCollaboratorFilter"),
  acompanhamentoDateStart: el("acompanhamentoDateStart"),
  acompanhamentoDateEnd: el("acompanhamentoDateEnd"),
  acompanhamentoClearBtn: el("acompanhamentoClearBtn"),
  acompanhamentoPrintBtn: el("acompanhamentoPrintBtn"),
  acompanhamentoCountBadge: el("acompanhamentoCountBadge"),
  acompanhamentoBoard: el("acompanhamentoBoard"),
  eadWatchForm: el("eadWatchForm"),
  eadWatchCollaborator: el("eadWatchCollaborator"),
  eadWatchNucleus: el("eadWatchNucleus"),
  eadWatchDate: el("eadWatchDate"),
  eadWatchMinutes: el("eadWatchMinutes"),
  eadWatchCategory: el("eadWatchCategory"),
  eadWatchNotes: el("eadWatchNotes"),
  eadWatchStatus: el("eadWatchStatus"),

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

function enhanceFormsAndTheme() {
  try { patchSchoolTypeOptions?.(); } catch {}
  try { patchSizeDropdowns?.(); } catch {}
  try { patchVisitorBirthDateField?.(); } catch {}
  try { patchVisitorFormButtons?.(); } catch {}
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
    "scheduleConfigNucleus",
    "acompanhamentoNucleusFilter",
    "eadWatchNucleus",
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


function hydrateStudentScheduleOptions() {
  if (!ui.studentSchedule) return;
  const nucleus = el("studentNucleus")?.value;
  const schedules = getNucleusScheduleOptions(nucleus);

  ui.studentSchedule.innerHTML = `<option value="">Selecione (opcional)</option>`;
  schedules.forEach((slot) => {
    const value = typeof slot === "string" ? slot : `${slot.start} às ${slot.end}`;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    ui.studentSchedule.appendChild(opt);
  });
}

function hydrateProfessorScheduleOptions(nucleus, dateISO = ui.professorClassDate?.value || "", currentValue = "") {
  if (!ui.professorClassSchedule) return;

  const schedules = getNucleusScheduleOptions(nucleus, dateISO);
  const select = ui.professorClassSchedule;
  const selected = String(currentValue || select.value || "").trim();
  const weekday = getWeekdayLabel(dateISO);

  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = schedules.length
    ? "Selecione o horário da aula"
    : "Nenhum horário disponível para este núcleo/data";
  select.appendChild(placeholder);

  schedules.forEach((schedule) => {
    const opt = document.createElement("option");
    opt.value = schedule;
    opt.textContent = schedule;
    select.appendChild(opt);
  });

  if (selected && !schedules.includes(selected)) {
    const legacy = document.createElement("option");
    legacy.value = selected;
    legacy.textContent = `${selected} (salvo)`;
    select.appendChild(legacy);
  }

  select.disabled = schedules.length === 0 && !selected;
  select.value = selected && [...select.options].some((option) => option.value === selected) ? selected : "";

  if (ui.professorScheduleHint) {
    if (!dateISO) {
      ui.professorScheduleHint.textContent = "Defina a data para carregar os horários compatíveis.";
    } else if (!schedules.length) {
      ui.professorScheduleHint.textContent = weekday
        ? `Nenhum horário ativo para ${weekday}. Verifique a grade padrão ou uma exceção por data.`
        : "Nenhum horário compatível com a data informada.";
    } else {
      ui.professorScheduleHint.textContent = weekday
        ? `${schedules.length} horário(s) disponível(is) para ${weekday}.`
        : `${schedules.length} horário(s) disponível(is).`;
    }
  }
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

function bindCollapsiblePanels() {
  const pairs = [
    { toggleId: "adminMestreToggle", panelId: "adminMestrePanel" },
    { toggleId: "usersPanelToggle", panelId: "usersPanel" },
    { toggleId: "scheduleConfigToggle", panelId: "scheduleConfigPanel" }
  ];

  pairs.forEach(({ toggleId, panelId }) => {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);

    if (!toggle || !panel || toggle.dataset.bound === "1") return;

    toggle.dataset.bound = "1";

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });
}
