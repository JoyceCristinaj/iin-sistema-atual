"use strict";

function patchVisitorBirthDateField() {
  if (!ui.visitorForm) return;
  if (el("visitorBirthDate")) return; // já existe

  const visitorDateInput = el("visitorDate");
  const visitorDateLabel = visitorDateInput ? visitorDateInput.closest("label") : null;
  const birthLabel = document.createElement("label");
  birthLabel.innerHTML = `
    Data de nascimento
    <input id="visitorBirthDate" type="date" />
  `;

  // tenta inserir perto da data da visita
  if (visitorDateLabel && visitorDateLabel.parentNode) {
    visitorDateLabel.insertAdjacentElement("afterend", birthLabel);
  } else {
    ui.visitorForm.appendChild(birthLabel);
  }
}

function patchVisitorFormButtons() {
  if (!ui.visitorForm) return;
  if (el("visitorFormActions")) return;

  // botão existente (submit) vira "Salvar visita"
  const submitBtn = ui.visitorForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Salvar visita";

  const actions = document.createElement("div");
  actions.id = "visitorFormActions";
  actions.className = "toolbar";
  actions.style.gridColumn = "1 / -1";
  actions.innerHTML = `
    <button type="button" id="visitorToStudentBtn" class="ghost">Cadastrar aluno</button>
  `;

  // coloca depois do botão submit
  if (submitBtn) {
    submitBtn.insertAdjacentElement("afterend", actions);
  } else {
    ui.visitorForm.appendChild(actions);
  }

  el("visitorToStudentBtn")?.addEventListener("click", convertVisitorFormToStudent);
}

function convertVisitorFormToStudent() {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = ui.visitorName?.value?.trim() || "";
  const nucleus = ui.visitorNucleus?.value || "";
  const contact = ui.visitorContact?.value?.trim() || "";
  const notes = ui.visitorNotes?.value?.trim() || "";
  const birthDate = el("visitorBirthDate")?.value || "";

  if (!name || !nucleus) {
    alert("Preencha ao menos nome e núcleo do visitante para cadastrar como aluno.");
    return;
  }

  setActiveTab("tab-gestao");

  if (el("studentName")) el("studentName").value = name;
  if (el("studentNucleus")) el("studentNucleus").value = nucleus;
  hydrateStudentScheduleOptions();
  if (el("studentContact")) el("studentContact").value = contact;
  if (el("studentBirthDate")) el("studentBirthDate").value = birthDate;
  if (el("studentRequirements")) {
    el("studentRequirements").value = `Cadastro vindo de visitante${notes ? " • " + notes : ""}`;
  }

  pushNucleusLog(nucleus, "Visitante → Cadastro", `Pré-preenchido para matrícula: ${name}`, user);
  persist();

  // foco em responsável
  el("guardianName")?.focus();
}

/* ========= VISITANTES ========= */
function onAddVisitor(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const name = ui.visitorName?.value?.trim() || "";
  const nucleus = ui.visitorNucleus?.value || "";
  const date = ui.visitorDate?.value || "";
  if (!name || !nucleus || !date) return;

  // tenta achar campo de nascimento no HTML (se você adicionou)
  const birthDateNode =
    el("visitorBirthDate") ||
    ui.visitorForm?.querySelector('input[name="visitorBirthDate"]') ||
    ui.visitorForm?.querySelector('input[data-visitor-birth]');

  const visitor = {
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    name,
    nucleus,
    date,
    birthDate: birthDateNode?.value || "",
    contact: ui.visitorContact?.value?.trim() || "",
    notes: ui.visitorNotes?.value?.trim() || "",
    visits: [{ date, ts: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  };

  state.visitors.unshift(visitor);
  pushNucleusLog(nucleus, "Visitante", `Visitante cadastrado: ${name}`, user);

  persist();
  ui.visitorForm.reset();
  renderVisitors();
}

function registerVisitorVisit(visitorId) {
  const user = currentUser();
  const visitor = getProjectVisitors().find((v) => v.id === visitorId);
  if (!visitor) return;

  const today = isoToday();
  if (!Array.isArray(visitor.visits)) visitor.visits = [];
  visitor.visits.unshift({ date: today, ts: new Date().toISOString() });
  visitor.date = today;

  pushNucleusLog(visitor.nucleus, "Visita", `Visita registrada: ${visitor.name}`, user);
  persist();
  renderVisitors();
}

function convertVisitorToStudent(visitorId) {
  const user = currentUser();
  if (!user || (user.role !== "gestao" && user.role !== "admin")) return;

  const v = getProjectVisitors().find((x) => x.id === visitorId);
  if (!v) return;

  setActiveTab("tab-gestao");

  // preenche form de aluno
  el("studentName").value = v.name || "";
  el("studentNucleus").value = v.nucleus || getVisibleNuclei()[0] || "";
  hydrateStudentScheduleOptions();
  el("studentContact").value = v.contact || "";
  if (el("studentBirthDate")) el("studentBirthDate").value = v.birthDate || "";
  if (el("studentRequirements")) el("studentRequirements").value = `Convertido de visitante em ${formatDateLabel(isoToday())}`;
  if (el("guardianName")) el("guardianName").focus();

  pushNucleusLog(v.nucleus, "Conversão visitante", `Visitante enviado para matrícula: ${v.name}`, user);
  persist();
}

function renderVisitors() {
  if (!ui.visitorsList || !ui.visitorsBadge) return;

  const list = getProjectVisitors().slice(0, 50);
  ui.visitorsBadge.textContent = String(getProjectVisitors().length);
  ui.visitorsList.innerHTML = "";

  if (!list.length) {
    ui.visitorsList.innerHTML = `<li class="empty">Sem visitantes cadastrados.</li>`;
    return;
  }

  list.forEach((v) => {
    const li = document.createElement("li");
    li.style.listStyle = "none";
    li.style.border = "1px solid var(--border,#ead9dc)";
    li.style.borderRadius = "12px";
    li.style.padding = ".6rem";
    li.style.marginBottom = ".4rem";
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap">
        <div>
          <strong>${escapeHtml(v.name)}</strong> • ${escapeHtml(v.nucleus)}
          <div class="muted" style="font-size:.86rem;margin-top:.2rem">
            Última visita: ${formatDateLabel(v.date)}
            ${v.birthDate ? " • Nascimento: " + escapeHtml(formatDateLabel(v.birthDate)) : ""}
            ${v.contact ? " • " + escapeHtml(v.contact) : ""}
            ${v.notes ? " • " + escapeHtml(v.notes) : ""}
          </div>
          <div class="muted" style="font-size:.82rem">
            Visitas registradas: ${Array.isArray(v.visits) ? v.visits.length : 1}
          </div>
        </div>
        <div style="display:flex;gap:.4rem;align-items:flex-start;flex-wrap:wrap">
          <button type="button" class="small-btn" data-visit="${v.id}">Registrar visita</button>
          <button type="button" class="ghost" data-convert="${v.id}">Converter em aluno</button>
        </div>
      </div>
    `;
    li.querySelector(`[data-visit="${v.id}"]`)?.addEventListener("click", () => registerVisitorVisit(v.id));
    li.querySelector(`[data-convert="${v.id}"]`)?.addEventListener("click", () => convertVisitorToStudent(v.id));
    ui.visitorsList.appendChild(li);
  });
}
