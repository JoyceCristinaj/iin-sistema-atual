"use strict";

// Helper: alterna visibilidade da senha + troca ícone
function togglePasswordVisibility(rowEl, userId) {
  const inp = rowEl.querySelector(`[data-pass="${userId}"]`);
  const iconWrap = rowEl.querySelector(`[data-eye-icon="${userId}"]`);
  if (!inp) return;

  const show = inp.type === "password";
  inp.type = show ? "text" : "password";

  if (iconWrap) iconWrap.innerHTML = show ? ICON_EYE_CLOSED : ICON_EYE_OPEN;
}

// ✅ ESSA FUNÇÃO PRECISA EXISTIR GLOBAL
function currentUser() {
  if (!state.sessionUserId) return null;
  return getProjectUsers().find((u) => u.id === state.sessionUserId) || null;
}

/* ========= AUTH ========= */
function onLogin(event) {
  event.preventDefault();
  const username = ui.loginUsername?.value?.trim() || "";
  const password = ui.loginPassword?.value || "";
  const projectKey = ui.loginProject?.value || state.currentProjectKey;
  state.currentProjectKey = projectKey;

  const user = getProjectUsers(projectKey).find((u) => u.username === username && u.password === password);
  if (!user) {
    if (ui.loginMessage) {
      ui.loginMessage.textContent = "Usuário ou senha inválidos.";
      ui.loginMessage.classList.remove("report-status-success");
    }
    return;
  }

  state.sessionUserId = user.id;
  state.activeTab = "tab-dashboard";
  persistSession();

  if (ui.loginMessage) {
    ui.loginMessage.textContent = "Acesso liberado.";
    ui.loginMessage.classList.add("report-status-success");
  }

  hydrateNucleusSelects();
  hydrateStudentScheduleOptions();
  hydrateStudentModalityOptions();
  render();
}

function onLogout() {
  state.sessionUserId = null;
  persistSession();
  render();
}

/* ========= ADMIN USUÁRIOS ========= */
function onCreateUser(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const username = el("newUsername")?.value?.trim() || "";
  const password = el("newPassword")?.value || "";
  const role = el("newRole")?.value || "professor";
  const nucleus = el("newNucleus")?.value || "";

  if (!username || !password) return;
  if (getProjectUsers().some((u) => u.username === username)) {
    alert("Esse usuário já existe.");
    return;
  }

  state.users.push({
    id: crypto.randomUUID(),
    project: state.currentProjectKey,
    username,
    password,
    role,
    nucleus: role === "professor" ? nucleus : null,
  });

  persist();
  ui.userForm?.reset();
  renderUsersTable();
}

function renderUsersTable() {
  if (!ui.usersTableBody) return;
  const admin = currentUser();
  if (!admin || admin.role !== "admin") return;

  ui.usersTableBody.innerHTML = "";

  getProjectUsers().forEach((u) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(labelRole(u.role))}</td>
      <td>${escapeHtml(u.nucleus || "-")}</td>

      <td>
        <div class="pass-wrap">
          <input type="password" value="${escapeHtml(u.password)}" data-pass="${u.id}" />

          <button
            type="button"
            class="ghost eye-btn"
            data-eye="${u.id}"
            aria-label="Mostrar/ocultar senha"
            title="Mostrar/ocultar senha"
          >
            <span class="eye-icon" data-eye-icon="${u.id}">${ICON_EYE_OPEN}</span>
          </button>
        </div>
      </td>

      <td>
        <button type="button" class="small-btn" data-save="${u.id}">Salvar senha</button>
        <button type="button" class="ghost" data-del="${u.id}" ${u.id === admin.id ? "disabled" : ""}>Excluir</button>
      </td>
    `;

    // ✅ alterna senha + troca ícone
    tr.querySelector(`[data-eye="${u.id}"]`)?.addEventListener("click", () => {
      const inp = tr.querySelector(`[data-pass="${u.id}"]`);
      const iconWrap = tr.querySelector(`[data-eye-icon="${u.id}"]`);
      if (!inp) return;

      const show = inp.type === "password";
      inp.type = show ? "text" : "password";

      if (iconWrap) {
        iconWrap.innerHTML = show ? ICON_EYE_CLOSED : ICON_EYE_OPEN;
      }
    });

    // salvar senha
    tr.querySelector(`[data-save="${u.id}"]`)?.addEventListener("click", () => {
      const newPass = tr.querySelector(`[data-pass="${u.id}"]`)?.value || "";
      u.password = newPass;
      persist();
    });

    // excluir usuário
    tr.querySelector(`[data-del="${u.id}"]`)?.addEventListener("click", () => {
      if (u.id === admin.id) return;
      state.users = state.users.filter((x) => x.id !== u.id);
      persist();
      renderUsersTable();
    });

    ui.usersTableBody.appendChild(tr);
  });
}

