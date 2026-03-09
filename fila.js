"use strict";

/* =========================
   FILA DE ESPERA (Inscrições Online) — Admin
   Requer no HTML:
   - #btnAtualizarFila, #filaStatus, #tabelaFilaBody
   - #filaBusca, #filaFiltroStatus, #filaArquivados, #btnApiKeyFila
   - #totalMes, #confirmadas, #aguardando, #semResposta
   - Modal: #filaModal, #filaModalClose, #filaModalTitle, #filaModalBody
========================= */

(function () {
  const $ = (id) => document.getElementById(id);

  const INSCRICAO_API_URL = "http://localhost:3000/api/inscricoes";
  const INSCRICAO_API_KEY_STORAGE = "iin_api_key_admin";

  function getApiKey() {
    return localStorage.getItem(INSCRICAO_API_KEY_STORAGE) || "";
  }

  function setApiKey(value) {
    const v = String(value || "").trim();
    if (v) {
      localStorage.setItem(INSCRICAO_API_KEY_STORAGE, v);
    } else {
      localStorage.removeItem(INSCRICAO_API_KEY_STORAGE);
    }
  }

  async function readJsonSafe(res) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Resposta inválida do servidor: ${text.slice(0, 300)}`);
    }
  }

  async function apiGetLocal(action, params = {}) {
    const key = getApiKey();
    const endpoint = action === "get" ? "get" : "list";

    const url = new URL(`${INSCRICAO_API_URL}/${endpoint}`);
    if (key) url.searchParams.set("api_key", key);

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        url.searchParams.set(k, String(v));
      }
    });

    const res = await fetch(url.toString());
    const data = await readJsonSafe(res);

    if (!res.ok) {
      throw new Error(data?.error || data?.erro || `Erro HTTP ${res.status}`);
    }

    return data;
  }

  async function apiPostLocal(body) {
    const key = getApiKey();
    const payload = Object.assign({ api_key: key }, body);

    const res = await fetch(`${INSCRICAO_API_URL}/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await readJsonSafe(res);

    if (!res.ok) {
      throw new Error(data?.error || data?.erro || `Erro HTTP ${res.status}`);
    }

    return data;
  }

  const apiGet = apiGetLocal;
  const apiPost = apiPostLocal;

  function fmtDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function calcAge(birthIso) {
    if (!birthIso) return "";
    const d = new Date(birthIso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return String(age);
  }

  function normalizeStatusValue(s) {
    const v = String(s || "").toLowerCase().trim();
    return v || "novo";
  }

  function statusLabel(s) {
    const v = normalizeStatusValue(s);
    if (v === "confirmou") return "Confirmou";
    if (v === "contatado") return "Contatado";
    if (v === "matriculado") return "Aluno fixo";
    if (v === "arquivado") return "Desistiu";
    return "Aguardando";
  }

  function statusIcon(s) {
    const v = normalizeStatusValue(s);
    if (v === "confirmou" || v === "matriculado") return "●";
    if (v === "contatado") return "◔";
    if (v === "arquivado") return "◌";
    return "◍";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openModal(title, html) {
    const modal = $("filaModal");
    const t = $("filaModalTitle");
    const body = $("filaModalBody");
    if (!modal || !t || !body) return;

    t.textContent = title || "Detalhes";
    body.innerHTML = html || "";
    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = $("filaModal");
    if (modal) modal.classList.add("hidden");
    const body = $("filaModalBody");
    if (body) body.innerHTML = "";
  }

  function ensureModalEventsOnce() {
    const closeBtn = $("filaModalClose");
    const modal = $("filaModal");

    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", closeModal);
    }

    if (modal && !modal.dataset.bound) {
      modal.dataset.bound = "1";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  function setStatusText(msg) {
    const el = $("filaStatus");
    if (el) el.textContent = msg || "";
  }

  function getFilters() {
    const q = ($("filaBusca")?.value || "").trim().toLowerCase();
    const st = ($("filaFiltroStatus")?.value || "").trim().toLowerCase();
    const showArchived = ($("filaArquivados")?.value || "0") === "1";
    return { q, st, showArchived };
  }

  function applyFilters(items) {
    const { q, st, showArchived } = getFilters();

    return (items || []).filter((it) => {
      const status = normalizeStatusValue(it.status);

      if (!showArchived && status === "arquivado") return false;
      if (st && status !== st) return false;

      if (q) {
        const hay = [
          it.aluno_nome,
          it.resp_nome,
          it.resp_whatsapp,
          it.nucleo,
          it.modalidade,
          it.dia,
          it.horario,
          it.id_inscricao,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" | ");

        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }

  function computeMetrics(items) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let totalMes = 0;
    let confirmadas = 0;
    let aguardando = 0;
    let semResposta = 0;

    (items || []).forEach((it) => {
      const status = normalizeStatusValue(it.status);
      const created = new Date(it.created_at || "");
      const inThisMonth =
        !Number.isNaN(created.getTime()) &&
        created.getMonth() === month &&
        created.getFullYear() === year;

      if (inThisMonth) totalMes++;

      if (status === "confirmou" || status === "matriculado") {
        confirmadas++;
      } else if (status === "contatado") {
        aguardando++;
      } else if (status === "novo") {
        semResposta++;
      } else if (status === "arquivado") {
        // não conta
      } else {
        aguardando++;
      }
    });

    if ($("totalMes")) $("totalMes").textContent = String(totalMes);
    if ($("confirmadas")) $("confirmadas").textContent = String(confirmadas);
    if ($("aguardando")) $("aguardando").textContent = String(aguardando);
    if ($("semResposta")) $("semResposta").textContent = String(semResposta);
  }

  function makeWhatsappLink(phone, message) {
    const num = String(phone || "").replace(/\D/g, "");
    if (!num) return "";
    const text = encodeURIComponent(message || "");
    return `https://wa.me/55${num}?text=${text}`;
  }

  function rowActionsHtml(item) {
    const id = String(item.id_inscricao || "");
    const phone = item.resp_whatsapp || "";
    const aluno = item.aluno_nome || "Aluno";
    const msg = `Olá! Aqui é do Instituto Irmãos Nogueira. Recebemos a inscrição de ${aluno}. Podemos confirmar o interesse?`;
    const wpp = makeWhatsappLink(phone, msg);
    const status = normalizeStatusValue(item.status);

    const podeConverter = status === "confirmou" || status === "contatado";

    return `
      <div class="fila-actions premium">
        <button type="button" class="ghost action-btn" data-fila-action="ver" data-id="${escapeHtml(id)}" title="Ver detalhes">
          <span class="action-icon">👁</span>
          <span>Ver</span>
        </button>

        <button type="button" class="ghost action-btn" data-fila-action="editar" data-id="${escapeHtml(id)}" title="Editar inscrição">
          <span class="action-icon">✎</span>
          <span>Editar</span>
        </button>

        ${wpp ? `
          <a class="ghost fila-link-btn action-btn whatsapp-btn" href="${wpp}" target="_blank" rel="noopener" title="Abrir WhatsApp">
            <span class="action-icon">✆</span>
            <span>WhatsApp</span>
          </a>
        ` : ""}

        <button type="button" class="ghost action-btn" data-fila-action="status" data-status="contatado" data-id="${escapeHtml(id)}" title="Marcar como contatado">
          <span class="action-icon">◔</span>
          <span>Contatado</span>
        </button>

        <button type="button" class="ghost action-btn success-soft" data-fila-action="status" data-status="confirmou" data-id="${escapeHtml(id)}" title="Marcar como confirmou">
          <span class="action-icon">✓</span>
          <span>Confirmou</span>
        </button>

        ${podeConverter ? `
          <button type="button" class="primary action-btn convert-btn" data-fila-action="convert" data-id="${escapeHtml(id)}" title="Cadastrar aluno fixo">
            <span class="action-icon">＋</span>
            <span>Cadastrar aluno</span>
          </button>
        ` : ""}

        <button type="button" class="warn action-btn desist-btn" data-fila-action="desistiu" data-id="${escapeHtml(id)}" title="Marcar como desistiu">
          <span class="action-icon">✕</span>
          <span>Desistiu</span>
        </button>
      </div>
    `;
  }

  function renderTable(items) {
    const body = $("tabelaFilaBody");
    if (!body) return;

    if (!items || !items.length) {
      body.innerHTML = `
        <tr>
          <td colspan="8" style="padding:14px; opacity:.75">Nenhuma inscrição encontrada.</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = items
      .map((it) => {
        const created = fmtDate(it.created_at);
        const aluno = escapeHtml(it.aluno_nome || "-");
        const idade = escapeHtml(calcAge(it.aluno_nascimento || ""));
        const resp = escapeHtml(it.resp_nome || "-");
        const wpp = escapeHtml(it.resp_whatsapp || "-");
        const nucleo = escapeHtml(it.nucleo || "-");
        const normalizedStatus = normalizeStatusValue(it.status);
        const status = `
          <span class="fila-status-badge fila-status-${normalizedStatus}">
            <span class="fila-status-dot">${statusIcon(it.status)}</span>
            ${statusLabel(it.status)}
          </span>
        `;

        return `
          <tr>
            <td>${created}</td>
            <td>${aluno}</td>
            <td>${idade}</td>
            <td>${resp}</td>
            <td>${wpp}</td>
            <td>${nucleo}</td>
            <td>${status}</td>
            <td>${rowActionsHtml(it)}</td>
          </tr>
        `;
      })
      .join("");
  }

  async function showDetails(id) {
    const res = await apiGet("get", { id });
    if (!res || !res.ok) throw new Error(res?.error || "Não foi possível carregar.");

    const it = res.item || {};
    const rows = Object.entries(it)
      .filter(([k]) => k !== "api_key")
      .map(([k, v]) => {
        const key = escapeHtml(k);
        const val = escapeHtml(v);
        return `<tr><td style="padding:6px 8px;opacity:.75">${key}</td><td style="padding:6px 8px">${val}</td></tr>`;
      })
      .join("");

    openModal(
      `Ficha completa • ${escapeHtml(it.aluno_nome || "")}`,
      `<div class="panel-lite" style="padding:12px">
         <table style="width:100%; border-collapse:collapse"><tbody>${rows}</tbody></table>
       </div>`
    );
  }

  async function showEdit(id) {
    const res = await apiGet("get", { id });
    if (!res || !res.ok) throw new Error(res?.error || "Não foi possível carregar.");

    const it = res.item || {};
    const statusNow = normalizeStatusValue(it.status);

    openModal("Editar inscrição", `
      <form id="filaEditForm" class="grid-form two" style="padding:10px">
        <input type="hidden" name="id" value="${escapeHtml(id)}" />

        <label>Aluno
          <input name="aluno_nome" type="text" value="${escapeHtml(it.aluno_nome || "")}" />
        </label>

        <label>Nascimento
          <input name="aluno_nascimento" type="date" value="${escapeHtml(String(it.aluno_nascimento || "").slice(0,10))}" />
        </label>

        <label>Responsável
          <input name="resp_nome" type="text" value="${escapeHtml(it.resp_nome || "")}" />
        </label>

        <label>WhatsApp
          <input name="resp_whatsapp" type="text" value="${escapeHtml(it.resp_whatsapp || "")}" />
        </label>

        <label>Núcleo
          <input name="nucleo" type="text" value="${escapeHtml(it.nucleo || "")}" />
        </label>

        <label>Modalidade
          <input name="modalidade" type="text" value="${escapeHtml(it.modalidade || "")}" />
        </label>

        <label>Dia
          <input name="dia" type="text" value="${escapeHtml(it.dia || "")}" />
        </label>

        <label>Horário
          <input name="horario" type="text" value="${escapeHtml(it.horario || "")}" />
        </label>

        <label>Status
          <select name="status">
            ${["novo", "contatado", "confirmou", "matriculado", "arquivado"]
              .map((s) => {
                const sel = statusNow === s ? "selected" : "";
                return `<option value="${s}" ${sel}>${s}</option>`;
              })
              .join("")}
          </select>
        </label>

        <label>Obs interna
          <input name="obs_interna" type="text" value="${escapeHtml(it.obs_interna || "")}" />
        </label>

        <div class="toolbar" style="grid-column:1/-1; justify-content:flex-end; gap:10px">
          <button type="button" class="ghost" id="filaEditCancel">Cancelar</button>
          <button type="submit" class="primary">Salvar</button>
        </div>
      </form>
    `);

    const cancel = $("filaEditCancel");
    if (cancel) cancel.addEventListener("click", closeModal);

    const form = document.getElementById("filaEditForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
          const fd = new FormData(form);
          const patch = {};

          fd.forEach((v, k) => {
            if (k === "id") return;
            patch[k] = String(v || "");
          });

          const rowId = String(fd.get("id") || "");
          const out = await apiPost({ action: "update", id: rowId, patch });

          if (!out || !out.ok) {
            alert(out?.error || "Não foi possível salvar.");
            return;
          }

          closeModal();
          await loadFilaAdmin();
        } catch (err) {
          alert(String(err?.message || err || "Erro ao salvar"));
        }
      });
    }
  }

  async function setStatus(id, status) {
    const patch = {
      status,
      ultimo_contato_em: new Date().toISOString(),
    };

    const out = await apiPost({ action: "update", id: String(id), patch });
    if (!out || !out.ok) throw new Error(out?.error || "Falha ao atualizar status.");
  }

  async function marcarDesistiu(id) {
    const ok = confirm("Deseja marcar esta inscrição como desistiu?");
    if (!ok) return;

    const patch = {
      status: "arquivado",
      motivo_status: "desistiu",
      arquivado_em: new Date().toISOString(),
      ultimo_contato_em: new Date().toISOString(),
    };

    const out = await apiPost({ action: "update", id: String(id), patch });
    if (!out || !out.ok) {
      throw new Error(out?.error || "Falha ao marcar como desistiu.");
    }
  }

  async function converterEmAluno(id) {
  const ok = confirm(
    "Deseja cadastrar este inscrito como aluno fixo?\n\nUse essa opção somente depois da confirmação e assinatura do termo."
  );
  if (!ok) return;

  const detalhe = await apiGet("get", { id: String(id) });
  if (!detalhe || !detalhe.ok || !detalhe.item) {
    throw new Error(detalhe?.error || "Não foi possível carregar os dados da inscrição.");
  }

  const inscricao = detalhe.item;

  const out = await apiPost({
    action: "convert",
    id: String(id),
    extras: {
      status_aluno: "ativo",
    },
  });

  if (!out || !out.ok) {
    throw new Error(out?.error || "Falha ao converter em aluno.");
  }

  if (typeof window.converterInscricaoEmAlunoLocal === "function") {
    const localResult = window.converterInscricaoEmAlunoLocal(inscricao);

    if (localResult?.alreadyExists) {
      alert("Inscrição convertida. Este aluno já estava cadastrado na lista local.");
      return;
    }
  }

  alert("Aluno cadastrado com sucesso e incluído na lista de alunos.");
}

  let filaCache = [];

  async function loadFilaAdmin() {
    try {
      setStatusText("Atualizando...");
      ensureModalEventsOnce();

      const key = getApiKey();
      if (!key) {
        setStatusText("Defina a API Key para carregar as inscrições.");
        renderTable([]);
        computeMetrics([]);
        return;
      }

      const res = await apiGet("list");

      if (!res || !res.ok) {
        setStatusText(res?.error || res?.erro || "Erro ao carregar.");
        renderTable([]);
        computeMetrics([]);
        return;
      }

      filaCache = Array.isArray(res.items) ? res.items : [];

      const filtered = applyFilters(filaCache);
      computeMetrics(filtered);
      renderTable(filtered);

      setStatusText(`Atualizado. Total: ${filtered.length}`);
    } catch (err) {
      console.error("Erro em loadFilaAdmin:", err);
      setStatusText(String(err?.message || err || "Erro ao carregar."));
      renderTable([]);
      computeMetrics([]);
    }
  }

  function initFilaAdmin() {
    const btnAtualizar = $("btnAtualizarFila");
    const btnApi = $("btnApiKeyFila");
    const busca = $("filaBusca");
    const filtro = $("filaFiltroStatus");
    const arquivados = $("filaArquivados");

    if (btnAtualizar && !btnAtualizar.dataset.bound) {
      btnAtualizar.dataset.bound = "1";
      btnAtualizar.addEventListener("click", () => loadFilaAdmin());
    }

    if (btnApi && !btnApi.dataset.bound) {
      btnApi.dataset.bound = "1";
      btnApi.addEventListener("click", async () => {
        try {
          const current = getApiKey();
          const key = prompt("Cole a API Key do Apps Script:", current || "");
          if (key === null) return;

          setApiKey(key);
          await loadFilaAdmin();
        } catch (err) {
          console.error("Erro ao definir API Key:", err);
          alert(String(err?.message || err || "Erro ao salvar API Key"));
        }
      });
    }

    const reRender = () => {
      const filtered = applyFilters(filaCache);
      computeMetrics(filtered);
      renderTable(filtered);
      setStatusText(`Filtrado. Total: ${filtered.length}`);
    };

    if (busca && !busca.dataset.bound) {
      busca.dataset.bound = "1";
      busca.addEventListener("input", reRender);
    }

    if (filtro && !filtro.dataset.bound) {
      filtro.dataset.bound = "1";
      filtro.addEventListener("change", reRender);
    }

    if (arquivados && !arquivados.dataset.bound) {
      arquivados.dataset.bound = "1";
      arquivados.addEventListener("change", reRender);
    }

    const tableBody = $("tabelaFilaBody");
    if (tableBody && !tableBody.dataset.bound) {
      tableBody.dataset.bound = "1";
      tableBody.addEventListener("click", async (e) => {
        const el = e.target.closest("[data-fila-action]");
        if (!el) return;

        const action = el.getAttribute("data-fila-action");
        const id = String(el.getAttribute("data-id") || "");
        const st = String(el.getAttribute("data-status") || "");

        if (!id) {
          alert("ID inválido. Clique em Atualizar e tente novamente.");
          return;
        }

        try {
          if (action === "ver") {
            await showDetails(id);
          } else if (action === "editar") {
            await showEdit(id);
          } else if (action === "status") {
            await setStatus(id, st);
            await loadFilaAdmin();
          } else if (action === "desistiu") {
            await marcarDesistiu(id);
            await loadFilaAdmin();
          } else if (action === "convert") {
            await converterEmAluno(id);
            await loadFilaAdmin();
          }
        } catch (err) {
          alert(String(err?.message || err || "Erro"));
        }
      });
    }
  }

  window.initFilaAdmin = initFilaAdmin;
  window.loadFilaAdmin = loadFilaAdmin;
  window.setFilaApiKey = setApiKey;
})();