"use strict";

const state = {
  students: [],
  visitors: [],
  users: [],
  history: [],
  collaboratorRecordsByProject: {},
  eadWatchByProject: {},
  uniformStockByProject: {},
  snackStockByProject: {},
  classDaysByProject: {},
  scheduleConfigsByProject: {},
  attendanceStaffByProject: {},
  planningByProject: {},
  classLocksByProject: {},
  noClassByProject: {},
  nucleusLogsByProject: {},
  mestreDocsByProject: {},
  settingsByProject: {},
  supervisaoByProject: {},
  reportPrefs: { printType: "completo", fields: {} },
  attendanceUI: {
    professorActionMessage: "",
    professorActionTone: "",
    professorFinalMessage: "",
    professorFinalTone: "",
  },

  // Aulas
  lessonsByProject: {},
  weeksByProject: {},
  lessonUI: { selectedId: null, search: "", category: "", level: "" },

  sessionUserId: null,
  currentProjectKey: "light",
  search: "",
  attendanceFilter: "todos",
  uniformFilter: "todos",
  activeTab: "tab-dashboard",
};

function el(id) { return document.getElementById(id); }


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
function createEmptyWeekdayScheduleMap() {
  return Object.fromEntries(SCHEDULE_WEEKDAYS.map((day) => [day, []]));
}
function parseScheduleRangeText(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{2}:\d{2})\s*(?:às|as|a)\s*(\d{2}:\d{2})$/i);
  if (match) {
    return { start: match[1], end: match[2] };
  }

  const single = raw.match(/^(\d{2}:\d{2})$/);
  if (single) {
    return { start: single[1], end: addOneHourToTime(single[1]) || "" };
  }

  return null;
}
function normalizeScheduleStrings(values = []) {
  return uniqueScheduleValues(
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  );
}
function extractScheduleStrings(values = []) {
  if (!Array.isArray(values)) return [];

  return normalizeScheduleStrings(
    values.map((value) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object" && value.start && value.end) {
        return `${value.start} às ${value.end}`;
      }
      return "";
    })
  );
}
function normalizeCalendarEntry(entry = {}) {
  const scheduleStrings = extractScheduleStrings(entry?.schedules || []);
  return {
    days: Array.isArray(entry?.days)
      ? uniqueScheduleValues(entry.days.map((day) => String(day || "").trim()).filter(Boolean))
      : [],
    schedules: scheduleStrings
      .map((schedule) => parseScheduleRangeText(schedule))
      .filter((item) => item?.start && item?.end),
  };
}
function buildRuleScheduleConfig(nucleus, legacySchedules = []) {
  const standardByWeekday = createEmptyWeekdayScheduleMap();
  const rule = NUCLEOS_AULAS[normalizeNucleusName(nucleus)] || null;

  Object.values(rule?.modalidades || {}).forEach((modality) => {
    Object.entries(modality?.horarios || {}).forEach(([weekday, items]) => {
      if (!standardByWeekday[weekday]) standardByWeekday[weekday] = [];
      standardByWeekday[weekday].push(...items);
    });

    if (Array.isArray(modality?.horariosBase)) {
      const targets = Array.isArray(modality?.dias) && modality.dias.length
        ? modality.dias.filter((day) => day in standardByWeekday)
        : [];

      targets.forEach((weekday) => {
        standardByWeekday[weekday].push(...modality.horariosBase.map(toScheduleRange));
      });
    }
  });

  Object.keys(standardByWeekday).forEach((weekday) => {
    standardByWeekday[weekday] = normalizeScheduleStrings(standardByWeekday[weekday]);
  });

  const legacy = extractScheduleStrings(legacySchedules);
  const hasConfiguredRule = Object.values(standardByWeekday).some((items) => items.length);

  if (legacy.length) {
    if (!hasConfiguredRule) {
      SCHEDULE_WEEKDAYS.forEach((weekday) => {
        standardByWeekday[weekday] = legacy.slice();
      });
    } else {
      SCHEDULE_WEEKDAYS.forEach((weekday) => {
        if (!standardByWeekday[weekday].length) {
          standardByWeekday[weekday] = legacy.slice();
        }
      });
    }
  }

  return {
    standardByWeekday,
    exceptionsByDate: {},
    updatedAt: "",
    updatedBy: "",
  };
}
function normalizeScheduleConfig(config, nucleus, legacySchedules = []) {
  const base = buildRuleScheduleConfig(nucleus, legacySchedules);
  const rawStandard = config?.standardByWeekday || {};
  const rawExceptions = config?.exceptionsByDate || {};

  SCHEDULE_WEEKDAYS.forEach((weekday) => {
    if (Array.isArray(rawStandard[weekday])) {
      base.standardByWeekday[weekday] = normalizeScheduleStrings(rawStandard[weekday]);
    }
  });

  Object.entries(rawExceptions).forEach(([dateISO, items]) => {
    if (!Array.isArray(items)) return;
    base.exceptionsByDate[dateISO] = normalizeScheduleStrings(items);
  });

  base.updatedAt = config?.updatedAt || "";
  base.updatedBy = config?.updatedBy || "";
  return base;
}
function createScheduleConfigByNucleus(projectKey, calendarMap = {}) {
  return Object.fromEntries(
    getVisibleNuclei(projectKey).map((nucleus) => {
      const legacyEntry = normalizeCalendarEntry(calendarMap?.[nucleus] || {});
      return [nucleus, normalizeScheduleConfig(null, nucleus, legacyEntry.schedules)];
    })
  );
}
function createScheduleConfigsByProject(calendarMap = {}) {
  return Object.fromEntries(
    PROJECTS.map((project) => [project.key, createScheduleConfigByNucleus(project.key, calendarMap?.[project.key] || {})])
  );
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
function createNoClassByProject() {
  return Object.fromEntries(PROJECTS.map((p) => [p.key, []]));
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

function normalizeProjectKey(projectKey) {
  const key = String(projectKey || "").trim();
  return PROJECTS.some((project) => project.key === key) ? key : "";
}

function normalizeNucleusName(nucleus) {
  const raw = String(nucleus || "").trim();
  if (!raw) return "";

  const compact = normText(raw).replace(/^nucleo\s*\d+\s*-\s*/, "").trim();

  for (const nuclei of Object.values(PROJECT_NUCLEI)) {
    const match = nuclei.find((item) => normText(item) === compact || normText(item) === normText(raw));
    if (match) return match;
  }

  return raw;
}

function inferProjectKeyFromNucleus(nucleus) {
  const normalizedNucleus = normalizeNucleusName(nucleus);
  if (!normalizedNucleus) return "";

  for (const [projectKey, nuclei] of Object.entries(PROJECT_NUCLEI)) {
    if (nuclei.some((item) => normText(item) === normText(normalizedNucleus))) {
      return projectKey;
    }
  }

  return "";
}

function normalizeStudentData(s) {
  const nucleus = normalizeNucleusName(s.nucleus);
  const project = normalizeProjectKey(s.project) || inferProjectKeyFromNucleus(nucleus);

  return {
    ...s,
    project,
    nucleus,
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

function normalizeCollaboratorRecord(record) {
  return {
    id: record?.id || crypto.randomUUID(),
    studentId: record?.studentId || "",
    studentName: record?.studentName || "",
    targetType: record?.targetType || (record?.type === "atestado_colaborador" ? "collaborator" : "student"),
    targetName: record?.targetName || record?.studentName || record?.collaboratorSubjectName || "",
    nucleus: record?.nucleus || "",
    project: normalizeProjectKey(record?.project) || inferProjectKeyFromNucleus(record?.nucleus),
    type: record?.type || "observacao_interna",
    text: record?.text || "",
    createdAt: record?.createdAt || new Date().toISOString(),
    createdBy: record?.createdBy || "",
    collaboratorName: record?.collaboratorName || "",
    source: record?.source || "painel_colaborador",
    classDate: record?.classDate || "",
    classSchedule: record?.classSchedule || "",
    attachment: record?.attachment
      ? {
          name: record.attachment.name || "",
          type: record.attachment.type || "",
          size: Number(record.attachment.size || 0),
          dataUrl: record.attachment.dataUrl || "",
        }
      : null,
  };
}
function normalizeEadWatchRecord(record) {
  const normalizedCategory = typeof normalizeEadCategory === "function"
    ? normalizeEadCategory(record?.category)
    : "";
  return {
    id: record?.id || crypto.randomUUID(),
    project: normalizeProjectKey(record?.project) || state.currentProjectKey,
    nucleus: normalizeNucleusName(record?.nucleus || ""),
    collaboratorId: record?.collaboratorId || "",
    collaboratorName: record?.collaboratorName || "",
    category: normalizedCategory || String(record?.category || "").trim(),
    watchDate: record?.watchDate || "",
    minutes: Number(record?.minutes || 0),
    notes: record?.notes || "",
    createdAt: record?.createdAt || new Date().toISOString(),
    createdBy: record?.createdBy || "",
    source: record?.source || "ead_manual",
  };
}
function normalizeSupervisaoRecord(record, forcedType = "", fallbackProjectKey = state.currentProjectKey) {
  const type = forcedType || record?.type || "supervisao_diario";
  const normalizedType = type === "supervisao_mensal" ? "supervisao_mensal" : "supervisao_diario";
  const inferredProject =
    normalizeProjectKey(record?.project) ||
    inferProjectKeyFromNucleus(record?.nucleo || record?.nucleus) ||
    fallbackProjectKey ||
    state.currentProjectKey;

  return {
    id: record?.id || crypto.randomUUID(),
    type: normalizedType,
    project: inferredProject,
    createdAt: record?.createdAt || new Date().toISOString(),
    updatedAt: record?.updatedAt || record?.createdAt || "",
    nucleo: normalizeNucleusName(record?.nucleo || record?.nucleus || ""),
    modalidade: String(record?.modalidade || "").trim(),
    instrutor: String(record?.instrutor || "").trim(),

    data: String(record?.data || "").trim(),
    checklistDiario: record?.checklistDiario && typeof record.checklistDiario === "object"
      ? { ...record.checklistDiario }
      : {},
    observacoesGerais: String(record?.observacoesGerais || "").trim(),
    avaliacaoGeral: String(record?.avaliacaoGeral || "").trim(),
    supervisor: String(record?.supervisor || "").trim(),
    supervisorCpf: String(record?.supervisorCpf || "").trim(),
    instrutorCpf: String(record?.instrutorCpf || "").trim(),

    mes: String(record?.mes || "").trim(),
    dia: String(record?.dia || "").trim(),
    metodologiaInstrutores: record?.metodologiaInstrutores && typeof record.metodologiaInstrutores === "object"
      ? { ...record.metodologiaInstrutores }
      : {},
    metodologiaTurmas: record?.metodologiaTurmas && typeof record.metodologiaTurmas === "object"
      ? { ...record.metodologiaTurmas }
      : {},
    supervisorMensal: String(record?.supervisorMensal || "").trim(),
    gerenteGeral: String(record?.gerenteGeral || "").trim(),
    finalizacao: String(record?.finalizacao || "").trim(),
    supervisorMensalCpf: String(record?.supervisorMensalCpf || "").trim(),
    gerenteCpf: String(record?.gerenteCpf || "").trim(),
    status: record?.status === "concluido" ? "concluido" : "rascunho",
    concludedAt: record?.concludedAt || (record?.status === "concluido" ? (record?.updatedAt || record?.createdAt || new Date().toISOString()) : ""),
  };
}
function expandLegacySupervisaoRecord(record, projectKey = state.currentProjectKey) {
  if (!record || typeof record !== "object") return [];

  if (record.type === "supervisao_diario" || record.type === "supervisao_mensal") {
    return [normalizeSupervisaoRecord(record, record.type, projectKey)];
  }

  const baseId = record?.id || crypto.randomUUID();
  const hasDaily =
    !!record?.data ||
    !!record?.observacoesGerais ||
    !!record?.avaliacaoGeral ||
    !!record?.supervisor ||
    !!record?.instrutor ||
    Object.values(record?.checklistDiario || {}).some(Boolean);
  const hasMonthly =
    !!record?.mes ||
    !!record?.dia ||
    !!record?.supervisorMensal ||
    !!record?.gerenteGeral ||
    !!record?.finalizacao ||
    Object.values(record?.metodologiaInstrutores || {}).some(Boolean) ||
    Object.values(record?.metodologiaTurmas || {}).some(Boolean);

  const expanded = [];
  if (hasDaily) {
    expanded.push(
      normalizeSupervisaoRecord(
        { ...record, id: `${baseId}-diario`, type: "supervisao_diario" },
        "supervisao_diario",
        projectKey
      )
    );
  }
  if (hasMonthly) {
    expanded.push(
      normalizeSupervisaoRecord(
        { ...record, id: `${baseId}-mensal`, type: "supervisao_mensal" },
        "supervisao_mensal",
        projectKey
      )
    );
  }

  return expanded.length
    ? expanded
    : [normalizeSupervisaoRecord({ ...record, id: `${baseId}-diario` }, "supervisao_diario", projectKey)];
}
function normalizeSupervisaoBag(items, projectKey = state.currentProjectKey) {
  if (!Array.isArray(items)) return [];

  return items
    .flatMap((record) => expandLegacySupervisaoRecord(record, projectKey))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

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

  return base.map((u) => ({
    id: crypto.randomUUID(),
    project: projectKey,
    ...u,
  }));
}

function ensureRequiredUsers() {
  const allRequired = PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));

  allRequired.forEach((req) => {
    const idx = state.users.findIndex(
      (u) => u.project === req.project && u.username === req.username
    );

    if (idx === -1) {
      state.users.push(req);
    } else {
      state.users[idx] = {
        ...state.users[idx],
        role: req.role,
        nucleus: req.nucleus,
        password: req.password,
      };
    }
  });
}

window.createDefaultUsersForProject = createDefaultUsersForProject;
window.ensureRequiredUsers = ensureRequiredUsers;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.users = PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));
    state.students = [];
    state.visitors = [];
    state.history = [];
    state.collaboratorRecordsByProject = {};
    state.eadWatchByProject = {};
    state.uniformStockByProject = createUniformStockByProject();
    state.classDaysByProject = createProjectCalendars();
    state.scheduleConfigsByProject = createScheduleConfigsByProject(state.classDaysByProject);
    state.attendanceStaffByProject = createAttendanceStaffByProject();
    state.planningByProject = {};
    state.classLocksByProject = createClassLocksByProject();
    state.noClassByProject = createNoClassByProject();
    state.nucleusLogsByProject = {};
    state.mestreDocsByProject = createMestreDocsByProject();
    state.settingsByProject = createSettingsByProject();
    state.snackStockByProject = createSnackStockByProject();
    state.weeksByProject = {};
    persist();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.lessonsByProject = parsed.lessonsByProject || {};
    state.weeksByProject = parsed.weeksByProject || {};
    state.students = Array.isArray(parsed.students) ? parsed.students.map(normalizeStudentData) : [];
    state.visitors = Array.isArray(parsed.visitors) ? parsed.visitors : [];
    state.users = Array.isArray(parsed.users) ? parsed.users : PROJECTS.flatMap((p) => createDefaultUsersForProject(p.key));
    state.history = Array.isArray(parsed.history) ? parsed.history : [];
    state.collaboratorRecordsByProject = Object.fromEntries(
      Object.entries(parsed.collaboratorRecordsByProject || {}).map(([projectKey, items]) => [
        projectKey,
        Array.isArray(items) ? items.map(normalizeCollaboratorRecord) : [],
      ])
    );
    state.eadWatchByProject = Object.fromEntries(
      Object.entries(parsed.eadWatchByProject || {}).map(([projectKey, items]) => [
        projectKey,
        Array.isArray(items) ? items.map(normalizeEadWatchRecord) : [],
      ])
    );
    state.uniformStockByProject = parsed.uniformStockByProject || createUniformStockByProject();
    state.classDaysByProject = Object.fromEntries(
      Object.entries(parsed.classDaysByProject || createProjectCalendars()).map(([projectKey, bag]) => [
        projectKey,
        Object.fromEntries(
          Object.entries(bag || {}).map(([nucleus, entry]) => [nucleus, normalizeCalendarEntry(entry)])
        ),
      ])
    );
    state.scheduleConfigsByProject = Object.fromEntries(
      PROJECTS.map((project) => {
        const rawConfig = parsed.scheduleConfigsByProject?.[project.key] || {};
        const calendarBag = state.classDaysByProject[project.key] || {};
        const nuclei = getVisibleNuclei(project.key);
        return [project.key, Object.fromEntries(
          nuclei.map((nucleus) => {
            const legacyEntry = normalizeCalendarEntry(calendarBag[nucleus] || {});
            return [nucleus, normalizeScheduleConfig(rawConfig[nucleus], nucleus, legacyEntry.schedules)];
          })
        )];
      })
    );
    state.attendanceStaffByProject = parsed.attendanceStaffByProject || createAttendanceStaffByProject();
    state.planningByProject = parsed.planningByProject || {};
    state.classLocksByProject = parsed.classLocksByProject || createClassLocksByProject();
    state.noClassByProject = parsed.noClassByProject || createNoClassByProject();
    state.nucleusLogsByProject = parsed.nucleusLogsByProject || {};
    state.mestreDocsByProject = parsed.mestreDocsByProject || createMestreDocsByProject();
    state.settingsByProject = parsed.settingsByProject || createSettingsByProject();
    state.supervisaoByProject = Object.fromEntries(
      Object.entries(parsed.supervisaoByProject || {}).map(([projectKey, items]) => [
        projectKey,
        normalizeSupervisaoBag(items, projectKey),
      ])
    );
    state.snackStockByProject = parsed.snackStockByProject || createSnackStockByProject();

    PROJECTS.forEach((project) => {
      if (!state.classDaysByProject[project.key]) {
        state.classDaysByProject[project.key] = createEmptyCalendarByNucleus(project.key);
      }

      if (!state.scheduleConfigsByProject[project.key]) {
        state.scheduleConfigsByProject[project.key] = createScheduleConfigByNucleus(
          project.key,
          state.classDaysByProject[project.key]
        );
      }

      if (!state.eadWatchByProject[project.key]) {
        state.eadWatchByProject[project.key] = [];
      }
      if (!state.supervisaoByProject[project.key]) {
        state.supervisaoByProject[project.key] = [];
      }
      if (!state.noClassByProject[project.key]) {
        state.noClassByProject[project.key] = [];
      }

      getVisibleNuclei(project.key).forEach((nucleus) => {
        state.classDaysByProject[project.key][nucleus] = normalizeCalendarEntry(
          state.classDaysByProject[project.key][nucleus] || {}
        );

        const legacyEntry = state.classDaysByProject[project.key][nucleus];
        state.scheduleConfigsByProject[project.key][nucleus] = normalizeScheduleConfig(
          state.scheduleConfigsByProject[project.key][nucleus],
          nucleus,
          legacyEntry.schedules
        );
      });
    });
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
  PROJECTS.forEach((project) => normalizeEadData(project.key));
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
      collaboratorRecordsByProject: state.collaboratorRecordsByProject,
      eadWatchByProject: state.eadWatchByProject,
      uniformStockByProject: state.uniformStockByProject,
      snackStockByProject: state.snackStockByProject,
      classDaysByProject: state.classDaysByProject,
      scheduleConfigsByProject: state.scheduleConfigsByProject,
      attendanceStaffByProject: state.attendanceStaffByProject,
      planningByProject: state.planningByProject,
      classLocksByProject: state.classLocksByProject,
      noClassByProject: state.noClassByProject,
      nucleusLogsByProject: state.nucleusLogsByProject,
      mestreDocsByProject: state.mestreDocsByProject,
      settingsByProject: state.settingsByProject,
      supervisaoByProject: state.supervisaoByProject,

      // ✅ NOVO
      lessonsByProject: state.lessonsByProject,
      weeksByProject: state.weeksByProject,
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
function getProjectCollaboratorRecords(projectKey = state.currentProjectKey) {
  if (!state.collaboratorRecordsByProject[projectKey]) {
    state.collaboratorRecordsByProject[projectKey] = [];
  }
  return state.collaboratorRecordsByProject[projectKey];
}
function getProjectEadWatchRecords(projectKey = state.currentProjectKey) {
  if (!state.eadWatchByProject[projectKey]) {
    state.eadWatchByProject[projectKey] = [];
  }
  return state.eadWatchByProject[projectKey];
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
function getProjectScheduleConfigs(projectKey = state.currentProjectKey) {
  if (!state.scheduleConfigsByProject[projectKey]) {
    state.scheduleConfigsByProject[projectKey] = createScheduleConfigByNucleus(
      projectKey,
      getProjectCalendar(projectKey)
    );
  }
  return state.scheduleConfigsByProject[projectKey];
}
function getNucleusScheduleConfig(nucleus, projectKey = state.currentProjectKey) {
  const bag = getProjectScheduleConfigs(projectKey);
  if (!bag[nucleus]) {
    const legacyEntry = normalizeCalendarEntry(getProjectCalendar(projectKey)?.[nucleus] || {});
    bag[nucleus] = normalizeScheduleConfig(null, nucleus, legacyEntry.schedules);
  }
  return bag[nucleus];
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
function getProjectNoClassRecords(projectKey = state.currentProjectKey) {
  if (!state.noClassByProject[projectKey]) state.noClassByProject[projectKey] = [];
  return state.noClassByProject[projectKey];
}
function getNoClassRecord(nucleus, dateISO, schedule, projectKey = state.currentProjectKey) {
  const targetNucleus = String(nucleus || "").trim();
  const targetDate = String(dateISO || "").trim();
  const targetSchedule = String(schedule || "").trim();
  if (!targetNucleus || !targetDate || !targetSchedule) return null;
  return getProjectNoClassRecords(projectKey).find((record) =>
    String(record?.nucleus || "").trim() === targetNucleus &&
    String(record?.date || "").trim() === targetDate &&
    String(record?.schedule || "").trim() === targetSchedule
  ) || null;
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
  state.supervisaoByProject[projectKey] = normalizeSupervisaoBag(state.supervisaoByProject[projectKey], projectKey);
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

