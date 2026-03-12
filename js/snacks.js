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

