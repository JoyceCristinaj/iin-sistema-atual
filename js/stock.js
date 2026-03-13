"use strict";

/* ========= KIT / STOCK ========= */
function labelStockCategory(categoryKey) {
  return STOCK_CATEGORIES.find((i) => i.key === categoryKey)?.label || categoryKey;
}
function stockCategoryIconMarkup(categoryKey) {
  const icons = {
    camiseta: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M8 5.5L10.5 4H13.5L16 5.5L19 7L17.2 10L15 8.8V20H9V8.8L6.8 10L5 7L8 5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    `,
    shorts: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 4H18L17 20H13L12 13L11 20H7L6 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    `,
    kimono: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M8 4H16L19 9L15 12V20H9V12L5 9L8 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10.5 4L12 9L13.5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
    bandagem: `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="16" height="8" rx="4" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9 10.5H9.01M12 10.5H12.01M15 10.5H15.01M9 13.5H9.01M12 13.5H12.01M15 13.5H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `,
    protetor_bucal: `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 8.5C6 6.6 7.6 5 9.5 5H14.5C16.4 5 18 6.6 18 8.5V11C18 15.2 15.2 18.8 12 20C8.8 18.8 6 15.2 6 11V8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M9 10.5V12.5M15 10.5V12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
  };
  return icons[categoryKey] || icons.camiseta;
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
  if (allowed.length > 1) {
    const optAll = document.createElement("option");
    optAll.value = "__kit_completo__";
    optAll.textContent = "Entregar kit completo";
    select.appendChild(optAll);
  }
  allowed.forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${labelStockCategory(k)}${student.uniform?.items?.[k] ? " (já entregue)" : ""}`;
    select.appendChild(opt);
  });

  const stack = document.createElement("div");
  stack.className = "item-delivery-stack";
  stack.appendChild(p);
  stack.appendChild(select);
  container.appendChild(stack);
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
      const selectedItem = controls?.select?.value || "";
      if (!selectedItem) return;

      const previousItems = { ...(student.uniform.items || createEmptyDeliveryItems()) };
      const next = { ...previousItems };

      if (selectedItem === "__kit_completo__") {
        getAllowedItemsByModality(student.modality).forEach((key) => {
          next[key] = true;
        });
      } else {
        next[selectedItem] = true;
      }

      applyUniformUpdate(student, next);

      const user = currentUser();
      const deliveredNow = getAllowedItemsByModality(student.modality)
        .filter((key) => !previousItems[key] && student.uniform.items?.[key]);

      if (deliveredNow.length) {
        const deliveredLabel = selectedItem === "__kit_completo__"
          ? `Kit completo (${deliveredNow.map(labelStockCategory).join(", ")})`
          : labelStockCategory(selectedItem);
        pushNucleusLog(student.nucleus, "Kit", `Entregue ${deliveredLabel} para ${student.name}`, user);
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
    card.innerHTML = `
      <div class="stock-card-head">
        <span class="stock-card-icon" aria-hidden="true">${stockCategoryIconMarkup(item.key)}</span>
        <div class="stock-card-copy">
          <h4>${escapeHtml(item.label)}</h4>
          <p>${totals[item.key] || 0} unidades</p>
        </div>
      </div>
    `;
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

