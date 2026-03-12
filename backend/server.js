const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { sql, getPool } = require("./db");

// Se seu Node for menor que 18, descomente as 2 linhas abaixo
// e rode: npm install node-fetch
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = Number(process.env.PORT || 3000);

const INSCRICAO_GAS_URL =
  process.env.INSCRICAO_GAS_URL ||
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";

const INSCRICAO_API_KEY = process.env.INSCRICAO_API_KEY || "";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: "text/plain", limit: "2mb" }));

function normalizeError(err) {
  return String(err?.message || err || "Erro desconhecido");
}

async function readJsonFromResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "Resposta não veio em JSON válido",
      status: response.status,
      raw: text,
    };
  }
}

function buildGasUrl(action, params = {}) {
  const url = new URL(INSCRICAO_GAS_URL);
  url.searchParams.set("action", action);

  if (INSCRICAO_API_KEY) {
    url.searchParams.set("api_key", INSCRICAO_API_KEY);
  }

  Object.entries(params).forEach(([k, v]) => {
    if (
      k !== "action" &&
      k !== "api_key" &&
      v !== undefined &&
      v !== null &&
      String(v).trim() !== ""
    ) {
      url.searchParams.set(k, String(v));
    }
  });

  return url.toString();
}

/* =========================
   HEALTH (teste conexão)
========================= */
app.get("/api/health", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        SUSER_SNAME() AS usuario,
        DB_NAME() AS banco,
        GETDATE() AS agora
    `);

    return res.json({ ok: true, info: result.recordset[0] });
  } catch (err) {
    console.error("Erro /api/health:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

/* =========================
   LISTAS AUXILIARES (alunos)
========================= */

// NÚCLEOS
app.get("/api/nucleos", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, projeto_id, nome
      FROM dbo.nucleos
      ORDER BY nome
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Erro /api/nucleos:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

// MODALIDADES
app.get("/api/modalidades", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, nome
      FROM dbo.modalidades
      ORDER BY nome
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Erro /api/modalidades:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

// TURMAS
app.get("/api/turmas", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        t.id,
        t.projeto_id,
        t.nucleo_id,
        t.modalidade_id,
        t.nome
      FROM dbo.turmas t
      ORDER BY t.nome
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Erro /api/turmas:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

/* =========================
   ALUNOS
========================= */

// LISTAR alunos
app.get("/api/alunos", async (req, res) => {
  try {
    const { projeto_id, nucleo_id } = req.query;

    const pool = await getPool();
    const request = pool.request();

    let where = "WHERE 1=1";

    if (projeto_id) {
      request.input("projeto_id", sql.Int, Number(projeto_id));
      where += " AND a.projeto_id = @projeto_id";
    }

    if (nucleo_id) {
      request.input("nucleo_id", sql.Int, Number(nucleo_id));
      where += " AND a.nucleo_id = @nucleo_id";
    }

    const result = await request.query(`
      SELECT
        a.id,
        a.projeto_id,
        a.nucleo_id,
        n.nome AS nucleo_nome,
        a.modalidade_id,
        m.nome AS modalidade_nome,
        a.turma_id,
        t.nome AS turma_nome,
        CAST(NULL AS varchar(20)) AS turma_horario,
        a.nome,
        a.contato,
        a.pcd,
        a.data_nascimento,
        a.data_inscricao,
        a.necessidades_observacoes,
        a.escola_nome,
        a.escola_tipo,
        a.tamanho_camiseta,
        a.tamanho_shorts,
        a.tamanho_kimono
      FROM dbo.alunos a
      INNER JOIN dbo.nucleos n ON n.id = a.nucleo_id
      INNER JOIN dbo.modalidades m ON m.id = a.modalidade_id
      LEFT JOIN dbo.turmas t ON t.id = a.turma_id
      ${where}
      ORDER BY a.nome
    `);

    return res.json(result.recordset);
  } catch (err) {
    console.error("Erro /api/alunos:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

// CADASTRAR aluno
app.post("/api/alunos", async (req, res) => {
  try {
    const {
      projeto_id,
      nucleo_id,
      modalidade_id,
      turma_id = null,
      nome,
      contato = null,
      pcd = false,
      data_nascimento = null,
      data_inscricao = null,
      necessidades_observacoes = null,
      escola_nome = null,
      escola_tipo = null,
      tamanho_camiseta = null,
      tamanho_shorts = null,
      tamanho_kimono = null,
    } = req.body || {};

    if (!projeto_id || !nucleo_id || !modalidade_id || !nome) {
      return res.status(400).json({
        ok: false,
        erro: "Campos obrigatórios: projeto_id, nucleo_id, modalidade_id, nome",
      });
    }

    const pool = await getPool();
    const request = pool.request();

    request.input("projeto_id", sql.Int, Number(projeto_id));
    request.input("nucleo_id", sql.Int, Number(nucleo_id));
    request.input("modalidade_id", sql.Int, Number(modalidade_id));
    request.input("turma_id", sql.Int, turma_id ? Number(turma_id) : null);

    request.input("nome", sql.NVarChar(150), String(nome).trim());
    request.input("contato", sql.NVarChar(50), contato ? String(contato).trim() : null);
    request.input("pcd", sql.Bit, !!pcd);

    request.input("data_nascimento", sql.Date, data_nascimento || null);
    request.input("data_inscricao", sql.Date, data_inscricao || null);

    request.input(
      "necessidades_observacoes",
      sql.NVarChar(sql.MAX),
      necessidades_observacoes ? String(necessidades_observacoes) : null
    );
    request.input("escola_nome", sql.NVarChar(150), escola_nome ? String(escola_nome) : null);
    request.input("escola_tipo", sql.NVarChar(50), escola_tipo ? String(escola_tipo) : null);
    request.input("tamanho_camiseta", sql.NVarChar(20), tamanho_camiseta ? String(tamanho_camiseta) : null);
    request.input("tamanho_shorts", sql.NVarChar(20), tamanho_shorts ? String(tamanho_shorts) : null);
    request.input("tamanho_kimono", sql.NVarChar(20), tamanho_kimono ? String(tamanho_kimono) : null);

    const result = await request.query(`
      INSERT INTO dbo.alunos (
        projeto_id,
        nucleo_id,
        modalidade_id,
        turma_id,
        nome,
        contato,
        pcd,
        data_nascimento,
        data_inscricao,
        necessidades_observacoes,
        escola_nome,
        escola_tipo,
        tamanho_camiseta,
        tamanho_shorts,
        tamanho_kimono
      )
      OUTPUT INSERTED.id
      VALUES (
        @projeto_id,
        @nucleo_id,
        @modalidade_id,
        @turma_id,
        @nome,
        @contato,
        @pcd,
        @data_nascimento,
        @data_inscricao,
        @necessidades_observacoes,
        @escola_nome,
        @escola_tipo,
        @tamanho_camiseta,
        @tamanho_shorts,
        @tamanho_kimono
      )
    `);

    const novoId = result.recordset?.[0]?.id;

    return res.status(201).json({
      ok: true,
      id: novoId,
      mensagem: "Aluno cadastrado com sucesso.",
    });
  } catch (err) {
    console.error("Erro POST /api/alunos:", err);
    return res.status(500).json({ ok: false, erro: normalizeError(err) });
  }
});

/* =========================
   PONTE: INSCRIÇÕES (Apps Script)
   Front chama /api/inscricoes
   Node chama Apps Script
========================= */

// PING
app.get("/api/inscricoes/ping", async (req, res) => {
  try {
    const url = buildGasUrl("ping");
    console.log("Chamando GAS PING:", url);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    const data = await readJsonFromResponse(response);

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.error || `Falha no ping (${response.status})`,
        details: data,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro /api/inscricoes/ping:", err);
    return res.status(500).json({
      ok: false,
      error: normalizeError(err),
    });
  }
});

// LISTAR inscrições
app.get("/api/inscricoes/list", async (req, res) => {
  try {
    const url = buildGasUrl("list", req.query || {});
    console.log("Chamando GAS LIST:", url);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    const data = await readJsonFromResponse(response);

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.error || `Falha ao consultar inscrições (${response.status})`,
        details: data,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro /api/inscricoes/list:", err);
    return res.status(500).json({
      ok: false,
      error: normalizeError(err),
    });
  }
});

// DETALHE de inscrição
app.get("/api/inscricoes/get", async (req, res) => {
  try {
    const url = buildGasUrl("get", req.query || {});
    console.log("Chamando GAS GET:", url);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    const data = await readJsonFromResponse(response);

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.error || `Falha ao consultar inscrição (${response.status})`,
        details: data,
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro /api/inscricoes/get:", err);
    return res.status(500).json({
      ok: false,
      error: normalizeError(err),
    });
  }
});

// AÇÕES de inscrição: create, update, delete, convert, log
app.post("/api/inscricoes/post", async (req, res) => {
  try {
    const incomingBody =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const body = {
      ...incomingBody,
      api_key: INSCRICAO_API_KEY || incomingBody.api_key || "",
    };

    console.log("Chamando GAS POST:", body.action || "(sem action)");

    const response = await fetch(INSCRICAO_GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    const data = await readJsonFromResponse(response);

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.error || `Falha ao enviar ação de inscrição (${response.status})`,
        details: data,
      });
    }

    if (!data?.ok) {
      return res.status(400).json(data);
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro /api/inscricoes/post:", err);
    return res.status(500).json({
      ok: false,
      error: normalizeError(err),
    });
  }
});

/* =========================
   404 API
========================= */
app.use("/api", (req, res) => {
  return res.status(404).json({
    ok: false,
    error: "Rota da API não encontrada",
  });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});