"use strict";

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

      <form id="adminLessonForm" class="grid-form three" data-edit-id="">
        <label>Título da aula
          <input id="lessonTitle" type="text" placeholder="Ex: Aula 01 — Bases do Boxe" required />
        </label>

        <label>Modalidade
          <select id="lessonCategory">
            <option value="">Selecione</option>
          </select>
        </label>

        <label>Semana
          <select id="lessonWeek">
            <option value="">Selecione</option>
          </select>
        </label>

        <label>Ordem da aula
          <select id="lessonOrder">
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

<label>Extras (opcional)
  <textarea id="lessonExtra" rows="3" placeholder="Materiais, orientações, observações e informações complementares da aula"></textarea>
</label>

<div style="grid-column:1 / -1; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap">
  <button type="submit" class="primary">Salvar aula</button>
  <button type="button" id="lessonClear" class="ghost">Limpar</button>
  <span id="lessonStatus" class="report-status">Cadastre aulas por modalidade, semana e ordem pedagÃ³gica.</span>
</div>
      </form>

      <div class="table-wrapper" style="margin-top:10px">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Modalidade</th>
              <th>Semana</th>
              <th>Ordem</th>
              <th>Nível</th>
              <th>Fonte</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="adminLessonsTableBody">
            <tr><td colspan="7" class="empty">Sem aulas cadastradas.</td></tr>
          </tbody>
        </table>
      </div>
    `;
    adminArea.appendChild(panel2);
  }
  if (!el("adminWeekForm")) {
    const panel3 = document.createElement("section");
    panel3.className = "panel";
    panel3.style.marginTop = "12px";
    panel3.innerHTML = `
      <div class="panel-title-row">
        <h2>Admin • Semanas EAD</h2>
        <span class="badge">Pedagogico</span>
      </div>

      <form id="adminWeekForm" class="grid-form two" data-edit-key="">
        <label>Modalidade
          <select id="weekCategory">
            <option value="">Selecione</option>
          </select>
        </label>

        <label>Semana
          <select id="weekNumber">
            <option value="">Selecione</option>
          </select>
        </label>

        <label>Titulo opcional
          <input id="weekTitle" type="text" placeholder="Ex: Bases, deslocamento e leitura de jogo" />
        </label>

        <label style="grid-column:1 / -1">Resumo da semana
          <textarea id="weekSummary" rows="4" placeholder="Texto principal que aparece no accordion da semana." required></textarea>
        </label>

        <label style="grid-column:1 / -1">Objetivos / observacoes / texto livre
          <textarea id="weekNotes" rows="4" placeholder="Objetivos pedagogicos, observacoes e orientacoes complementares."></textarea>
        </label>

        <div style="grid-column:1 / -1; display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap">
          <button type="submit" class="primary">Salvar semana</button>
          <button type="button" id="weekClear" class="ghost">Limpar</button>
          <span id="weekStatus" class="report-status">Cadastre o resumo pedagogico que aparecera dentro da semana no EAD.</span>
        </div>
      </form>

      <div class="table-wrapper" style="margin-top:10px">
        <table>
          <thead>
            <tr>
              <th>Modalidade</th>
              <th>Semana</th>
              <th>Titulo</th>
              <th>Resumo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody id="adminWeeksTableBody">
            <tr><td colspan="5" class="empty">Sem resumos semanais cadastrados.</td></tr>
          </tbody>
        </table>
      </div>
    `;
    adminArea.appendChild(panel3);
  }
}

function hydrateLessonAdminCategorySelect() {
  const sel = el("lessonCategory");
  const weekCategory = el("weekCategory");

  [sel, weekCategory].forEach((node) => {
    if (!node) return;
    const current = node.value || "";
    node.innerHTML = `<option value="">Selecione</option>` +
      LESSON_CATEGORIES.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    if ([...node.options].some((opt) => opt.value === current)) node.value = current;
  });

  syncLessonWeekAndOrderOptions(true);
  syncWeekNumberOptions(true);
}

function hydrateNumericSelect(node, max, current = "", placeholder = "Selecione") {
  if (!node) return;
  node.innerHTML = `<option value="">${placeholder}</option>` +
    Array.from({ length: Math.max(0, max) }, (_, idx) => {
      const value = String(idx + 1);
      return `<option value="${value}">${value}</option>`;
    }).join("");

  if ([...node.options].some((opt) => opt.value === String(current || ""))) {
    node.value = String(current);
  }
}

function syncLessonWeekAndOrderOptions(keepSelection = false) {
  const category = normalizeEadCategory(el("lessonCategory")?.value || "");
  const weekNode = el("lessonWeek");
  const orderNode = el("lessonOrder");
  const currentWeek = keepSelection ? weekNode?.value || "" : "";
  const currentOrder = keepSelection ? orderNode?.value || "" : "";
  const rule = category ? getEadPedagogy(category) : null;

  hydrateNumericSelect(weekNode, rule?.maxWeeks || 0, currentWeek);
  hydrateNumericSelect(orderNode, rule?.maxLessonsPerWeek || 0, currentOrder);
}

function syncWeekNumberOptions(keepSelection = false) {
  const category = normalizeEadCategory(el("weekCategory")?.value || "");
  const weekNode = el("weekNumber");
  const currentWeek = keepSelection ? weekNode?.value || "" : "";
  const rule = category ? getEadPedagogy(category) : null;
  hydrateNumericSelect(weekNode, rule?.maxWeeks || 0, currentWeek);
}

function clearLessonForm(message = "FormulÃ¡rio limpo.") {
  const form = el("adminLessonForm");
  form?.reset();
  if (form) form.dataset.editId = "";
  syncLessonWeekAndOrderOptions(false);
  const status = el("lessonStatus");
  if (status) status.textContent = message;
}

function fillLessonForm(lesson) {
  const form = el("adminLessonForm");
  if (!form || !lesson) return;

  form.dataset.editId = lesson.id || "";
  el("lessonTitle").value = lesson.title || "";
  el("lessonCategory").value = normalizeEadCategory(lesson.category) || "";
  syncLessonWeekAndOrderOptions(false);
  el("lessonWeek").value = lesson.week ? String(lesson.week) : "";
  el("lessonOrder").value = lesson.lessonOrder ? String(lesson.lessonOrder) : "";
  el("lessonLevel").value = lesson.level || "";
  el("lessonUrl").value = lesson.originalUrl || lesson.embedUrl || "";
  el("lessonDesc").value = lesson.desc || "";
  el("lessonExtra").value = lesson.extra || "";

  const status = el("lessonStatus");
  if (status) status.textContent = `Editando ${lesson.title}. Salve para atualizar o registro.`;
}

function clearWeekForm(message = "FormulÃ¡rio limpo.") {
  const form = el("adminWeekForm");
  form?.reset();
  if (form) form.dataset.editKey = "";
  syncWeekNumberOptions(false);
  const status = el("weekStatus");
  if (status) status.textContent = message;
}

function fillWeekForm(entry) {
  const form = el("adminWeekForm");
  if (!form || !entry) return;

  form.dataset.editKey = `${entry.category}|${entry.week}`;
  el("weekCategory").value = entry.category || "";
  syncWeekNumberOptions(false);
  el("weekNumber").value = String(entry.week || "");
  el("weekTitle").value = entry.title || "";
  el("weekSummary").value = entry.summary || "";
  el("weekNotes").value = entry.notes || "";

  const status = el("weekStatus");
  if (status) status.textContent = `Editando ${entry.category} • Semana ${entry.week}.`;
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
      <div class="aula-player-tabs">
        <div class="aula-video-wrap">
          <iframe
            src="${lesson.embedUrl}"
            style="width:100%; height:420px; border:0; border-radius:12px;"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <div class="aula-detail-tabs">
          <div class="aula-detail-tab-buttons">
            <button type="button" class="aula-detail-tab-btn active" data-tab-target="desc">Descrição</button>
            <button type="button" class="aula-detail-tab-btn" data-tab-target="extra">Extras</button>
          </div>

          <div class="aula-detail-tab-panels">
            <div class="aula-detail-tab-panel active" data-tab-panel="desc">
              ${(lesson.desc || "").trim()
                ? escapeHtml(lesson.desc).replace(/\n/g, "<br>")
                : "Sem descrição para esta aula."}
            </div>

            <div class="aula-detail-tab-panel" data-tab-panel="extra">
              ${(lesson.extra || "").trim()
                ? escapeHtml(lesson.extra).replace(/\n/g, "<br>")
                : "Sem informações extras para esta aula."}
            </div>
          </div>
        </div>
      </div>
    `;

    ui.aulaPlayer.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab-target");

        ui.aulaPlayer.querySelectorAll("[data-tab-target]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-tab-target") === target);
        });

        ui.aulaPlayer.querySelectorAll("[data-tab-panel]").forEach((panel) => {
          panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === target);
        });
      });
    });
  }

  if (ui.aulaMetaBadge) {
    ui.aulaMetaBadge.textContent = `${lesson.category || "-"} • ${lesson.level || "-"}`;
  }
}

function renderAdminLessonsTable() {
  const body = el("adminLessonsTableBody");
  if (!body) return;

  const lessons = ensureLessonsBag()
    .slice()
    .sort((a, b) =>
      String(normalizeEadCategory(a.category) || a.category || "").localeCompare(
        String(normalizeEadCategory(b.category) || b.category || ""),
        "pt-BR"
      ) ||
      Number(a.week || 0) - Number(b.week || 0) ||
      Number(a.lessonOrder || 0) - Number(b.lessonOrder || 0)
    );

  if (!lessons.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty">Sem aulas cadastradas.</td></tr>`;
    return;
  }

  body.innerHTML = lessons.map((a) => `
    <tr>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(normalizeEadCategory(a.category) || "-")}</td>
      <td>${escapeHtml(a.week || "-")}</td>
      <td>${escapeHtml(a.lessonOrder || "-")}</td>
      <td>${escapeHtml(a.level || "-")}</td>
      <td>${escapeHtml(a.provider)}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap">
        <button type="button" class="small-btn" data-open="${a.id}">Abrir</button>
        <button type="button" class="ghost" data-edit="${a.id}">Editar</button>
        <button type="button" class="ghost" data-del="${a.id}">Excluir</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveTab("tab-aulas");
      window.openEadLessonById?.(btn.getAttribute("data-open"));
    });
  });

  body.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lesson = ensureLessonsBag().find((item) => item.id === btn.getAttribute("data-edit"));
      if (!lesson) return;
      fillLessonForm(lesson);
      el("lessonTitle")?.focus();
    });
  });

  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      state.lessonsByProject[state.currentProjectKey] = ensureLessonsBag().filter((x) => x.id !== id);
      persist();
      renderAdminLessonsTable();
      renderAdminWeeksTable();
      renderLessonsGrid();
    });
  });
}

function renderAdminWeeksTable() {
  const body = el("adminWeeksTableBody");
  if (!body) return;

  const weeks = ensureEadWeeksBag()
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category, "pt-BR") || a.week - b.week);

  if (!weeks.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty">Sem resumos semanais cadastrados.</td></tr>`;
    return;
  }

  body.innerHTML = weeks.map((entry) => `
    <tr>
      <td>${escapeHtml(entry.category)}</td>
      <td>${entry.week}</td>
      <td>${escapeHtml(entry.title || "-")}</td>
      <td>${escapeHtml((entry.summary || "").slice(0, 140) || "-")}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap">
        <button type="button" class="small-btn" data-week-edit="${entry.category}|${entry.week}">Editar</button>
        <button type="button" class="ghost" data-week-del="${entry.category}|${entry.week}">Excluir</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-week-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [category, weekText] = String(btn.getAttribute("data-week-edit") || "").split("|");
      const week = Number.parseInt(weekText, 10);
      const entry = ensureEadWeeksBag().find((item) => item.category === category && item.week === week);
      if (!entry) return;
      fillWeekForm(entry);
      el("weekTitle")?.focus();
    });
  });

  body.querySelectorAll("[data-week-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [category, weekText] = String(btn.getAttribute("data-week-del") || "").split("|");
      const week = Number.parseInt(weekText, 10);
      state.weeksByProject[state.currentProjectKey] = ensureEadWeeksBag().filter(
        (item) => !(item.category === category && item.week === week)
      );
      persist();
      renderAdminWeeksTable();
    });
  });
}

