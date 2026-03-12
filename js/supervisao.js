"use strict";

function buildSupervisaoStatusSelect(name) {
  return `
    <select class="supervisao-status-select" name="${name}">
      <option value="">-</option>
      <option value="sim">✔</option>
      <option value="parcial">•</option>
      <option value="nao">✖</option>
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

  const atual = select.value || "";
  select.innerHTML = `<option value="">Selecione</option>`;

  getVisibleNuclei().forEach((n) => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    select.appendChild(opt);
  });

  if ([...select.options].some((o) => o.value === atual)) {
    select.value = atual;
  }
}

function salvarChecklistSupervisao() {
  const user = currentUser();
  if (!user || user.role !== "supervisao") {
    alert("Apenas o perfil de Supervisão pode salvar este checklist.");
    return;
  }

  const registro = {
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    createdAt: new Date().toISOString(),

    data: el("supervisaoData")?.value || "",
    nucleo: el("supervisaoNucleo")?.value || "",
    modalidade: el("supervisaoModalidade")?.value || "",
    instrutor: el("supervisaoInstrutor")?.value?.trim() || "",

    observacoesGerais: el("supervisaoObsGerais")?.value?.trim() || "",
    avaliacaoGeral: el("supervisaoAvaliacaoGeral")?.value || "",
    supervisor: el("supervisaoSupervisor")?.value?.trim() || "",
    supervisorCpf: el("supervisaoSupervisorCpf")?.value?.trim() || "",
    instrutorCpf: el("supervisaoInstrutorCpf")?.value?.trim() || "",

    mes: el("supervisaoMes")?.value || "",
    dia: el("supervisaoDia")?.value || "",
    supervisorMensal: el("supervisaoSupervisorMensal")?.value?.trim() || "",
    gerenteGeral: el("supervisaoGerenteGeral")?.value?.trim() || "",
    finalizacao: el("supervisaoFinalizacao")?.value || "",
    supervisorMensalCpf: el("supervisaoSupervisorMensalCpf")?.value?.trim() || "",
    gerenteCpf: el("supervisaoGerenteCpf")?.value?.trim() || "",

    checklistDiario: {},
    metodologiaInstrutores: {},
    metodologiaTurmas: {},
  };

  document.querySelectorAll("#supervisaoChecklistDiarioBody select").forEach((select) => {
    registro.checklistDiario[select.name] = select.value || "";
  });

  document.querySelectorAll("#supervisaoMetodologiaInstrutoresBody select").forEach((select) => {
    registro.metodologiaInstrutores[select.name] = select.value || "";
  });

  document.querySelectorAll("#supervisaoMetodologiaTurmasBody select").forEach((select) => {
    registro.metodologiaTurmas[select.name] = select.value || "";
  });

  if (!registro.data || !registro.nucleo) {
    alert("Preencha pelo menos a data e o núcleo da supervisão.");
    return;
  }

  getSupervisaoBag().unshift(registro);
  persist();

  alert("Checklist da supervisão salvo com sucesso.");
}
