"use strict";

// =========================
// DOC DO RELATÓRIO (GLOBAL)
// =========================


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

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
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

  const padTop = 26;
  const padRight = 26;
  const padBottom = 64;
  const padLeft = 58;

  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  if (chartW <= 0 || chartH <= 0) return;

  const max = Math.max(1, ...data.map((d) => d.total));

  /* fundo interno suave */
  const bg = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  bg.addColorStop(0, "#fbfdff");
  bg.addColorStop(1, "#f3f8fe");
  ctx.fillStyle = bg;
  ctx.fillRect(padLeft, padTop, chartW, chartH);

  /* grid horizontal */
  ctx.strokeStyle = "rgba(157, 176, 205, 0.26)";
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padTop + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + chartW, y);
    ctx.stroke();
  }

  /* eixo Y */
  ctx.fillStyle = "#4c6488";
  ctx.font = "600 12px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= gridLines; i++) {
    const value = Math.round(max - (max / gridLines) * i);
    const y = padTop + (chartH / gridLines) * i;
    ctx.fillText(String(value), padLeft - 10, y);
  }

  /* eixos */
  ctx.strokeStyle = "#aebdd4";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + chartH);
  ctx.lineTo(padLeft + chartW, padTop + chartH);
  ctx.stroke();

  if (!data.length) return;

  const step = chartW / data.length;
  const barW = Math.min(92, Math.max(42, step * 0.34));

  data.forEach((d, i) => {
    const x = padLeft + i * step + (step - barW) / 2;
    let topY = padTop + chartH;

    const segs = [
      { v: d.presente, color: "#2f9e62" },
      { v: d.justificado, color: "#3f63c9" },
      { v: d.falta, color: "#c02d3e" },
      { v: d.sa, color: "#8c97aa" },
    ];

    let totalBarHeight = 0;

    segs.forEach((seg) => {
      const hh = (seg.v / max) * chartH;
      if (hh <= 0) return;

      topY -= hh;
      totalBarHeight += hh;

      ctx.fillStyle = seg.color;
      ctx.fillRect(x, topY, barW, hh);
    });

    /* borda do conjunto */
    if (totalBarHeight > 0) {
      ctx.strokeStyle = "rgba(124, 145, 176, 0.38)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x,
        padTop + chartH - totalBarHeight,
        barW,
        totalBarHeight
      );
    }

    /* badge do percentual */
    const pct = d.total ? Math.round(((d.presente + d.justificado) / d.total) * 100) : 0;
    const badgeY = Math.max(18, padTop + chartH - totalBarHeight - 18);

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x + barW / 2 - 18, badgeY, 36, 18, 9, true, false);

    ctx.strokeStyle = "rgba(156, 172, 197, 0.55)";
    roundRect(ctx, x + barW / 2 - 18, badgeY, 36, 18, 9, false, true);

    ctx.fillStyle = "#203657";
    ctx.font = "700 11px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${pct}%`, x + barW / 2, badgeY + 9);

    /* nome do núcleo */
    ctx.fillStyle = "#173356";
    ctx.font = "700 12px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let label = d.nucleus || "";
    if (label.length > 12) label = label.slice(0, 12) + "…";
    ctx.fillText(label, x + barW / 2, padTop + chartH + 12);
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

  const fixedCount = students.filter(
    (s) => ensureAttendanceLog(s).filter((x) => x.project === state.currentProjectKey).length >= 5
  ).length;
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

  const padTop = 28;
  const padRight = 28;
  const padBottom = 48;
  const padLeft = 52;

  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;
  const max = Math.max(1, ...series.map((s) => s.value));

  /* fundo */
  const bg = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  bg.addColorStop(0, "#fbfdff");
  bg.addColorStop(1, "#f3f8fd");
  ctx.fillStyle = bg;
  ctx.fillRect(padLeft, padTop, chartW, chartH);

  /* linhas */
  ctx.strokeStyle = "rgba(160, 178, 205, 0.22)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + chartW, y);
    ctx.stroke();
  }

  /* eixos */
  ctx.strokeStyle = "#aebdd4";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + chartH);
  ctx.lineTo(padLeft + chartW, padTop + chartH);
  ctx.stroke();

  const step = series.length > 1 ? chartW / (series.length - 1) : 0;

  ctx.strokeStyle = "#b21a2b";
  ctx.lineWidth = 2.2;
  ctx.beginPath();

  series.forEach((s, i) => {
    const x = padLeft + i * step;
    const y = padTop + chartH - (s.value / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  series.forEach((s, i) => {
    const x = padLeft + i * step;
    const y = padTop + chartH - (s.value / max) * chartH;

    ctx.fillStyle = "#b21a2b";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#173356";
    ctx.font = "700 12px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(s.label, x, padTop + chartH + 8);

    ctx.fillStyle = "#203657";
    ctx.font = "700 11px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(String(s.value), x, y - 8);
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

