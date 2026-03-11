"use strict";

/**
 * EAD v2 (embed no IIN System)
 * - Renderiza dentro de #eadApp (dentro de .ead-root)
 * - Lê aulas cadastradas no Admin do app.js (lessonsByProject)
 * - Agrupa por categoria => vira "Curso"
 * - Mostra player real via iframe (embedUrl)
 * - Salva progresso (concluída) por usuário em localStorage
 */

const IIN_STORAGE_KEY = "iin-system-v9_2";
const IIN_SESSION_KEY = "iin-session-v9_2";
const EAD_PROGRESS_KEY = "iin-ead-progress-v1";

const icons = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  playCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEadApp() {
  return document.getElementById("eadApp");
}

function readSystemStorage() {
  const raw = localStorage.getItem(IIN_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function readSession() {
  const raw = localStorage.getItem(IIN_SESSION_KEY);
  if (!raw) return { sessionUserId: null, currentProjectKey: "light" };
  try {
    const s = JSON.parse(raw);
    return {
      sessionUserId: s?.sessionUserId || null,
      currentProjectKey: s?.currentProjectKey || "light",
    };
  } catch {
    return { sessionUserId: null, currentProjectKey: "light" };
  }
}

function readProgress() {
  const raw = localStorage.getItem(EAD_PROGRESS_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function saveProgress(progress) {
  localStorage.setItem(EAD_PROGRESS_KEY, JSON.stringify(progress || {}));
}

function getLessonsFromAdmin(projectKey) {
  const db = readSystemStorage();
  const list = db?.lessonsByProject?.[projectKey];
  return Array.isArray(list) ? list.slice() : [];
}

/**
 * Agrupa aulas do admin por categoria e monta cursos + lições
 */
function buildCourses(projectKey, userId) {
  const lessons = getLessonsFromAdmin(projectKey);

  // se não tiver aula cadastrada no admin:
  if (!lessons.length) return { courses: [], lessonsByCourse: {} };

  const progress = readProgress();
  const userProg = progress[userId] || { completed: {} };

  const byCat = {};
  lessons.forEach((l) => {
    const cat = (l.category || "Geral").trim();
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(l);
  });

  const courses = Object.keys(byCat).sort((a,b)=>a.localeCompare(b,"pt-BR")).map((cat) => {
    const arr = byCat[cat].slice().sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
    const total = arr.length;
    const done = arr.filter((x) => !!userProg.completed?.[x.id]).length;

    return {
      id: `cat:${cat}`,
      title: cat,
      description: `Aulas de ${cat} cadastradas no sistema.`,
      instructor: "Instituto Irmãos Nogueira",
      totalLessons: total,
      completedLessons: done,
      category: cat,
      emoji: cat.toLowerCase().includes("box") ? "🥊"
        : cat.toLowerCase().includes("muay") ? "🦵"
        : cat.toLowerCase().includes("jiu") ? "🥋"
        : cat.toLowerCase().includes("defe") ? "🛡️"
        : cat.toLowerCase().includes("cond") ? "💪"
        : "🎥",
    };
  });

  const lessonsByCourse = {};
  courses.forEach((c) => {
    const cat = c.category;
    lessonsByCourse[c.id] = byCat[cat]
  .slice()
  .sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""),"pt-BR"))
  .map((l, idx) => ({
    id: l.id,
    title: l.title || `Aula ${idx + 1}`,
    duration: l.level ? String(l.level) : "",
    embedUrl: l.embedUrl || "",
    provider: l.provider || "",
    completed: !!userProg.completed?.[l.id],
    order: idx + 1,
    desc: l.desc || "",
    extra: l.extra || ""
  }));
  });

  return { courses, lessonsByCourse };
}

// ===== STATE =====
let currentPage = "home";
let currentCourseId = null;
let currentLessonId = null;

function renderHome(ctx) {
  const app = getEadApp();
  if (!app) return;

  const { courses } = ctx;
  const totalCourses = courses.length;
  const totalLessons = courses.reduce((acc, c) => acc + c.totalLessons, 0);

  const coursesHTML = courses.map((course, i) => {
    const progress = course.totalLessons ? (course.completedLessons / course.totalLessons) * 100 : 0;
    const isCompleted = progress >= 100;

    return `
      <div class="animate-fade-in" style="animation-delay:${i * 80}ms">
        <button class="course-card" type="button" data-open-course="${escapeHtml(course.id)}">
          <div class="card-thumb">
            <span class="emoji">${escapeHtml(course.emoji)}</span>
            <div class="card-thumb-overlay"></div>
            <div class="card-thumb-bottom">
              <span class="card-category">${escapeHtml(course.category)}</span>
              ${isCompleted ? `<span class="check-complete">${icons.check}</span>` : ""}
            </div>
            <div class="card-play-overlay">
              <div class="play-btn-circle">${icons.play}</div>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">${escapeHtml(course.title)}</h3>
            <p class="card-desc">${escapeHtml(course.description)}</p>
            <div class="card-meta">
              <span>${escapeHtml(course.instructor)}</span>
              <span>${course.completedLessons}/${course.totalLessons} aulas</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${Math.round(progress)}%"></div>
            </div>
          </div>
        </button>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <header class="header">
      <div class="container">
        <div class="logo"><span class="logo-primary">IIN</span><span class="logo-text"> — EAD</span></div>
        <span class="header-subtitle">Instituto Irmãos Nogueira</span>
      </div>
    </header>

    <section class="hero">
      <div class="container hero-content">
        <h1>Treine com os <span class="text-gradient">melhores</span></h1>
        <p>Aulas cadastradas pelo Admin, organizadas por categoria. Evolua no seu ritmo.</p>

        <div class="stats">
          <div class="stat">
            <span class="stat-icon">${icons.book}</span>
            <div><p class="stat-value">${totalCourses}</p><p class="stat-label">Cursos</p></div>
          </div>
          <div class="stat">
            <span class="stat-icon">${icons.trophy}</span>
            <div><p class="stat-value">${totalLessons}</p><p class="stat-label">Aulas</p></div>
          </div>
          <div class="stat">
            <span class="stat-icon">${icons.users}</span>
            <div><p class="stat-value">IIN</p><p class="stat-label">Plataforma</p></div>
          </div>
        </div>
      </div>
    </section>

    <section class="courses-section">
      <div class="container">
        <h2 class="section-title">Seus Cursos</h2>

        ${courses.length ? `
          <div class="courses-grid">${coursesHTML}</div>
        ` : `
          <div style="padding:18px;border:1px solid var(--border);border-radius:12px;background:var(--bg-card);color:var(--text-muted)">
            Nenhuma aula cadastrada ainda. Peça ao Admin para cadastrar aulas no painel “Admin • Aulas (EAD)”.
          </div>
        `}
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <p>Instituto Irmãos Nogueira © 2026</p>
      </div>
    </footer>
  `;

  // bind cursos
  app.querySelectorAll("[data-open-course]").forEach((btn) => {
    btn.addEventListener("click", () => openCourse(ctx, btn.getAttribute("data-open-course")));
  });
}

function buildLessonTabsHTML(currentLesson) {
  const descriptionText = (currentLesson?.desc || "").trim();
  const extraText = (currentLesson?.extra || "").trim();

  const safeDescription = descriptionText
    ? escapeHtml(descriptionText).replace(/\n/g, "<br>")
    : "Sem descrição para esta aula.";

  const safeExtra = extraText
    ? escapeHtml(extraText).replace(/\n/g, "<br>")
    : "Sem informações extras para esta aula.";

  return `
    <div class="ead-detail-tabs">
      <div class="ead-detail-tab-buttons">
        <button type="button" class="ead-detail-tab-btn active" data-ead-tab="desc">Descrição</button>
        <button type="button" class="ead-detail-tab-btn" data-ead-tab="extra">Extras</button>
      </div>

      <div class="ead-detail-tab-panels">
        <div class="ead-detail-tab-panel active" data-ead-panel="desc">
          <div class="ead-detail-box">
            ${safeDescription}
          </div>
        </div>

        <div class="ead-detail-tab-panel" data-ead-panel="extra">
          <div class="ead-detail-box">
            ${safeExtra}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCoursePage(ctx, courseId) {
  const app = getEadApp();
  if (!app) return;

  const course = ctx.courses.find((c) => c.id === courseId);
  const lessons = ctx.lessonsByCourse[courseId] || [];

  if (!course) {
    app.innerHTML = `
      <div style="min-height:50vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;">
        <h2>Curso não encontrado</h2>
        <button class="back-btn" type="button" data-go-home style="color:var(--primary)">Voltar</button>
      </div>
    `;
    app.querySelector("[data-go-home]")?.addEventListener("click", () => goHome(ctx));
    return;
  }

  currentCourseId = courseId;
  if (!currentLessonId) currentLessonId = lessons[0]?.id || null;

  const currentLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0] || null;

  const lessonsHTML = lessons.map((lesson) => {
    const isActive = currentLesson && lesson.id === currentLesson.id;
    const icon = lesson.completed ? icons.check : icons.playCircle;
    return `
      <button class="lesson-item ${isActive ? "active" : ""}" type="button" data-lesson="${escapeHtml(lesson.id)}">
        <span class="lesson-icon">${icon}</span>
        <div class="lesson-content">
          <span class="lesson-title">${lesson.order}. ${escapeHtml(lesson.title)}</span>
          <span class="lesson-duration">${escapeHtml(lesson.duration || "")}</span>
        </div>
      </button>
    `;
  }).join("");

  const lessonTabsHTML = buildLessonTabsHTML(currentLesson);

const videoHTML = currentLesson?.embedUrl ? `
  <div class="video-player">
    <iframe class="video-frame" src="${escapeHtml(currentLesson.embedUrl)}"
      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
  </div>

  <div class="video-info">
    <h2>${escapeHtml(currentLesson.title)}</h2>
    <p>${escapeHtml(course.title)} · Aula ${currentLesson.order}${currentLesson.desc ? " · " + escapeHtml(currentLesson.desc) : ""}</p>
    <button type="button" class="mark-done" data-mark-done>
      ${icons.check} Marcar como concluída
    </button>
  </div>

  ${lessonTabsHTML}
` : `
  <div class="video-player">
    <div class="video-empty">
      <div>
        <div style="opacity:.9;margin-bottom:8px">${icons.play}</div>
        <div style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:.1em">
          Aula sem vídeo
        </div>
        <div style="margin-top:6px">Peça ao Admin para cadastrar um link do YouTube/Drive.</div>
      </div>
    </div>
  </div>

  <div class="video-info">
    <h2>${escapeHtml(currentLesson?.title || "Selecione uma aula")}</h2>
    <p>${escapeHtml(course.title)} · Aula ${currentLesson?.order || "-"}</p>
  </div>

  ${lessonTabsHTML}
`;

  app.innerHTML = `
    <header class="course-header">
      <div class="container">
        <button class="back-btn" type="button" data-go-home>
          <span style="width:16px;height:16px;display:inline-block">${icons.arrowLeft}</span>
          <span>Voltar</span>
        </button>
        <div class="divider"></div>
        <div class="logo"><span class="logo-primary">IIN</span></div>
      </div>
    </header>

    <div class="container">
      <div class="course-layout">
        <div class="video-area">
          ${videoHTML}
        </div>

        <div class="sidebar">
          <div class="sidebar-inner">
            <h2 class="sidebar-title">${escapeHtml(course.title)}</h2>
            <p class="sidebar-subtitle">${course.completedLessons} de ${course.totalLessons} aulas concluídas</p>
            <div class="lesson-list">${lessonsHTML}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // binds
  app.querySelector("[data-go-home]")?.addEventListener("click", () => goHome(ctx));

app.querySelectorAll("[data-lesson]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentLessonId = btn.getAttribute("data-lesson");
    renderCoursePage(ctx, courseId);
    window.scrollTo(0, 0);
  });
});

app.querySelector("[data-mark-done]")?.addEventListener("click", () => {
  if (!currentLesson) return;
  markLessonDone(ctx, currentLesson.id);
});

app.querySelectorAll("[data-ead-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.getAttribute("data-ead-tab");

    app.querySelectorAll("[data-ead-tab]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-ead-tab") === tab);
    });

    app.querySelectorAll("[data-ead-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-ead-panel") === tab);
    });
  });
});
}

function markLessonDone(ctx, lessonId) {
  const { sessionUserId } = readSession();
  if (!sessionUserId) return;

  const progress = readProgress();
  const userProg = progress[sessionUserId] || { completed: {} };
  userProg.completed = userProg.completed || {};
  userProg.completed[lessonId] = true;
  progress[sessionUserId] = userProg;
  saveProgress(progress);

  // recarrega cursos para atualizar contagem de concluídas
  const nextCtx = buildContextFromStorage();
  renderCoursePage(nextCtx, currentCourseId);
}

function openCourse(ctx, courseId) {
  currentPage = "course";
  currentCourseId = courseId;
  currentLessonId = null;
  renderCoursePage(ctx, courseId);
  window.scrollTo(0, 0);
}

function goHome(ctx) {
  currentPage = "home";
  currentCourseId = null;
  currentLessonId = null;
  renderHome(ctx);
  window.scrollTo(0, 0);
}

function buildContextFromStorage() {
  const { sessionUserId, currentProjectKey } = readSession();
  const userId = sessionUserId || "anon";
  const { courses, lessonsByCourse } = buildCourses(currentProjectKey, userId);
  return { courses, lessonsByCourse, userId, projectKey: currentProjectKey };
}

// Função pública: seu app.js vai chamar isso ao abrir a aba Aulas
window.mountEadPlatform = function mountEadPlatform() {
  const app = getEadApp();
  if (!app) return;

  const ctx = buildContextFromStorage();
  if (currentPage === "course" && currentCourseId) renderCoursePage(ctx, currentCourseId);
  else renderHome(ctx);
};

// Também permite render inicial (caso a aba já esteja aberta)
document.addEventListener("DOMContentLoaded", () => {
  // não faz nada aqui pra não renderizar fora da aba Aulas.
});