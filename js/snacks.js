"use strict";

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

function getAnnualSnackRows(year = 0) {
  const selectedYear = Number(year || 0);

  return state.students.flatMap((student) => {
    const project = student.project || inferProjectKeyFromNucleus(student.nucleus) || "-";
    const projectLabel = PROJECTS.find((item) => item.key === project)?.label || project;

    return (Array.isArray(student.snackLog) ? student.snackLog : [])
      .map((log) => {
        const date = new Date(log?.ts || "");
        if (Number.isNaN(date.getTime())) return null;
        if (selectedYear && date.getFullYear() !== selectedYear) return null;

        return {
          ts: date.toISOString(),
          year: date.getFullYear(),
          month: date.getMonth(),
          monthLabel: date.toLocaleDateString("pt-BR", { month: "long" }),
          nucleus: normalizeNucleusName(log?.nucleus || student.nucleus || "") || "-",
          project,
          projectLabel,
          studentName: student.name || "-",
          by: log?.by || "-",
        };
      })
      .filter(Boolean);
  });
}

function getAnnualSnackYears() {
  const years = Array.from(new Set(getAnnualSnackRows().map((row) => row.year))).sort((a, b) => b - a);
  if (!years.length) years.push(new Date().getFullYear());
  return years;
}

function hydrateAnnualSnackYearOptions() {
  if (!ui.annualSnackYear) return;

  const currentValue = Number(ui.annualSnackYear.value || 0);
  const years = getAnnualSnackYears();
  ui.annualSnackYear.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");

  ui.annualSnackYear.value = years.includes(currentValue) ? String(currentValue) : String(years[0]);
}

function summarizeAnnualSnackRows(rows = []) {
  const byMonth = Array.from({ length: 12 }, (_, month) => ({
    month,
    label: new Date(2026, month, 1).toLocaleDateString("pt-BR", { month: "long" }),
    total: 0,
  }));
  const byNucleus = new Map();
  const byProject = new Map();

  rows.forEach((row) => {
    if (byMonth[row.month]) byMonth[row.month].total += 1;
    byNucleus.set(row.nucleus, (byNucleus.get(row.nucleus) || 0) + 1);
    byProject.set(row.projectLabel, (byProject.get(row.projectLabel) || 0) + 1);
  });

  return {
    total: rows.length,
    monthsWithRecords: byMonth.filter((item) => item.total > 0).length,
    nucleiCount: byNucleus.size,
    projectCount: byProject.size,
    byMonth,
    byNucleus: Array.from(byNucleus.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total),
    byProject: Array.from(byProject.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total),
  };
}

function buildAnnualSnackTable(title, rows = [], labelKey = "label") {
  if (!rows.length) {
    return `
      <section class="acompanhamento-card">
        <div class="panel-title-row">
          <h3>${escapeHtml(title)}</h3>
        </div>
        <p class="muted">Sem registros para este agrupamento.</p>
      </section>
    `;
  }

  return `
    <section class="acompanhamento-card">
      <div class="panel-title-row">
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="table-wrapper">
        <table class="annual-snack-table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row[labelKey] || "-")}</td>
                <td>${escapeHtml(String(row.total || 0))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAnnualSnackReport() {
  if (!ui.annualSnackBoard) return;

  const user = currentUser();
  if (!user || !["admin", "gestao"].includes(user.role)) return;

  hydrateAnnualSnackYearOptions();

  const year = Number(ui.annualSnackYear?.value || new Date().getFullYear());
  const rows = getAnnualSnackRows(year);
  const summary = summarizeAnnualSnackRows(rows);

  if (ui.annualSnackStatus) {
    ui.annualSnackStatus.textContent = rows.length
      ? "Base utilizada: registros reais de entrega de lanches. O sistema atual nao possui um repositorio anual separado de pedidos."
      : "Nao ha registros de entrega de lanches para o ano selecionado.";
  }

  if (!rows.length) {
    ui.annualSnackBoard.innerHTML = `<div class="empty">Sem entregas de lanches registradas em ${year}.</div>`;
    return;
  }

  ui.annualSnackBoard.innerHTML = `
    <section class="annual-snack-grid">
      <article class="acompanhamento-card">
        <strong>Total anual</strong>
        <div class="annual-snack-value">${summary.total}</div>
        <div class="muted">Lanches entregues registrados em ${year}</div>
      </article>
      <article class="acompanhamento-card">
        <strong>Meses com registro</strong>
        <div class="annual-snack-value">${summary.monthsWithRecords}</div>
        <div class="muted">Meses com ao menos uma entrega</div>
      </article>
      <article class="acompanhamento-card">
        <strong>Nucleos</strong>
        <div class="annual-snack-value">${summary.nucleiCount}</div>
        <div class="muted">Nucleos com movimentacao no ano</div>
      </article>
      <article class="acompanhamento-card">
        <strong>Projetos</strong>
        <div class="annual-snack-value">${summary.projectCount}</div>
        <div class="muted">Projetos com registros reais</div>
      </article>
    </section>
    ${buildAnnualSnackTable("Total por mes", summary.byMonth, "label")}
    ${buildAnnualSnackTable("Total por nucleo", summary.byNucleus)}
    ${buildAnnualSnackTable("Total por projeto", summary.byProject)}
  `;
}

function printAnnualSnackReport() {
  const year = Number(ui.annualSnackYear?.value || new Date().getFullYear());
  const rows = getAnnualSnackRows(year);
  if (!rows.length) return;

  const summary = summarizeAnnualSnackRows(rows);
  const popup = window.open("", "_blank", "width=1100,height=760");
  if (!popup) return;

  const buildRows = (items, key = "label") => items.map((item) => `
    <tr>
      <td>${escapeHtml(item[key] || "-")}</td>
      <td>${escapeHtml(String(item.total || 0))}</td>
    </tr>
  `).join("");

  popup.document.write(`
    <html lang="pt-BR">
      <head>
        <title>Relatorio anual de lanches</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1, h2 { margin: 0 0 12px; }
          p { margin: 0 0 16px; color: #444; }
          .toolbar { margin-bottom: 16px; }
          .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .summary article { border: 1px solid #d0d5dd; border-radius: 12px; padding: 14px; }
          .summary strong { display: block; margin-bottom: 8px; }
          .summary b { font-size: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 18px; }
          th, td { border: 1px solid #cfcfcf; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
          @media print { .toolbar { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="toolbar"><button onclick="window.print()">Imprimir</button></div>
        <h1>Relatorio anual de lanches</h1>
        <p>Ano: ${escapeHtml(String(year))} • Base: entregas reais registradas em alunos/snackLog • Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))}</p>
        <section class="summary">
          <article><strong>Total anual</strong><b>${escapeHtml(String(summary.total))}</b></article>
          <article><strong>Meses com registro</strong><b>${escapeHtml(String(summary.monthsWithRecords))}</b></article>
          <article><strong>Nucleos</strong><b>${escapeHtml(String(summary.nucleiCount))}</b></article>
          <article><strong>Projetos</strong><b>${escapeHtml(String(summary.projectCount))}</b></article>
        </section>
        <h2>Total por mes</h2>
        <table>
          <thead><tr><th>Mes</th><th>Total</th></tr></thead>
          <tbody>${buildRows(summary.byMonth)}</tbody>
        </table>
        <h2>Total por nucleo</h2>
        <table>
          <thead><tr><th>Nucleo</th><th>Total</th></tr></thead>
          <tbody>${buildRows(summary.byNucleus)}</tbody>
        </table>
        <h2>Total por projeto</h2>
        <table>
          <thead><tr><th>Projeto</th><th>Total</th></tr></thead>
          <tbody>${buildRows(summary.byProject)}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
}

