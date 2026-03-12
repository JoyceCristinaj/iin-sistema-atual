"use strict";

// ✅ 1) URL da API (uma vez só)
window.INSCRICOES_API_URL =
  window.INSCRICOES_API_URL ||
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";

// ✅ 2) cria a constante que seu código usa no fetch()
const INSCRICOES_API_URL = window.INSCRICOES_API_URL;

// ===== ÍCONES (Mostrar/Ocultar senha) =====
const ICON_EYE_OPEN = `
...seu svg...
`;

const ICON_EYE_CLOSED = `
...seu svg...
`;

if (!crypto.randomUUID) {
  crypto.randomUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}
// =========================
// ESTOQUE DE LANCHES (SEMANAL)
// só Supergasbras: Freguesia + Realengo
// =========================
const SNACK_PROJECT_KEY = "supergasbras";
const SNACK_NUCLEI = ["Freguesia", "Realengo"];
const SNACK_ITEM_KEY = "lanche"; // 1 item por enquanto
const STORAGE_KEY = "iin-system-v9_2";
const SESSION_KEY = "iin-session-v9_2";
const REPORT_PREFS_KEY = "iin-report-prefs-v2";
const API_BASE = "http://localhost:3000/api";
const INSCRICAO_API_URL = "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";
const INSCRICAO_API_KEY_STORAGE = "iin_api_key_admin";
const PROJECTS = [
  {
    key: "light",
    label: "Light",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA ESCOLA DA VIDA ANO 3 - LIGHT ANO 2",
  },
  {
    key: "enel",
    label: "Enel",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA: ESCOLA DA VIDA ANO 4 - ENEL ANO 2",
  },
  {
    key: "supergasbras",
    label: "Supergasbras",
    processNumber: "SEI-300001/002142/2023",
    subtitle: "PROJETO: LUTA: ESCOLA DA VIDA RIO DE JANEIRO - SUPERGASBRAS ANO 2",
  },
];

const PROJECT_NUCLEI = {
  light: ["Campo Grande", "Jacarezinho", "Penha", "Santa Cruz"],
  enel: ["Macaé"],
  supergasbras: ["Freguesia", "Realengo"],
};

const PROJECT_MODALITIES = {
  light: ["Boxe", "Muay Thai", "Jiu Jitso"],
  enel: ["Jiu Jitso", "Muay Thai"],
  supergasbras: ["Boxe", "Jiu Jitso"],
};

const STOCK_CATEGORIES = [
  { key: "camiseta", label: "Camiseta" },
  { key: "shorts", label: "Shorts" },
  { key: "kimono", label: "Kimono" },
  { key: "bandagem", label: "Bandagem" },
  { key: "protetor_bucal", label: "Protetor bucal" },
];

const MODALITY_ITEMS = {
  "Jiu Jitso": ["camiseta", "kimono"],
  Boxe: ["camiseta", "shorts", "bandagem", "protetor_bucal"],
  "Muay Thai": ["camiseta", "shorts", "bandagem", "protetor_bucal"],
};

const MESTRE_THEMES = [
  "disciplina",
  "respeito",
  "trabalho_em_equipe",
  "amor",
  "meio_ambiente",
  "cultura",
  "saude_autocuidado",
  "projeto_de_vida",
  "esporte_movimento",
  "artes_criatividade",
  "educacao_emocional",
  "leitura_letramento",
];

const CUSTOM_FIELDS = [
  { key: "cpf", label: "CPF do aluno" },
  { key: "birthDate", label: "Data nascimento" },
  { key: "age", label: "Idade" },
  { key: "gender", label: "Gênero" },
  { key: "uf", label: "UF" },
  { key: "address", label: "Endereço/Bairro" },
  { key: "zip", label: "CEP" },
  { key: "pcd", label: "PCD" },
  { key: "parents", label: "Nome mãe/pai" },
  { key: "school", label: "Escola / ano" },
  { key: "uniform", label: "Tamanho uniforme" },
  { key: "nucleus", label: "Núcleo" },
  { key: "modality", label: "Modalidade" },
  { key: "guardianCpf", label: "CPF responsável" },
  { key: "guardianEmail", label: "E-mail responsável" },
  { key: "guardianContact", label: "Contato responsável" },
  { key: "enrollDate", label: "Data inscrição" },
  { key: "schedule", label: "Turma/Horário" },
];


const SUPERVISAO_CHECKLIST_DIARIO = [
  "Pontualidade",
  "Uniformes",
  "Organização dos Calçados",
  "Formação e Chamada",
  "Introdução ao Tema do Mês",
  "Mobilidade",
  "Aquecimento",
  "Atividade Lúdica/Física",
  "Técnica do Dia",
  "Momento do Mestre",
  "Compromisso IIN",
  "Foto da Turma",
  "Conversa Privada",
  "Relatórios Diários",
];

const SUPERVISAO_METODOLOGIA_INSTRUTORES = [
  "Pontualidade",
  "Uniforme",
  "Parte Lúdica",
  "Parte Técnica",
  "Postura em aula",
  "Compromisso IIN",
  "Momento do Mestre",
  "Conversa privada",
  "Fotos para o relatório",
  "Relatórios Completos",
];

const SUPERVISAO_METODOLOGIA_TURMAS = [
  "Arrumação da sala",
  "Conservação dos uniformes",
  "Organização dos calçados",
  "Limpeza do espaço",
  "Alinhamento e formação da turma",
  "Disciplina dos alunos",
  "Controle dos alunos",
  "Adaptação dos conteúdos",
  "Suporte às necessidades dos alunos",
  "Documentação adequada",
];

const ALERT_FALTAS_WARN = 3;
const ALERT_FALTAS_CRIT = 5;
const ALERT_FREQ_CRIT_PCT = 60;
const ALERT_MIN_AULAS = 5;

const INSTITUTIONAL_EMAIL = "contato@iinbrasil.org";
window.INSTITUTIONAL_EMAIL = INSTITUTIONAL_EMAIL;