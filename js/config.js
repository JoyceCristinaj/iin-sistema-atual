"use strict";

// ✅ 1) URL da API (uma vez só)
window.API_INSCRICOES_URL =
  window.API_INSCRICOES_URL ||
  window.INSCRICOES_API_URL ||
  window.INSCRICAO_API_URL ||
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";
window.INSCRICOES_API_URL = window.API_INSCRICOES_URL;
window.INSCRICAO_API_URL = window.API_INSCRICOES_URL;

// ✅ 2) cria a constante que seu código usa no fetch()
const API_INSCRICOES_URL = window.API_INSCRICOES_URL;
const INSCRICOES_API_URL = window.API_INSCRICOES_URL;

// ===== ÍCONES (Mostrar/Ocultar senha) =====
const ICON_EYE_OPEN = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.45448 13.8008C1.84656 12.6796 1.84656 11.3204 2.45447 10.1992C4.29523 6.80404 7.87965 4.5 11.9999 4.5C16.1202 4.5 19.7046 6.80404 21.5454 10.1992C22.1533 11.3204 22.1533 12.6796 21.5454 13.8008C19.7046 17.196 16.1202 19.5 11.9999 19.5C7.87965 19.5 4.29523 17.196 2.45448 13.8008Z" stroke="currentColor" stroke-width="1.8"/>
  <path d="M15.0126 11.9551C15.0126 13.6119 13.6695 14.9551 12.0126 14.9551C10.3558 14.9551 9.01263 13.6119 9.01263 11.9551C9.01263 10.2982 10.3558 8.95508 12.0126 8.95508C13.6695 8.95508 15.0126 10.2982 15.0126 11.9551Z" stroke="currentColor" stroke-width="1.8"/>
</svg>
`;

const ICON_EYE_CLOSED = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_eye_closed)">
    <path d="M13.9 14.7C13.3 15.3 12.6 15.6 11.8 15.6C11 15.6 10.2 15.3 9.70005 14.7C9.10005 14.1 8.80005 13.4 8.80005 12.6C8.80005 11.8 9.10005 11 9.70005 10.5L11.8 12.6L13.9 14.7Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M4 4.7998L19.6 20.3998" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M17.7 18.4998C16 19.5998 14 20.1998 11.8 20.1998C7.70003 20.1998 4.10002 17.8998 2.30002 14.4998C1.60002 13.3998 1.60002 11.9998 2.30002 10.8998C3.20002 9.19981 4.50002 7.7998 6.10002 6.7998" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8.40002 5.7001C9.50002 5.3001 10.6 5.1001 11.8 5.1001C15.9 5.1001 19.5 7.4001 21.3 10.8001C21.9 11.9001 21.9 13.3001 21.3 14.4001C20.8 15.3001 20.2 16.1001 19.5 16.8001" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <defs>
    <clipPath id="clip0_eye_closed">
      <rect width="21.6" height="17.2" fill="white" transform="translate(1 4)"/>
    </clipPath>
  </defs>
</svg>
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
const INSCRICAO_API_URL = window.API_INSCRICOES_URL;
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

const NUCLEOS_AULAS = {
  Jacarezinho: {
    modalidades: {
      "Muay Thai": {
        dias: ["Segunda", "Quarta"],
        horarios: {
          Segunda: [
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
            "20:00 às 21:00",
          ],
          Quarta: [
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
            "20:00 às 21:00",
          ],
        },
      },
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
        },
      },
    },
  },
  Penha: {
    modalidades: {
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "10:00 às 11:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "20:00 às 21:00",
          ],
          Quinta: [
            "10:00 às 11:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "20:00 às 21:00",
          ],
        },
      },
    },
  },
  "Santa Cruz": {
    modalidades: {
      Boxe: {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
        },
      },
    },
  },
  "Campo Grande": {
    modalidades: {
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "14:00 às 15:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "14:00 às 15:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
          ],
        },
      },
    },
  },
  Freguesia: {
    modalidades: {
      "Muay Thai": {
        dias: ["Terça", "Quinta"],
        horariosBase: ["09:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      },
    },
  },
  Realengo: {
    modalidades: {
      Boxe: {
        dias: ["Segunda", "Quarta"],
        horariosBase: ["09:00", "10:00", "15:00", "16:00", "17:00", "18:00"],
      },
    },
  },
  Macaé: {
    modalidades: {},
  },
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

const SCHEDULE_WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
