"use strict";

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
  clearLessonForm("Cadastre aulas por modalidade, semana e ordem pedagógica.");
  clearWeekForm("Cadastre o resumo pedagógico da semana.");
  renderAdminLessonsTable();
  renderAdminWeeksTable();
  renderLessonsGrid();
  hydrateSupervisaoNucleo();
  renderSupervisaoTables();

  enhanceFormsAndTheme();
  setupProfessorTabs?.();
  document.getElementById("adminSupportPanel")?.remove();

  bindEvents();
  bindCollapsiblePanels();
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
  el("lessonCategory")?.addEventListener("change", () => syncLessonWeekAndOrderOptions(false));
  el("weekCategory")?.addEventListener("change", () => syncWeekNumberOptions(false));

  el("adminWeekForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const status = el("weekStatus");
    const editKey = form?.dataset?.editKey || "";
    const category = normalizeEadCategory(el("weekCategory")?.value || "");
    const week = Number.parseInt(el("weekNumber")?.value || "", 10);
    const title = el("weekTitle")?.value?.trim() || "";
    const summary = el("weekSummary")?.value?.trim() || "";
    const notes = el("weekNotes")?.value?.trim() || "";

    if (!category) {
      if (status) status.textContent = "Selecione uma modalidade para a semana.";
      return;
    }

    const rule = getEadPedagogy(category);
    if (!Number.isInteger(week) || week < 1 || week > rule.maxWeeks) {
      if (status) status.textContent = `Semana invalida para ${category}. Use de 1 a ${rule.maxWeeks}.`;
      return;
    }

    if (!summary) {
      if (status) status.textContent = "Preencha o resumo principal da semana.";
      return;
    }

    const list = ensureEadWeeksBag();
    const editingEntry = editKey
      ? list.find((item) => `${item.category}|${item.week}` === editKey)
      : null;
    const currentEntry = list.find((item) => item.category === category && item.week === week);
    const normalizedWeek = sanitizeEadWeekEntry({
      id: editingEntry?.id || currentEntry?.id || crypto.randomUUID(),
      project: state.currentProjectKey,
      category,
      week,
      title,
      summary,
      notes,
      updatedAt: new Date().toISOString(),
    });

    const editingIdx = editKey
      ? list.findIndex((item) => `${item.category}|${item.week}` === editKey)
      : -1;

    if (editingIdx >= 0) {
      list.splice(editingIdx, 1);
    }

    const replaceIdx = list.findIndex((item) => item.category === category && item.week === week);
    if (replaceIdx >= 0) list[replaceIdx] = { ...list[replaceIdx], ...normalizedWeek };
    else list.unshift(normalizedWeek);

    normalizeEadData(state.currentProjectKey);
    persist();

    clearWeekForm(currentEntry || editingEntry ? "Semana atualizada com sucesso." : "Semana salva com sucesso.");
    renderAdminWeeksTable();
  });

  el("weekClear")?.addEventListener("click", () => {
    clearWeekForm();
  });

  el("adminLessonForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const form = e.currentTarget;
    const status = el("lessonStatus");
    const editId = form?.dataset?.editId || "";

    const title = el("lessonTitle")?.value?.trim() || "";
    const category = normalizeEadCategory(el("lessonCategory")?.value || "");
    const week = Number.parseInt(el("lessonWeek")?.value || "", 10);
    const lessonOrder = Number.parseInt(el("lessonOrder")?.value || "", 10);
    const level = el("lessonLevel")?.value || "";
    const url = el("lessonUrl")?.value || "";
    const desc = el("lessonDesc")?.value?.trim() || "";
    const extra = el("lessonExtra")?.value?.trim() || "";

    if (!title || !category) {
      if (status) status.textContent = "Informe pelo menos o titulo e a modalidade da aula.";
      return;
    }

    const rule = getEadPedagogy(category);
    if (!Number.isInteger(week) || week < 1 || week > rule.maxWeeks) {
      if (status) status.textContent = `Semana invalida para ${category}. Use de 1 a ${rule.maxWeeks}.`;
      return;
    }

    if (!Number.isInteger(lessonOrder) || lessonOrder < 1 || lessonOrder > rule.maxLessonsPerWeek) {
      if (status) status.textContent = `Ordem invalida para ${category}. Use de 1 a ${rule.maxLessonsPerWeek}.`;
      return;
    }

    const conflictingLesson = ensureLessonsBag().find((lesson) =>
      lesson.id !== editId &&
      normalizeEadCategory(lesson.category) === category &&
      Number(lesson.week) === week &&
      Number(lesson.lessonOrder) === lessonOrder
    );

    if (conflictingLesson) {
      if (status) status.textContent = `Ja existe uma aula em ${category} • Semana ${week} • Ordem ${lessonOrder}.`;
      return;
    }

    const parsed = normalizeVideoUrl(url);
    if (!parsed.ok) {
      if (status) status.textContent = parsed.error;
      return;
    }

    const currentList = ensureLessonsBag();
    const existingLesson = editId ? currentList.find((lesson) => lesson.id === editId) : null;

    const lesson = {
      id: existingLesson?.id || crypto.randomUUID(),
      title,
      category,
      level,
      week,
      lessonOrder,
      desc,
      extra,
      provider: parsed.provider,
      embedUrl: parsed.embedUrl,
      thumb: parsed.thumb,
      createdAt: existingLesson?.createdAt || new Date().toISOString(),
      project: state.currentProjectKey,
    };

    if (existingLesson) {
      const idx = currentList.findIndex((item) => item.id === existingLesson.id);
      if (idx >= 0) currentList[idx] = lesson;
    } else {
      currentList.unshift(lesson);
    }

    normalizeEadData(state.currentProjectKey);
    persist();

    clearLessonForm(existingLesson ? "Aula atualizada com sucesso." : "Aula salva com sucesso.");
    renderAdminLessonsTable();
    renderAdminWeeksTable();
    renderLessonsGrid();
  });


  el("lessonClear")?.addEventListener("click", (e) => {
    e.stopImmediatePropagation();
    clearLessonForm();
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

  // Registros do colaborador
  ui.professorClassDate?.addEventListener("change", () => {
    const user = currentUser();
    if (user?.role === "professor") {
      hydrateProfessorScheduleOptions(user.nucleus, ui.professorClassDate?.value || "", "");
      syncTeacherSupportForm?.();
    }
  });

  ui.teacherAbsType?.addEventListener("change", () => syncTeacherSupportForm?.());
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
  ui.gestaoAlunoBusca?.addEventListener("input", renderListaAlunosGestao);
  ui.gestaoAlunoFiltroNucleo?.addEventListener("change", renderListaAlunosGestao);
  ui.gestaoAlunoFiltroModalidade?.addEventListener("change", renderListaAlunosGestao);
  ui.scheduleConfigNucleus?.addEventListener("change", onScheduleConfigNucleusChange);
  ui.scheduleDayDate?.addEventListener("change", syncScheduleExceptionEditor);
  ui.scheduleExceptionDate?.addEventListener("change", syncScheduleExceptionEditor);
  ui.scheduleResetDefaultsBtn?.addEventListener("click", onResetScheduleDefaults);
  ui.scheduleSaveStandardBtn?.addEventListener("click", onSaveStandardScheduleConfig);
  ui.scheduleSaveExceptionBtn?.addEventListener("click", onSaveScheduleException);
  ui.scheduleRemoveExceptionBtn?.addEventListener("click", onRemoveScheduleException);
  ui.scheduleRegisterDayBtn?.addEventListener("click", onRegisterScheduleDay);

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

  [
    ui.acompanhamentoTypeFilter,
    ui.acompanhamentoNucleusFilter,
    ui.acompanhamentoStudentFilter,
    ui.acompanhamentoCollaboratorFilter,
    ui.acompanhamentoDateStart,
    ui.acompanhamentoDateEnd,
  ].forEach((node) => node?.addEventListener("change", () => renderAcompanhamentoTab?.()));
  ui.acompanhamentoClearBtn?.addEventListener("click", clearAcompanhamentoFilters);
  ui.acompanhamentoPrintBtn?.addEventListener("click", printAcompanhamentoReport);
  ui.checklistPrintDailyBtn?.addEventListener("click", () => printChecklistEntriesByType?.("supervisao_diario"));
  ui.checklistPrintMonthlyBtn?.addEventListener("click", () => printChecklistEntriesByType?.("supervisao_mensal"));
  ui.eadWatchForm?.addEventListener("submit", onSaveEadWatchRecord);
  ui.eadWatchCollaborator?.addEventListener("change", syncEadWatchCollaborator);
  ui.annualSnackYear?.addEventListener("change", () => renderAnnualSnackReport?.());
  ui.annualSnackRefreshBtn?.addEventListener("click", () => renderAnnualSnackReport?.());
  ui.annualSnackPrintBtn?.addEventListener("click", printAnnualSnackReport);
  [
    ui.supervisaoData,
    ui.supervisaoNucleo,
    ui.supervisaoModalidade,
    ui.supervisaoMes,
  ].forEach((node) => node?.addEventListener("change", () => renderSupervisaoTab?.()));
  ui.salvarSupervisaoDiarioBtn?.addEventListener("click", salvarChecklistSupervisaoDiario);
  ui.salvarSupervisaoMensalRascunhoBtn?.addEventListener("click", salvarChecklistSupervisaoMensalRascunho);
  ui.concluirSupervisaoMensalBtn?.addEventListener("click", concluirChecklistSupervisaoMensal);

  // Modais
  ui.logModalClose?.addEventListener("click", closeLogModal);
  ui.logModal?.addEventListener("click", (e) => {
    if (e.target === ui.logModal) closeLogModal();
  });

  ui.pdfModalClose?.addEventListener("click", closePdfModal);
  ui.pdfModal?.addEventListener("click", (e) => {
    if (e.target === ui.pdfModal) closePdfModal();
  });

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
          const mode = applySnack.getAttribute("data-snack-mode") || "entry";
          const qty = Number(
            document.querySelector(`[data-snack-custom="${cssEscape(nucleus)}"][data-snack-mode="${cssEscape(mode)}"]`)?.value || 0
          );
          const note =
            document.querySelector(`[data-snack-note="${cssEscape(nucleus)}"]`)?.value || "";
          if (!Number.isFinite(qty) || qty <= 0) return;
          applySnackDelta(nucleus, mode === "exit" ? -qty : qty, note.trim());
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
  const canAccessStock = user.role === "admin" || user.role === "gestao";
  btn.classList.toggle("hidden", !canAccessStock);
}

  if (tab === "tab-dashboard") {
    btn.classList.toggle("hidden", user.role === "professor");
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

  if (tab === "tab-mestre") {
    btn.classList.toggle("hidden", user.role !== "professor");
  }

  if (tab === "tab-chamada") {
    btn.classList.toggle("hidden", user.role !== "professor");
  }

  // Relatórios: esconder do colaborador
  if (tab === "tab-relatorios") {
    btn.classList.toggle("hidden", user.role === "professor" || user.role === "supervisao");
  }

  if (tab === "tab-acompanhamento") {
    btn.classList.toggle("hidden", !(user.role === "gestao" || user.role === "admin"));
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

  if (user.role === "professor" && !["tab-chamada", "tab-professor", "tab-mestre", "tab-aulas"].includes(state.activeTab)) {
  state.activeTab = "tab-chamada";
}

if (user.role === "gestao" && !["tab-dashboard", "tab-gestao", "tab-estoque", "tab-relatorios", "tab-acompanhamento", "tab-fila", "tab-aulas"].includes(state.activeTab)) {
  state.activeTab = "tab-dashboard";
}

if (user.role === "supervisao" && !["tab-dashboard", "tab-supervisao"].includes(state.activeTab)) {
  state.activeTab = "tab-supervisao";
}

if (user.role === "admin" && !["tab-dashboard", "tab-gestao", "tab-estoque", "tab-relatorios", "tab-acompanhamento", "tab-admin", "tab-fila", "tab-aulas"].includes(state.activeTab)) {
  state.activeTab = "tab-dashboard";
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
renderScheduleConfigEditor?.();
renderUniformTable();
renderStock();
renderAlerts();
renderSnackStockTab();
hydrateWhatsStudents();
renderDashboardChart();
renderDashboardMiniChart();
renderAcompanhamentoTab?.();
renderChecklistPrintArea?.();
renderAnnualSnackReport?.();
renderSupervisaoTab?.();

if (state.activeTab === "tab-admin") {
  ensureAdminExtraPanels();
  hydrateLessonAdminCategorySelect();
  renderAdminLessonsTable();
  renderAdminWeeksTable();
  renderAdminMestreTable();
  bindCollapsiblePanels();

  requestAnimationFrame(() => {
    const mestrePanel = document.getElementById("adminMestrePanel");
    const mestreToggle = document.getElementById("adminMestreToggle");

    if (mestrePanel && mestreToggle) {
      mestrePanel.classList.add("is-open");
      mestreToggle.setAttribute("aria-expanded", "true");
    }
  });
} else {
  renderAdminLessonsTable();
  renderAdminWeeksTable();
  renderAdminMestreTable();
}

hydrateSupervisaoNucleo();

if (user.role === "professor") renderProfessorArea(user);
if (user.role === "admin") renderUsersTable();

updateReportRangeInfo();
}

function renderProfessorArea(user) {
  if (ui.professorNucleusBadge) ui.professorNucleusBadge.textContent = `Turma: ${user.nucleus}`;

  const staff = getAttendanceStaffByNucleus(user.nucleus);
  if (ui.professorClassDate) ui.professorClassDate.value = staff.classDate || "";
  hydrateProfessorScheduleOptions(user.nucleus, staff.classDate || "", staff.classSchedule || "");
  if (ui.professorClassProfessorName) ui.professorClassProfessorName.value = staff.professorName || "";
  if (ui.professorClassMonitorName) ui.professorClassMonitorName.value = staff.monitorName || "";

  const lock = getLock(user.nucleus);
  ui.classLockBadge?.classList.toggle("hidden", !(lock.locked && lock.lockedDate === staff.classDate));

  const students = getProjectStudents().filter((s) => s.nucleus === user.nucleus);
  renderBoard(ui.professorBoard, students, user);

  renderPlanningList(user.nucleus);
  renderProfessorHistory(user.nucleus);

  // combo do registro do colaborador
  if (ui.teacherAbsStudent) {
    ui.teacherAbsStudent.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = students.length ? "Selecione o aluno" : "Sem alunos neste núcleo";
    ui.teacherAbsStudent.appendChild(placeholder);

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

  syncTeacherSupportForm?.();
}

