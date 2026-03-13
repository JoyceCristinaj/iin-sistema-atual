"use strict";

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
function getAttendanceStatusForDate(student, dateISO) {
  const targetDate = String(dateISO || "").trim();
  if (!targetDate) return "";
  const key = `${state.currentProjectKey}|${targetDate}`;
  const row = ensureAttendanceLog(student).find((item) => item.key === key);
  return row?.status || "";
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

/* ========= PROFESSOR AULA ========= */
function setProfessorAttendanceFeedback(kind, message = "", tone = "") {
  const normalizedTone = tone || "";
  if (kind === "action") {
    state.attendanceUI.professorActionMessage = message;
    state.attendanceUI.professorActionTone = normalizedTone;
    return;
  }
  state.attendanceUI.professorFinalMessage = message;
  state.attendanceUI.professorFinalTone = normalizedTone;
}

function syncAttendanceStaffDraft(nucleus, { persistDraft = true } = {}) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  staff.classDate = ui.professorClassDate?.value || "";
  staff.classSchedule = ui.professorClassSchedule?.value?.trim() || "";
  staff.professorName = ui.professorClassProfessorName?.value?.trim() || "";
  staff.monitorName = ui.professorClassMonitorName?.value?.trim() || "";
  if (persistDraft) persist();
  return staff;
}

function getProfessorAttendanceContext(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  const missing = [];

  if (!staff.classDate) missing.push("data");
  if (!staff.classSchedule) missing.push("turma");
  if (!staff.monitorName) missing.push("monitor");
  if (!staff.professorName) missing.push("instrutor");

  const students = getProjectStudents().filter((student) => student.nucleus === nucleus);
  const filled = staff.classDate
    ? students.filter((student) => Boolean(getAttendanceStatusForDate(student, staff.classDate))).length
    : 0;
  const noClassRecord = getNoClassRecord(nucleus, staff.classDate, staff.classSchedule);

  return {
    staff,
    missing,
    students,
    total: students.length,
    filled,
    isUnlocked: missing.length === 0 && !noClassRecord,
    isComplete: students.length > 0 && filled === students.length,
    noClassRecord,
  };
}

function professorAttendanceUnlockMessage(context) {
  if (context.noClassRecord) {
    const reason = context.noClassRecord.reason ? ` Motivo: ${context.noClassRecord.reason}.` : "";
    return `Sem aula registrada para ${formatDateLabel(context.noClassRecord.date)} • ${context.noClassRecord.schedule}.${reason}`;
  }

  if (!context.missing.length) {
    return "Lista liberada. Marque a presenca de todos os alunos e finalize o registro.";
  }

  return "Preencha data, turma, monitor e instrutor para liberar a chamada.";
}
function saveAttendanceStaff(nucleus) {
  const staff = syncAttendanceStaffDraft(nucleus);

  if (!staff.classDate) {
    ui.professorClassStatus.textContent = "Defina a data da aula.";
  } else if (!staff.classSchedule) {
    ui.professorClassStatus.textContent = "Selecione o horario da aula.";
  } else if (!staff.professorName) {
    ui.professorClassStatus.textContent = "Informe o instrutor responsavel pela aula.";
  } else if (!staff.monitorName) {
    ui.professorClassStatus.textContent = "Informe o monitor da aula.";
  } else {
    ui.professorClassStatus.textContent = "Dados da chamada salvos. Agora voce pode preencher a lista.";
  }

  render();
}

function confirmAttendanceList(nucleus) {
  const context = getProfessorAttendanceContext(nucleus);
  if (context.noClassRecord) {
    setProfessorAttendanceFeedback("final", "Essa turma esta marcada como sem aula para a data e horario selecionados.", "error");
    render();
    return;
  }

  if (!context.isUnlocked) {
    setProfessorAttendanceFeedback("final", professorAttendanceUnlockMessage(context), "error");
    render();
    return;
  }

  if (!context.isComplete) {
    setProfessorAttendanceFeedback("final", `Faltam ${context.total - context.filled} aluno(s) para concluir a lista.`, "error");
    render();
    return;
  }

  const user = currentUser();
  const summary = `${formatDateLabel(context.staff.classDate)} • ${context.staff.classSchedule}`;
  pushNucleusLog(nucleus, "Lista de presenca registrada", summary, user);
  persist();

  setProfessorAttendanceFeedback(
    "final",
    `Lista de presenca registrada com sucesso - Data: ${formatDateLabel(context.staff.classDate)} • Turma: ${context.staff.classSchedule}`,
    "success"
  );
  setProfessorAttendanceFeedback("action", "", "");
  render();
}

function lockClass(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  if (!staff.classDate) {
    ui.professorClassStatus.textContent = "Defina e salve a data da aula antes de encerrar.";
    return;
  }

  const lock = getLock(nucleus);
  lock.locked = true;
  lock.lockedDate = staff.classDate;
  lock.lockedAt = new Date().toISOString();

  const user = currentUser();
  pushNucleusLog(nucleus, "Aula encerrada", `Data ${formatDateLabel(staff.classDate)}`, user);

  persist();
  ui.professorClassStatus.textContent = "Aula encerrada. Presencas congeladas para esta data.";
  render();
}

function setNoClassStatus(message = "", isError = false) {
  if (!ui.noClassStatus) return;
  ui.noClassStatus.textContent = message;
  ui.noClassStatus.classList.remove("report-status-success", "report-status-error");
  if (message) ui.noClassStatus.classList.add(isError ? "report-status-error" : "report-status-success");
}

function hydrateNoClassNucleusOptions() {
  if (!ui.noClassNucleus) return;
  const current = ui.noClassNucleus.value || "";
  ui.noClassNucleus.innerHTML = `<option value="">Selecione o nucleo</option>`;
  getVisibleNuclei().forEach((nucleus) => {
    const option = document.createElement("option");
    option.value = nucleus;
    option.textContent = nucleus;
    ui.noClassNucleus.appendChild(option);
  });
  ui.noClassNucleus.value = [...ui.noClassNucleus.options].some((option) => option.value === current) ? current : "";
}

function renderNoClassAdminPanel() {
  if (!ui.noClassList || !ui.noClassCountBadge) return;
  const records = getProjectNoClassRecords()
    .slice()
    .sort((a, b) => `${b.date || ""}${b.schedule || ""}`.localeCompare(`${a.date || ""}${a.schedule || ""}`));

  ui.noClassCountBadge.textContent = `${records.length} registro${records.length === 1 ? "" : "s"}`;
  ui.noClassList.innerHTML = "";

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "panel-lite no-class-empty";
    empty.textContent = "Nenhum registro de sem aula salvo neste projeto.";
    ui.noClassList.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("article");
    item.className = "panel-lite no-class-item";
    item.innerHTML = `
      <div class="no-class-item-head">
        <strong>${escapeHtml(record.nucleus)}</strong>
        <span class="badge">${formatDateLabel(record.date)}</span>
      </div>
      <p class="no-class-item-meta">Turma / Horario: ${escapeHtml(record.schedule)}</p>
      <p class="no-class-item-reason">${escapeHtml(record.reason || "Sem justificativa informada")}</p>
      <div class="toolbar compact">
        <button type="button" class="ghost small-btn" data-no-class-remove="${record.id}">Remover</button>
      </div>
    `;
    item.querySelector("[data-no-class-remove]")?.addEventListener("click", () => removeNoClassRecord(record.id));
    ui.noClassList.appendChild(item);
  });
}

function saveNoClassRecord() {
  const user = currentUser();
  if (!user || !["admin", "gestao"].includes(user.role)) return;

  const date = ui.noClassDate?.value || "";
  const nucleus = ui.noClassNucleus?.value || "";
  const schedule = ui.noClassSchedule?.value || "";
  const reason = ui.noClassReason?.value?.trim() || "";

  if (!date || !nucleus || !schedule || !reason) {
    setNoClassStatus("Preencha data, nucleo, turma/horario e justificativa para salvar.", true);
    return;
  }

  const records = getProjectNoClassRecords();
  const existing = getNoClassRecord(nucleus, date, schedule);
  if (existing) {
    existing.reason = reason;
    existing.updatedAt = new Date().toISOString();
    existing.updatedBy = user.username;
  } else {
    records.unshift({
      id: crypto.randomUUID(),
      date,
      nucleus,
      schedule,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: user.username,
    });
  }

  pushNucleusLog(nucleus, "Sem aula", `${formatDateLabel(date)} • ${schedule} • ${reason}`, user);
  persist();
  setNoClassStatus("Registro de sem aula salvo com sucesso.");
  renderNoClassAdminPanel();
}

function removeNoClassRecord(recordId) {
  const user = currentUser();
  if (!user || !["admin", "gestao"].includes(user.role)) return;

  const records = getProjectNoClassRecords();
  const index = records.findIndex((record) => record.id === recordId);
  if (index < 0) return;

  const [removed] = records.splice(index, 1);
  pushNucleusLog(removed.nucleus, "Sem aula removido", `${formatDateLabel(removed.date)} • ${removed.schedule}`, user);
  persist();
  setNoClassStatus("Registro de sem aula removido com sucesso.");
  renderNoClassAdminPanel();
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
function formatSchedules(schedules = []) {
  if (!Array.isArray(schedules) || !schedules.length) return "não definidos";
  return schedules.map((s, i) => typeof s === "string" ? `${i + 1}) ${s}` : `${i + 1}) ${s.start} às ${s.end}`).join(" • ");
}
function setScheduleConfigStatus(message, isError = false) {
  if (!ui.scheduleConfigStatus) return;
  ui.scheduleConfigStatus.textContent = message || "";
  ui.scheduleConfigStatus.style.color = isError ? "#b31d2f" : "";
}
function getSelectedScheduleConfigNucleus() {
  return ui.scheduleConfigNucleus?.value || getVisibleNuclei()[0] || "";
}
function scheduleListToTextarea(items = []) {
  return (items || []).join("\n");
}
function parseScheduleListText(text) {
  const invalid = [];
  const values = normalizeScheduleStrings(
    String(text || "")
      .split(/\r?\n/)
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .map((line) => {
        const parsed = parseScheduleRangeText(line);
        if (!parsed?.start || !parsed?.end) {
          invalid.push(line);
          return "";
        }
        return `${parsed.start} às ${parsed.end}`;
      })
      .filter(Boolean)
  );

  return { values, invalid };
}
function syncCalendarScheduleSummary(nucleus) {
  const calendar = getProjectCalendar();
  const config = getNucleusScheduleConfig(nucleus);
  if (!calendar[nucleus]) calendar[nucleus] = { days: [], schedules: [] };

  const summary = uniqueScheduleValues(
    Object.values(config.standardByWeekday || {}).flatMap((items) => Array.isArray(items) ? items : [])
  );

  calendar[nucleus].schedules = summary
    .map((schedule) => parseScheduleRangeText(schedule))
    .filter((slot) => slot?.start && slot?.end);
}
function renderScheduleConfigEditor(nucleus = getSelectedScheduleConfigNucleus()) {
  if (!nucleus) return;

  const config = getNucleusScheduleConfig(nucleus);
  if (ui.scheduleConfigNucleus) ui.scheduleConfigNucleus.value = nucleus;

  SCHEDULE_WEEKDAYS.forEach((weekday) => {
    const field = ui.scheduleDayInputs?.[weekday];
    if (!field) return;
    field.value = scheduleListToTextarea(config.standardByWeekday?.[weekday] || []);
  });

  syncScheduleExceptionEditor();
}
function syncScheduleExceptionEditor() {
  const nucleus = getSelectedScheduleConfigNucleus();
  if (!nucleus) return;

  const config = getNucleusScheduleConfig(nucleus);
  const pickedDate = ui.scheduleExceptionDate?.value || ui.scheduleDayDate?.value || "";

  if (ui.scheduleExceptionDate && ui.scheduleExceptionDate.value !== pickedDate) {
    ui.scheduleExceptionDate.value = pickedDate;
  }

  if (ui.scheduleExceptionText) {
    ui.scheduleExceptionText.value = scheduleListToTextarea(config.exceptionsByDate?.[pickedDate] || []);
  }
}
function onScheduleConfigNucleusChange() {
  renderScheduleConfigEditor();
  setScheduleConfigStatus("");
}
function onResetScheduleDefaults() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = getSelectedScheduleConfigNucleus();
  if (!nucleus) return;

  const legacySchedules = getProjectCalendar()?.[nucleus]?.schedules || [];
  getProjectScheduleConfigs()[nucleus] = normalizeScheduleConfig(null, nucleus, legacySchedules);
  getProjectScheduleConfigs()[nucleus].updatedAt = new Date().toISOString();
  getProjectScheduleConfigs()[nucleus].updatedBy = user.username;

  syncCalendarScheduleSummary(nucleus);
  persist();
  renderScheduleConfigEditor(nucleus);
  renderClassDays();
  hydrateStudentScheduleOptions();
  setScheduleConfigStatus("Horários padrão recarregados a partir da base do núcleo.");
}
function onSaveStandardScheduleConfig() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = getSelectedScheduleConfigNucleus();
  if (!getVisibleNuclei().includes(nucleus)) return;

  const config = getNucleusScheduleConfig(nucleus);
  const invalidByDay = [];

  SCHEDULE_WEEKDAYS.forEach((weekday) => {
    const field = ui.scheduleDayInputs?.[weekday];
    const parsed = parseScheduleListText(field?.value || "");
    if (parsed.invalid.length) {
      invalidByDay.push(`${weekday}: ${parsed.invalid.join(", ")}`);
      return;
    }
    config.standardByWeekday[weekday] = parsed.values;
  });

  if (invalidByDay.length) {
    setScheduleConfigStatus(`Corrija os horários inválidos antes de salvar. ${invalidByDay.join(" | ")}`, true);
    return;
  }

  config.updatedAt = new Date().toISOString();
  config.updatedBy = user.username;
  syncCalendarScheduleSummary(nucleus);

  pushNucleusLog(nucleus, "Configuração de horários", `Horários padrão atualizados`, user);

  persist();
  renderClassDays();
  renderScheduleConfigEditor(nucleus);
  hydrateStudentScheduleOptions();
  setScheduleConfigStatus("Horários padrão salvos com sucesso.");
}
function onSaveScheduleException() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = getSelectedScheduleConfigNucleus();
  const date = ui.scheduleExceptionDate?.value || ui.scheduleDayDate?.value || "";
  if (!nucleus || !date) {
    setScheduleConfigStatus("Selecione o núcleo e a data da exceção.", true);
    return;
  }

  const parsed = parseScheduleListText(ui.scheduleExceptionText?.value || "");
  if (parsed.invalid.length) {
    setScheduleConfigStatus(`Há horários inválidos na exceção: ${parsed.invalid.join(", ")}`, true);
    return;
  }
  if (!parsed.values.length) {
    setScheduleConfigStatus("Informe pelo menos um horário para salvar a exceção.", true);
    return;
  }

  const config = getNucleusScheduleConfig(nucleus);
  config.exceptionsByDate[date] = parsed.values;
  config.updatedAt = new Date().toISOString();
  config.updatedBy = user.username;

  const calendar = getProjectCalendar();
  if (!calendar[nucleus]) calendar[nucleus] = { days: [], schedules: [] };
  if (!calendar[nucleus].days.includes(date)) {
    calendar[nucleus].days.push(date);
    calendar[nucleus].days.sort((a, b) => b.localeCompare(a));
  }

  pushNucleusLog(nucleus, "Configuração de horários", `Exceção salva para ${formatDateLabel(date)}`, user);
  persist();
  renderClassDays();
  syncScheduleExceptionEditor();
  setScheduleConfigStatus("Exceção por data salva com sucesso.");
}
function onRemoveScheduleException() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = getSelectedScheduleConfigNucleus();
  const date = ui.scheduleExceptionDate?.value || "";
  if (!nucleus || !date) {
    setScheduleConfigStatus("Selecione a data da exceção que deseja remover.", true);
    return;
  }

  const config = getNucleusScheduleConfig(nucleus);
  if (!config.exceptionsByDate?.[date]) {
    setScheduleConfigStatus("Não existe exceção salva nessa data.", true);
    return;
  }

  delete config.exceptionsByDate[date];
  config.updatedAt = new Date().toISOString();
  config.updatedBy = user.username;

  pushNucleusLog(nucleus, "Configuração de horários", `Exceção removida de ${formatDateLabel(date)}`, user);
  persist();
  renderClassDays();
  syncScheduleExceptionEditor();
  setScheduleConfigStatus("Exceção removida com sucesso.");
}
function onRegisterScheduleDay() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const nucleus = getSelectedScheduleConfigNucleus();
  const date = ui.scheduleDayDate?.value || "";
  if (!nucleus || !date) {
    setScheduleConfigStatus("Selecione núcleo e data para registrar a aula.", true);
    return;
  }

  const calendar = getProjectCalendar();
  if (!calendar[nucleus]) calendar[nucleus] = { days: [], schedules: [] };
  if (!calendar[nucleus].days.includes(date)) {
    calendar[nucleus].days.push(date);
    calendar[nucleus].days.sort((a, b) => b.localeCompare(a));
  }

  pushNucleusLog(nucleus, "Calendário", `Data de aula registrada: ${formatDateLabel(date)}`, user);
  persist();
  renderClassDays();
  syncScheduleExceptionEditor();
  setScheduleConfigStatus("Data de aula registrada com sucesso.");
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
