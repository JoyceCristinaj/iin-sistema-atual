"use strict";

function buildSupervisaoStatusSelect(name) {
  return `
    <select class="supervisao-status-select" name="${name}">
      <option value="">-</option>
      <option value="sim">Sim</option>
      <option value="parcial">Parcial</option>
      <option value="nao">Nao</option>
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

  const currentValue = select.value || "";
  select.innerHTML = `<option value="">Selecione</option>`;

  getVisibleNuclei().forEach((nucleus) => {
    const option = document.createElement("option");
    option.value = nucleus;
    option.textContent = nucleus;
    select.appendChild(option);
  });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function currentSupervisaoUser() {
  const user = currentUser();
  if (!user || user.role !== "supervisao") {
    alert("Apenas o perfil de Supervisao pode usar este checklist.");
    return null;
  }
  return user;
}

function getSupervisaoContext() {
  return {
    data: el("supervisaoData")?.value || "",
    nucleo: el("supervisaoNucleo")?.value || "",
    modalidade: el("supervisaoModalidade")?.value || "",
    mes: el("supervisaoMes")?.value || "",
  };
}

function collectSelectValues(selector) {
  const values = {};
  document.querySelectorAll(selector).forEach((node) => {
    values[node.name] = node.value || "";
  });
  return values;
}

function applySelectValues(selector, values = {}) {
  document.querySelectorAll(selector).forEach((node) => {
    node.value = values[node.name] || "";
  });
}

function clearSelectValues(selector) {
  applySelectValues(selector, {});
}

function matchesOptionalValue(left, right) {
  if (!right) return true;
  return normText(left || "") === normText(right || "");
}

function findSupervisaoRecord(type, context = getSupervisaoContext()) {
  return getSupervisaoBag().find((record) => {
    if (record.type !== type) return false;
    if ((record.nucleo || "") !== (context.nucleo || "")) return false;
    if (!matchesOptionalValue(record.modalidade, context.modalidade)) return false;

    if (type === "supervisao_diario") {
      return (record.data || "") === (context.data || "");
    }

    return (record.mes || "") === (context.mes || "");
  }) || null;
}

function upsertSupervisaoRecord(record) {
  const bag = getSupervisaoBag();
  const index = bag.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    bag[index] = record;
  } else {
    bag.unshift(record);
  }
  bag.sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function setSupervisaoStatusMessage(node, message, isError = false) {
  if (!node) return;
  node.textContent = message || "";
  node.style.color = isError ? "#b42318" : "";
}

function setSupervisaoMensalEditable(isEditable) {
  const content = el("supervisaoMensalContent");
  if (!content) return;

  content.querySelectorAll("input, select, textarea, button").forEach((node) => {
    node.disabled = !isEditable;
  });
}

function syncSupervisaoMensalMeta(record) {
  const status = record?.status === "concluido" ? "concluido" : "rascunho";
  if (ui.supervisaoMensalStatus) {
    ui.supervisaoMensalStatus.value = status;
    ui.supervisaoMensalStatus.disabled = record?.status === "concluido";
  }
  if (ui.supervisaoMensalStatusText) {
    ui.supervisaoMensalStatusText.textContent = status === "concluido" ? "Concluido" : "Em andamento";
  }
  if (ui.supervisaoMensalConcluidoEm) {
    ui.supervisaoMensalConcluidoEm.textContent = record?.concludedAt
      ? `Concluido em ${new Date(record.concludedAt).toLocaleString("pt-BR")}`
      : record?.updatedAt
        ? `Ultima atualizacao: ${new Date(record.updatedAt).toLocaleString("pt-BR")}`
        : "";
  }
  setSupervisaoMensalEditable(status !== "concluido");
}

function loadSupervisaoDailyForm() {
  const record = findSupervisaoRecord("supervisao_diario");
  applySelectValues("#supervisaoChecklistDiarioBody select", record?.checklistDiario || {});

  if (record) {
    el("supervisaoInstrutor").value = record.instrutor || el("supervisaoInstrutor").value || "";
    el("supervisaoObsGerais").value = record.observacoesGerais || "";
    el("supervisaoAvaliacaoGeral").value = record.avaliacaoGeral || "";
    el("supervisaoSupervisor").value = record.supervisor || "";
    el("supervisaoSupervisorCpf").value = record.supervisorCpf || "";
    el("supervisaoInstrutorCpf").value = record.instrutorCpf || "";
  } else {
    clearSelectValues("#supervisaoChecklistDiarioBody select");
    el("supervisaoObsGerais").value = "";
    el("supervisaoAvaliacaoGeral").value = "";
    el("supervisaoSupervisor").value = "";
    el("supervisaoSupervisorCpf").value = "";
    el("supervisaoInstrutorCpf").value = "";
  }
}

function loadSupervisaoMonthlyForm() {
  const record = findSupervisaoRecord("supervisao_mensal");
  applySelectValues("#supervisaoMetodologiaInstrutoresBody select", record?.metodologiaInstrutores || {});
  applySelectValues("#supervisaoMetodologiaTurmasBody select", record?.metodologiaTurmas || {});

  if (record) {
    el("supervisaoDia").value = record.dia || "";
    el("supervisaoSupervisorMensal").value = record.supervisorMensal || "";
    el("supervisaoGerenteGeral").value = record.gerenteGeral || "";
    el("supervisaoFinalizacao").value = record.finalizacao || "";
    el("supervisaoSupervisorMensalCpf").value = record.supervisorMensalCpf || "";
    el("supervisaoGerenteCpf").value = record.gerenteCpf || "";
  } else {
    clearSelectValues("#supervisaoMetodologiaInstrutoresBody select");
    clearSelectValues("#supervisaoMetodologiaTurmasBody select");
    el("supervisaoDia").value = "";
    el("supervisaoSupervisorMensal").value = "";
    el("supervisaoGerenteGeral").value = "";
    el("supervisaoFinalizacao").value = "";
    el("supervisaoSupervisorMensalCpf").value = "";
    el("supervisaoGerenteCpf").value = "";
  }

  syncSupervisaoMensalMeta(record);
}

function renderSupervisaoTab() {
  const user = currentUser();
  if (!user || user.role !== "supervisao") return;

  hydrateSupervisaoNucleo();

  if (!el("supervisaoData")?.value) el("supervisaoData").value = isoToday();
  if (!el("supervisaoMes")?.value) el("supervisaoMes").value = isoToday().slice(0, 7);

  loadSupervisaoDailyForm();
  loadSupervisaoMonthlyForm();
}

function buildSupervisaoDailyRecord(existingRecord = null) {
  const context = getSupervisaoContext();
  return normalizeSupervisaoRecord({
    ...existingRecord,
    id: existingRecord?.id || crypto.randomUUID(),
    type: "supervisao_diario",
    project: state.currentProjectKey,
    createdAt: existingRecord?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: context.data,
    nucleo: context.nucleo,
    modalidade: context.modalidade,
    instrutor: el("supervisaoInstrutor")?.value?.trim() || "",
    observacoesGerais: el("supervisaoObsGerais")?.value?.trim() || "",
    avaliacaoGeral: el("supervisaoAvaliacaoGeral")?.value || "",
    supervisor: el("supervisaoSupervisor")?.value?.trim() || "",
    supervisorCpf: el("supervisaoSupervisorCpf")?.value?.trim() || "",
    instrutorCpf: el("supervisaoInstrutorCpf")?.value?.trim() || "",
    checklistDiario: collectSelectValues("#supervisaoChecklistDiarioBody select"),
  }, "supervisao_diario", state.currentProjectKey);
}

function buildSupervisaoMonthlyRecord(existingRecord = null, status = "rascunho") {
  const context = getSupervisaoContext();
  const isConcluded = status === "concluido";
  const now = new Date().toISOString();
  return normalizeSupervisaoRecord({
    ...existingRecord,
    id: existingRecord?.id || crypto.randomUUID(),
    type: "supervisao_mensal",
    project: state.currentProjectKey,
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
    nucleo: context.nucleo,
    modalidade: context.modalidade,
    instrutor: el("supervisaoInstrutor")?.value?.trim() || "",
    mes: context.mes,
    dia: el("supervisaoDia")?.value || "",
    supervisorMensal: el("supervisaoSupervisorMensal")?.value?.trim() || "",
    gerenteGeral: el("supervisaoGerenteGeral")?.value?.trim() || "",
    finalizacao: isConcluded
      ? (el("supervisaoFinalizacao")?.value || isoToday())
      : (el("supervisaoFinalizacao")?.value || ""),
    supervisorMensalCpf: el("supervisaoSupervisorMensalCpf")?.value?.trim() || "",
    gerenteCpf: el("supervisaoGerenteCpf")?.value?.trim() || "",
    metodologiaInstrutores: collectSelectValues("#supervisaoMetodologiaInstrutoresBody select"),
    metodologiaTurmas: collectSelectValues("#supervisaoMetodologiaTurmasBody select"),
    status,
    concludedAt: isConcluded ? now : "",
  }, "supervisao_mensal", state.currentProjectKey);
}

function salvarChecklistSupervisaoDiario() {
  const user = currentSupervisaoUser();
  if (!user) return;

  const context = getSupervisaoContext();
  if (!context.data || !context.nucleo) {
    setSupervisaoStatusMessage(ui.supervisaoDiarioStatus, "Preencha data e nucleo antes de salvar o checklist diario.", true);
    return;
  }

  const existingRecord = findSupervisaoRecord("supervisao_diario", context);
  const record = buildSupervisaoDailyRecord(existingRecord);
  upsertSupervisaoRecord(record);
  persist();

  pushNucleusLog(
    record.nucleo,
    "Checklist diario de supervisao",
    `${record.modalidade || "-"} • ${record.data || "-"}`,
    user
  );

  setSupervisaoStatusMessage(ui.supervisaoDiarioStatus, "Checklist diario salvo com sucesso.");
  renderSupervisaoTab();
}

function salvarChecklistSupervisaoMensalRascunho() {
  const user = currentSupervisaoUser();
  if (!user) return;

  const context = getSupervisaoContext();
  if (!context.nucleo || !context.mes) {
    setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, "Preencha nucleo e mes antes de salvar o mensal.", true);
    return;
  }

  const existingRecord = findSupervisaoRecord("supervisao_mensal", context);
  if (existingRecord?.status === "concluido") {
    setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, "Este checklist mensal ja foi concluido e esta bloqueado para edicao.", true);
    return;
  }

  const record = buildSupervisaoMonthlyRecord(existingRecord, "rascunho");
  upsertSupervisaoRecord(record);
  persist();

  pushNucleusLog(
    record.nucleo,
    "Checklist mensal de supervisao",
    `${record.mes || "-"} • rascunho salvo`,
    user
  );

  setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, "Rascunho mensal salvo.");
  renderSupervisaoTab();
}

function concluirChecklistSupervisaoMensal() {
  const user = currentSupervisaoUser();
  if (!user) return;

  const context = getSupervisaoContext();
  if (!context.nucleo || !context.mes) {
    setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, "Preencha nucleo e mes antes de concluir o mensal.", true);
    return;
  }

  const existingRecord = findSupervisaoRecord("supervisao_mensal", context);
  if (existingRecord?.status === "concluido") {
    setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, "Este checklist mensal ja foi concluido anteriormente.", true);
    return;
  }

  const record = buildSupervisaoMonthlyRecord(existingRecord, "concluido");
  upsertSupervisaoRecord(record);
  persist();

  pushNucleusLog(
    record.nucleo,
    "Checklist mensal de supervisao",
    `${record.mes || "-"} • concluido`,
    user
  );

  setSupervisaoStatusMessage(ui.supervisaoMensalConcluidoEm, `Concluido em ${new Date(record.concludedAt).toLocaleString("pt-BR")}`);
  renderSupervisaoTab();
  renderAcompanhamentoTab?.();
}
