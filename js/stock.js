"use strict";

/* ========= KIT / STOCK ========= */
function labelStockCategory(categoryKey) {
  return STOCK_CATEGORIES.find((i) => i.key === categoryKey)?.label || categoryKey;
}
function getAllowedItemsByModality(modality) {
  return MODALITY_ITEMS[modality] || [];
}
function normalizeDeliveryItems(student) {
  const allowed = getAllowedItemsByModality(student.modality);
  const base = createEmptyDeliveryItems();
  const saved = student.uniform?.items || {};
  allowed.forEach((k) => (base[k] = Boolean(saved[k])));
  return base;
}
function isKitDelivered(student) {
  const allowed = getAllowedItemsByModality(student.modality);
  if (!allowed.length) return false;
  const items = student.uniform?.items || normalizeDeliveryItems(student);
  return allowed.every((k) => items[k] === true);
}
function formatAllowedItems(modality) {
  const items = getAllowedItemsByModality(modality);
  return items.length ? items.map(labelStockCategory).join(", ") : "Sem itens configurados";
}

/* ========= UNIFORMES / ESTOQUE ========= */
function renderItemDeliveryControls(container, student) {
  container.innerHTML = "";
  const allowed = getAllowedItemsByModality(student.modality);
  if (!allowed.length) {
    container.textContent = "Sem itens configurados";
    return null;
  }

  const delivered = allowed.filter((k) => student.uniform?.items?.[k]);
  const p = document.createElement("p");
  p.className = "item-delivery-current";
  p.textContent = delivered.length ? `Recebido: ${delivered.map(labelStockCategory).join(", ")}` : "Recebido: nenhum item";

  const select = document.createElement("select");
  select.className = "item-delivery-select";
  select.innerHTML = `<option value="">Selecionar item entregue</option>`;
  allowed.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${labelStockCategory(k)}${student.uniform?.items?.[k] ? " (já entregue)" : ""}`;
    select.appendChild(opt);
  });

  container.appendChild(p);
  container.appendChild(select);
  return { select };
}

function applyUniformUpdate(student, nextItems) {
  const stockByNucleus = getProjectStock();
  const nucStock =
    stockByNucleus[student.nucleus] ||
    (stockByNucleus[student.nucleus] = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0])));

  const allowed = getAllowedItemsByModality(student.modality);
  const prev = student.uniform.items || createEmptyDeliveryItems();
  const merged = { ...prev, ...nextItems };

  for (const key of allowed) {
    const was = !!prev[key];
    const will = !!merged[key];

    if (!was && will) {
      if ((nucStock[key] || 0) <= 0) {
        merged[key] = false;
        continue;
      }
      nucStock[key] = Math.max(0, (nucStock[key] || 0) - 1);
    }
    if (was && !will) {
      nucStock[key] = (nucStock[key] || 0) + 1;
    }
  }

  student.uniform.items = merged;
  persist();
  render();
}

function renderUniformTable() {
  if (!ui.uniformTableBody) return;
  const user = currentUser();
  if (!user) return;

  const canDelete = user.role === "admin";
  const students = getProjectStudents().filter((s) =>
    state.uniformFilter === "todos" ? true : s.nucleus === state.uniformFilter
  );

  ui.uniformTableBody.innerHTML = "";
  if (!students.length) {
    ui.uniformTableBody.innerHTML = `<tr><td colspan="7" class="empty">Sem alunos para o filtro.</td></tr>`;
    return;
  }

  students.forEach((student) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(student.name)}</td>
      <td>${escapeHtml(student.nucleus)}</td>
      <td>${escapeHtml(student.modality || "-")}</td>
      <td>${escapeHtml(formatAllowedItems(student.modality))}</td>
      <td data-role="items"></td>
      <td><button class="small-btn" type="button" data-save="${student.id}">Salvar</button></td>
      <td><button class="ghost" type="button" data-del="${student.id}" ${canDelete ? "" : "disabled"}>Excluir</button></td>
    `;

    const itemsCell = tr.querySelector('[data-role="items"]');
    const controls = renderItemDeliveryControls(itemsCell, student);

    tr.querySelector(`[data-save="${student.id}"]`)?.addEventListener("click", () => {
      const next = { ...(student.uniform.items || createEmptyDeliveryItems()) };
      if (controls?.select?.value) next[controls.select.value] = true;
      applyUniformUpdate(student, next);

      const user = currentUser();
      if (controls?.select?.value) {
        pushNucleusLog(student.nucleus, "Kit", `Entregue ${labelStockCategory(controls.select.value)} para ${student.name}`, user);
        persist();
      }
    });

    tr.querySelector(`[data-del="${student.id}"]`)?.addEventListener("click", () => {
      if (!canDelete) return;
      const user = currentUser();
      pushNucleusLog(student.nucleus, "Aluno excluído", `Exclusão: ${student.name}`, user);
      state.students = state.students.filter((x) => x.id !== student.id);
      persist();
      render();
    });

    ui.uniformTableBody.appendChild(tr);
  });
}

function renderStock() {
  if (!ui.stockView) return;
  ui.stockView.innerHTML = "";

  const totals = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0]));
  Object.values(getProjectStock()).forEach((nucStock) => {
    STOCK_CATEGORIES.forEach((i) => {
      totals[i.key] += Number(nucStock?.[i.key] || 0);
    });
  });

  STOCK_CATEGORIES.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stock-card";
    card.innerHTML = `<h4>${escapeHtml(item.label)}</h4><p>${totals[item.key] || 0} unidades</p>`;
    ui.stockView.appendChild(card);
  });
}

function onAdjustStock(event) {
  event.preventDefault();
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const itemKey = el("stockSize")?.value;
  const delta = Number(el("stockDelta")?.value || 0);
  if (!itemKey || !Number.isFinite(delta)) return;

  // ajuste simples no 1º núcleo do projeto (como estava)
  const nucleus = getVisibleNuclei()[0];
  const stockByNucleus = getProjectStock();
  if (!stockByNucleus[nucleus]) stockByNucleus[nucleus] = Object.fromEntries(STOCK_CATEGORIES.map((i) => [i.key, 0]));
  stockByNucleus[nucleus][itemKey] = Math.max(0, Number(stockByNucleus[nucleus][itemKey] || 0) + delta);

  pushNucleusLog(nucleus, "Estoque", `Ajuste ${labelStockCategory(itemKey)}: ${delta >= 0 ? "+" : ""}${delta}`, user);

  persist();
  render();
}

