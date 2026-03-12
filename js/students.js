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
