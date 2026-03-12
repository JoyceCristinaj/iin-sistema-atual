# Handoff

## Estrutura final

- `index.html`
- `app.js`
- `js/config.js`
- `js/utils.js`
- `js/ui.js`
- `js/storage.js`
- `js/auth.js`
- `js/ead-core.js`
- `js/ead-admin.js`
- `js/students.js`
- `js/visitors.js`
- `js/stock.js`
- `js/snacks.js`
- `js/supervisao.js`
- `js/reports.js`
- `js/whatsapp.js`
- `ead/ead.js`
- `fila.js`

## Onde ainda usa localStorage

- `STORAGE_KEY` (`iin-system-v9_2`): base principal do sistema.
- `SESSION_KEY` (`iin-session-v9_2`): sessão e projeto ativo.
- `REPORT_PREFS_KEY` (`iin-report-prefs-v2`): preferências de impressão/relatório.
- `INSCRICAO_API_KEY_STORAGE` (`iin_api_key_admin`): chave administrativa da integração atual.
- `EAD_PROGRESS_KEY` em `ead/ead.js`: progresso das aulas EAD por usuário.

## Pontos mais preparados para futura API

- `js/storage.js`
  - centraliza `loadData`, `persist`, sessão, preferências e getters por projeto.
  - é o primeiro ponto natural para trocar `localStorage` por chamadas HTTP.
- `js/auth.js`
  - contém login/logout, usuário atual e gestão de usuários.
- `js/ead-core.js` e `js/ead-admin.js`
  - concentram dados pedagógicos, aulas, semanas e validações da EAD.
- `js/students.js`
  - concentra cadastro, frequência, planejamento e calendário.
- `js/visitors.js`
  - fluxo de visitantes e conversão em aluno.
- `js/stock.js` e `js/snacks.js`
  - estoques, entregas e histórico de movimentação.
- `js/supervisao.js`
  - checklist e registros de supervisão.
- `js/reports.js`
  - montagem de relatórios, impressão e modais de histórico/PDF.

## Módulos prioritários para integração SQL/backend

1. `js/storage.js`
   - substituir `loadData/persist/loadSession/persistSession/loadReportPrefs/saveReportPrefs`.
2. `js/auth.js`
   - autenticação e gestão de usuários.
3. `js/students.js`
   - alunos, calendário, frequência e planejamento.
4. `js/ead-core.js` + `js/ead-admin.js`
   - aulas, semanas e progresso.
5. `js/stock.js` + `js/snacks.js`
   - estoque e movimentações.
6. `js/visitors.js` e `js/supervisao.js`
   - visitantes e checklists.
7. `js/reports.js`
   - leitura agregada para relatórios.

## Formato de dados esperado para futura integração

### Session

```json
{
  "sessionUserId": "uuid",
  "currentProjectKey": "light"
}
```

### Root app state

```json
{
  "students": [],
  "visitors": [],
  "users": [],
  "history": [],
  "uniformStockByProject": {},
  "snackStockByProject": {},
  "classDaysByProject": {},
  "attendanceStaffByProject": {},
  "planningByProject": {},
  "classLocksByProject": {},
  "nucleusLogsByProject": {},
  "mestreDocsByProject": {},
  "settingsByProject": {},
  "supervisaoByProject": {},
  "lessonsByProject": {},
  "weeksByProject": {}
}
```

### Users

```json
{
  "id": "uuid",
  "project": "light",
  "username": "iin.admin",
  "password": "texto_plano_hoje",
  "role": "admin|gestao|supervisao|professor",
  "nucleus": "Campo Grande"
}
```

### Students

```json
{
  "id": "uuid",
  "project": "light",
  "name": "Nome",
  "nucleus": "Campo Grande",
  "modality": "Boxe",
  "schedule": "18:00 às 19:00",
  "contact": "21999999999",
  "birthDate": "2026-03-11",
  "guardian": {
    "name": "",
    "phone": "",
    "email": "",
    "cpf": ""
  },
  "uniform": {
    "delivered": false,
    "items": {
      "camiseta": false,
      "shorts": false,
      "kimono": false,
      "bandagem": false,
      "protetor_bucal": false
    }
  },
  "attendanceLog": [],
  "snackLog": []
}
```

### Visitors

```json
{
  "id": "uuid",
  "project": "light",
  "name": "Nome",
  "nucleus": "Campo Grande",
  "contact": "21999999999",
  "visitDate": "2026-03-11",
  "birthDate": "2026-03-11",
  "notes": ""
}
```

### EAD weeks

```json
{
  "id": "uuid",
  "project": "light",
  "category": "Jiu Jitso",
  "week": 1,
  "title": "Bases",
  "summary": "Resumo da semana",
  "notes": "Objetivos e observações",
  "updatedAt": "2026-03-11T12:00:00.000Z"
}
```

### EAD lessons

```json
{
  "id": "uuid",
  "project": "light",
  "title": "Aula 1",
  "category": "Jiu Jitso",
  "level": "Iniciante",
  "week": 1,
  "lessonOrder": 1,
  "desc": "",
  "extra": "",
  "provider": "youtube",
  "embedUrl": "https://www.youtube.com/embed/...",
  "thumb": "",
  "createdAt": "2026-03-11T12:00:00.000Z"
}
```

### Stock and snacks

```json
{
  "uniformStockByProject": {
    "light": {
      "Campo Grande": {
        "camiseta": 0,
        "shorts": 0
      }
    }
  },
  "snackStockByProject": {
    "supergasbras": {
      "2026-W11": {
        "Freguesia": {
          "lanche": 0
        }
      }
    }
  }
}
```

## Observações

- A base continua 100% local e orientada a estado em memória + persistência no browser.
- A troca para backend deve ser feita primeiro por leitura/escrita centralizada em `js/storage.js`, sem mexer de imediato na camada de interface.
- A EAD já está preparada para um modelo relacional simples com tabelas separadas para `courses/modalities`, `weeks`, `lessons` e `lesson_progress`.
