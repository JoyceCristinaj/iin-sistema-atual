"use strict";

const EAD_PROGRESS_KEY = "iin-ead-progress-v1";

const fallbackEadConfig = {
  STORAGE_KEY: "iin-system-v9_2",
  SESSION_KEY: "iin-session-v9_2",
  categories: ["Boxe", "Muay Thai", "Jiu Jitso"],
  pedagogy: {
    Boxe: { maxWeeks: 52, maxLessonsPerWeek: 2 },
    "Muay Thai": { maxWeeks: 52, maxLessonsPerWeek: 2 },
    "Jiu Jitso": { maxWeeks: 54, maxLessonsPerWeek: 3 },
  },
  allowedByNucleus: {
    Jacarezinho: ["Muay Thai", "Jiu Jitso"],
    Penha: ["Jiu Jitso"],
    "Santa Cruz": ["Boxe"],
    "Campo Grande": ["Jiu Jitso"],
    Freguesia: ["Jiu Jitso"],
    Realengo: ["Boxe"],
  },
  normalizeCategory(rawCategory) {
    const text = String(rawCategory || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!text) return "";
    if (text.includes("box")) return "Boxe";
    if (text.includes("muay")) return "Muay Thai";
    if (text.includes("jiu")) return "Jiu Jitso";
    return "";
  },
  getPedagogy(category) {
    const normalized = this.normalizeCategory(category);
    return this.pedagogy[normalized] || this.pedagogy["Muay Thai"];
  },
  getAllowedCategoriesForUser(user) {
    if (!user || ["admin", "gestao", "supervisao"].includes(user.role)) {
      return this.categories.slice();
    }
    if (user.role !== "professor") return this.categories.slice();
    return (this.allowedByNucleus[user.nucleus] || this.categories).slice();
  },
  canUserAccessCategory(category, user) {
    const normalized = this.normalizeCategory(category);
    return this.getAllowedCategoriesForUser(user).includes(normalized);
  },
};

const eadConfig = window.IIN_EAD || fallbackEadConfig;

const icons = {
  arrowLeft:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  playCircle:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>',
  book:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  layers:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
  chevronDown:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg>',
};

function escapeHtml(value) {
  return String(value ?? "")
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
  const raw = localStorage.getItem(eadConfig.STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readSession() {
  const raw = localStorage.getItem(eadConfig.SESSION_KEY);
  if (!raw) {
    return { sessionUserId: null, currentProjectKey: "light" };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      sessionUserId: parsed?.sessionUserId || null,
      currentProjectKey: parsed?.currentProjectKey || "light",
    };
  } catch {
    return { sessionUserId: null, currentProjectKey: "light" };
  }
}

function readProgress() {
  const raw = localStorage.getItem(EAD_PROGRESS_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(EAD_PROGRESS_KEY, JSON.stringify(progress || {}));
}

function getCurrentUser(projectKey, sessionUserId) {
  const db = readSystemStorage();
  const users = Array.isArray(db?.users) ? db.users : [];
  return users.find((user) => user.project === projectKey && user.id === sessionUserId) || null;
}

function sanitizeLessonRecord(rawLesson, projectKey) {
  const category = eadConfig.normalizeCategory(rawLesson?.category);
  if (!category) return null;

  const pedagogy = eadConfig.getPedagogy(category);
  const week = Number.parseInt(rawLesson?.week, 10);
  const lessonOrder = Number.parseInt(rawLesson?.lessonOrder ?? rawLesson?.order, 10);

  if (!Number.isInteger(week) || week < 1 || week > pedagogy.maxWeeks) return null;
  if (!Number.isInteger(lessonOrder) || lessonOrder < 1 || lessonOrder > pedagogy.maxLessonsPerWeek) return null;

  return {
    id: rawLesson?.id || "",
    project: rawLesson?.project || projectKey,
    title: String(rawLesson?.title || "").trim() || `Aula ${lessonOrder}`,
    category,
    level: String(rawLesson?.level || "").trim(),
    week,
    lessonOrder,
    desc: String(rawLesson?.desc || "").trim(),
    extra: String(rawLesson?.extra || "").trim(),
    provider: String(rawLesson?.provider || "").trim(),
    embedUrl: String(rawLesson?.embedUrl || "").trim(),
    thumb: String(rawLesson?.thumb || "").trim(),
    createdAt: rawLesson?.createdAt || "",
  };
}

function sanitizeWeekRecord(rawWeek, projectKey) {
  const category = eadConfig.normalizeCategory(rawWeek?.category);
  if (!category) return null;

  const pedagogy = eadConfig.getPedagogy(category);
  const week = Number.parseInt(rawWeek?.week, 10);
  if (!Number.isInteger(week) || week < 1 || week > pedagogy.maxWeeks) return null;

  const title = String(rawWeek?.title || "").trim();
  const summary = String(rawWeek?.summary || "").trim();
  const notes = String(rawWeek?.notes || "").trim();

  if (!title && !summary && !notes) return null;

  return {
    id: rawWeek?.id || `${category}|${week}`,
    project: rawWeek?.project || projectKey,
    category,
    week,
    title,
    summary,
    notes,
  };
}

function getLessonsFromAdmin(projectKey) {
  const db = readSystemStorage();
  const list = Array.isArray(db?.lessonsByProject?.[projectKey])
    ? db.lessonsByProject[projectKey]
    : [];

  return list
    .map((lesson) => sanitizeLessonRecord(lesson, projectKey))
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category, "pt-BR") ||
        a.week - b.week ||
        a.lessonOrder - b.lessonOrder ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
}

function getWeeksFromAdmin(projectKey) {
  const db = readSystemStorage();
  const list = Array.isArray(db?.weeksByProject?.[projectKey])
    ? db.weeksByProject[projectKey]
    : [];

  return list
    .map((entry) => sanitizeWeekRecord(entry, projectKey))
    .filter(Boolean)
    .sort((a, b) => a.category.localeCompare(b.category, "pt-BR") || a.week - b.week);
}

function buildCourses(projectKey, userId, user) {
  const allowedCategories = new Set(eadConfig.getAllowedCategoriesForUser(user, projectKey));
  const progress = readProgress();
  const userProgress = progress[userId] || { completed: {} };
  const lessons = getLessonsFromAdmin(projectKey).filter((lesson) => allowedCategories.has(lesson.category));
  const weeks = getWeeksFromAdmin(projectKey).filter((week) => allowedCategories.has(week.category));
  const grouped = new Map();

  function ensureWeekGroup(category, weekNumber) {
    if (!grouped.has(category)) grouped.set(category, new Map());
    const categoryWeeks = grouped.get(category);
    const key = `${category}|${weekNumber}`;

    if (!categoryWeeks.has(key)) {
      categoryWeeks.set(key, {
        key,
        category,
        week: weekNumber,
        title: "",
        summary: "",
        notes: "",
        lessons: [],
      });
    }

    return categoryWeeks.get(key);
  }

  weeks.forEach((week) => {
    const target = ensureWeekGroup(week.category, week.week);
    target.title = week.title || target.title;
    target.summary = week.summary || target.summary;
    target.notes = week.notes || target.notes;
  });

  lessons.forEach((lesson) => {
    const target = ensureWeekGroup(lesson.category, lesson.week);
    target.lessons.push({
      ...lesson,
      completed: Boolean(userProgress.completed?.[lesson.id]),
    });
  });

  const courses = Array.from(grouped.entries())
    .map(([category, categoryWeeks]) => {
      const weeksList = Array.from(categoryWeeks.values())
        .filter((week) => week.lessons.length || week.summary || week.notes || week.title)
        .sort((a, b) => a.week - b.week)
        .map((week) => ({
          ...week,
          lessons: week.lessons
            .slice()
            .sort(
              (a, b) =>
                a.lessonOrder - b.lessonOrder ||
                String(a.title).localeCompare(String(b.title), "pt-BR")
            ),
        }));

      if (!weeksList.length) return null;

      const totalLessons = weeksList.reduce((sum, week) => sum + week.lessons.length, 0);
      const completedLessons = weeksList.reduce(
        (sum, week) => sum + week.lessons.filter((lesson) => lesson.completed).length,
        0
      );
      const pedagogy = eadConfig.getPedagogy(category);

      return {
        id: `course:${category}`,
        category,
        title: category,
        description: `${pedagogy.maxWeeks} semanas planejadas • até ${pedagogy.maxLessonsPerWeek} aulas por semana`,
        totalLessons,
        completedLessons,
        totalWeeks: weeksList.length,
        weeks: weeksList,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  const weeksByCourse = {};
  const lessonsById = {};

  courses.forEach((course) => {
    weeksByCourse[course.id] = course.weeks;
    course.weeks.forEach((week) => {
      week.lessons.forEach((lesson) => {
        lessonsById[lesson.id] = {
          ...lesson,
          courseId: course.id,
          weekKey: week.key,
        };
      });
    });
  });

  return {
    courses,
    weeksByCourse,
    lessonsById,
    allowedCategories: Array.from(allowedCategories),
  };
}

let currentPage = "home";
let currentCourseId = null;
let currentLessonId = null;
let currentWeekKey = null;

function buildLessonTabsHTML(currentLesson) {
  const description = currentLesson?.desc
    ? escapeHtml(currentLesson.desc).replace(/\n/g, "<br>")
    : "Sem descrição cadastrada para esta aula.";

  const extra = currentLesson?.extra
    ? escapeHtml(currentLesson.extra).replace(/\n/g, "<br>")
    : "Sem informações extras para esta aula.";

  return `
    <div class="ead-detail-tabs">
      <div class="ead-detail-tab-buttons">
        <button type="button" class="ead-detail-tab-btn active" data-ead-tab="desc">Descrição</button>
        <button type="button" class="ead-detail-tab-btn" data-ead-tab="extra">Extras</button>
      </div>

      <div class="ead-detail-tab-panels">
        <div class="ead-detail-tab-panel active" data-ead-panel="desc">
          <div class="ead-detail-box">${description}</div>
        </div>

        <div class="ead-detail-tab-panel" data-ead-panel="extra">
          <div class="ead-detail-box">${extra}</div>
        </div>
      </div>
    </div>
  `;
}

function getCourseVisualMeta(category) {
  const normalized = eadConfig.normalizeCategory(category);

  if (normalized === "Boxe") {
    return {
      emoji: "🥊",
      description:
        "Aprenda os fundamentos, evolua por semana e acompanhe sua progressão técnica.",
    };
  }

  if (normalized === "Muay Thai") {
    return {
      emoji: "🦵",
      description:
        "Técnicas básicas e progressão prática de Muay Thai organizadas por conteúdo.",
    };
  }

  if (normalized === "Jiu Jitso") {
    return {
      emoji: "🥋",
      description:
        "Domine fundamentos, posições e transições com acompanhamento semanal.",
    };
  }

  return {
    emoji: "🎓",
    description: "Conteúdo organizado em aulas e semanas para evolução contínua.",
  };
}

function getCourseById(ctx, courseId) {
  return ctx.courses.find((course) => course.id === courseId) || null;
}

function findLessonInContext(ctx, lessonId) {
  return ctx.lessonsById[lessonId] || null;
}

function renderHome(ctx) {
  const app = getEadApp();
  if (!app) return;

  const totalLessons = ctx.courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const accessSummary =
    ctx.user?.role === "professor"
      ? ctx.allowedCategories.join(" • ") || "Sem modalidades liberadas"
      : "Todas as modalidades liberadas";

  const cardsHTML = ctx.courses
    .map((course, i) => {
      const progress = course.totalLessons
        ? Math.round((course.completedLessons / course.totalLessons) * 100)
        : 0;
      const isCompleted = progress === 100;
      const meta = getCourseVisualMeta(course.category);

      return `
        <div class="animate-fade-in" style="animation-delay:${i * 100}ms">
          <button type="button" class="course-card" data-open-course="${escapeHtml(course.id)}">
            <div class="card-thumb">
              <span class="emoji">${meta.emoji}</span>
              <div class="card-thumb-overlay"></div>

              <div class="card-thumb-bottom">
                <span class="card-category">${escapeHtml(course.category)}</span>
                ${isCompleted ? `<span class="check-complete">${icons.check}</span>` : ""}
              </div>

              <div class="card-play-overlay">
                <div class="play-btn-circle">${icons.playCircle}</div>
              </div>
            </div>

            <div class="card-body">
              <h3 class="card-title">${escapeHtml(course.title)}</h3>
              <p class="card-desc">${escapeHtml(meta.description)}</p>

              <div class="card-meta">
                <span>${course.totalWeeks} semanas</span>
                <span>${course.completedLessons}/${course.totalLessons} aulas</span>
              </div>

              <div class="progress-bar">
                <div class="progress-fill" style="width:${progress}%"></div>
              </div>
            </div>
          </button>
        </div>
      `;
    })
    .join("");

  app.innerHTML = `
    <div class="ead-root">
      <header class="header">
        <div class="container">
          <div class="logo">
            <span class="logo-primary">IIN</span>
            <span class="logo-text">— EAD</span>
          </div>
          <span class="header-subtitle">Instituto Irmãos Nogueira</span>
        </div>
      </header>

      <section class="hero">
        <div class="container hero-content">
          <div>
            <h1>Treine com os <span class="text-gradient">melhores</span></h1>
            <p>
              Navegue pelos conteúdos semanais, acompanhe seu progresso e assista às aulas
              liberadas para o seu acesso.
            </p>
          </div>

          <div class="stats">
            <div class="stat">
              <span class="stat-icon">${icons.layers}</span>
              <div>
                <p class="stat-value">${ctx.courses.length}</p>
                <p class="stat-label">Cursos</p>
              </div>
            </div>

            <div class="stat">
              <span class="stat-icon">${icons.book}</span>
              <div>
                <p class="stat-value">${totalLessons}</p>
                <p class="stat-label">Aulas</p>
              </div>
            </div>

            <div class="stat">
              <span class="stat-icon">${icons.calendar}</span>
              <div>
                <p class="stat-value">${escapeHtml(String(ctx.projectKey || "light").toUpperCase())}</p>
                <p class="stat-label">Projeto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="access-strip">
        <div class="container">
          <div class="access-box">
            <strong>Acesso atual</strong>
            <span>${escapeHtml(accessSummary)}</span>
          </div>
        </div>
      </section>

      <section class="courses-section">
        <div class="container">
          <h2 class="section-title">Seus Cursos</h2>
          <div class="courses-grid">
            ${
              ctx.courses.length
                ? cardsHTML
                : `
                  <div class="empty-panel">
                    Nenhuma modalidade disponível no momento. Cadastre aulas e semanas no painel Admin para liberar o EAD.
                  </div>
                `
            }
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="container">
          <p>Instituto Irmãos Nogueira © 2026</p>
        </div>
      </footer>
    </div>
  `;

  app.querySelectorAll("[data-open-course]").forEach((button) => {
    button.addEventListener("click", () => {
      openCourse(ctx, button.getAttribute("data-open-course"));
    });
  });
}

function renderCoursePage(ctx, courseId) {
  const app = getEadApp();
  if (!app) return;

  const course = getCourseById(ctx, courseId);

  if (!course) {
    currentPage = "home";
    currentCourseId = null;
    currentLessonId = null;
    currentWeekKey = null;
    renderHome(ctx);
    return;
  }

  const weeks = ctx.weeksByCourse[courseId] || [];

  if (!weeks.length) {
    currentPage = "home";
    currentCourseId = null;
    currentLessonId = null;
    currentWeekKey = null;
    renderHome(ctx);
    return;
  }

  const resolvedWeek = currentWeekKey
    ? weeks.find((week) => week.key === currentWeekKey) || null
    : null;

  if (currentWeekKey && !resolvedWeek) {
    currentWeekKey = weeks[0]?.key || null;
  }

  const firstWeekWithLessons = weeks.find((week) => week.lessons.length) || weeks[0];
  const allowedLessonIds = new Set(weeks.flatMap((week) => week.lessons.map((lesson) => lesson.id)));

  if (!currentLessonId || !allowedLessonIds.has(currentLessonId)) {
    currentLessonId = firstWeekWithLessons?.lessons[0]?.id || null;
  }



  const currentLesson = currentLessonId ? findLessonInContext(ctx, currentLessonId) : null;

  const weeksHTML = weeks
    .map((week) => {
      const isOpen = week.key === currentWeekKey;
      const lessonsHTML = week.lessons.length
        ? week.lessons
            .map((lesson) => {
              const isActive = lesson.id === currentLessonId;
              const icon = lesson.completed ? icons.check : icons.playCircle;

              return `
                <button
                  type="button"
                  class="lesson-item ${isActive ? "active" : ""}"
                  data-lesson="${escapeHtml(lesson.id)}"
                >
                  <span class="lesson-icon">${icon}</span>
                  <div class="lesson-content">
                    <span class="lesson-title">Aula ${lesson.lessonOrder} • ${escapeHtml(lesson.title)}</span>
                    <span class="lesson-duration">${escapeHtml(lesson.level || "Conteúdo EAD")}</span>
                  </div>
                </button>
              `;
            })
            .join("")
        : `<div class="lesson-empty">Nenhuma aula cadastrada para esta semana ainda.</div>`;

      return `
        <section class="week-group ${isOpen ? "open" : ""}">
          <button type="button" class="week-toggle" data-ead-week="${escapeHtml(week.key)}">
            <div class="week-toggle-left">
              <span class="week-badge">Semana ${week.week}</span>
              <span class="week-meta">${escapeHtml(week.title || `Semana ${week.week}`)}</span>
              <span class="week-count">${week.lessons.length} aulas</span>
            </div>
            <span class="week-chevron">${icons.chevronDown}</span>
          </button>

          <div class="week-panel">
            <div class="week-summary">
              <strong>Resumo da semana</strong>
              <p>${escapeHtml(week.summary || "Resumo pedagógico ainda não cadastrado para esta semana.").replace(/\n/g, "<br>")}</p>
            </div>

            ${
              week.notes
                ? `
                  <div class="week-notes">
                    <strong>Objetivos e observações</strong>
                    <p>${escapeHtml(week.notes).replace(/\n/g, "<br>")}</p>
                  </div>
                `
                : ""
            }

            <div class="week-lessons">
              ${lessonsHTML}
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  const lessonTabsHTML = buildLessonTabsHTML(currentLesson);

  const videoHTML = currentLesson?.embedUrl
    ? `
      <div class="video-card">
        <div class="video-player video-embed">
          <iframe
            src="${escapeHtml(currentLesson.embedUrl)}"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <div class="video-info">
          <div class="video-meta">
            <span class="meta-pill primary">${escapeHtml(course.category)}</span>
            <span class="meta-pill ghost">Semana ${currentLesson.week} • Aula ${currentLesson.lessonOrder}</span>
          </div>

          <h2>${escapeHtml(currentLesson.title)}</h2>
          <p>${escapeHtml(currentLesson.desc || currentLesson.level || "Conteúdo EAD")}</p>

          <div class="action-row">
            <button type="button" class="mark-done" data-mark-done>
              ${icons.check}
              ${currentLesson.completed ? "Concluída" : "Marcar como concluída"}
            </button>

            <span class="provider-pill">${escapeHtml(currentLesson.provider || "Aula EAD")}</span>
          </div>
        </div>
      </div>
    `
    : `
      <div class="video-card">
        <div class="video-player">
          <div class="video-bg">
            <div class="video-empty-center">
              <span class="video-empty-icon">${icons.playCircle}</span>
              <p class="video-empty-text">Selecione uma aula para começar</p>
            </div>
          </div>
        </div>

        <div class="video-info">
          <div class="video-meta">
            <span class="meta-pill primary">${escapeHtml(course.category)}</span>
            <span class="meta-pill ghost">Aguardando seleção</span>
          </div>

          <h2>${escapeHtml(course.title)}</h2>
          <p>O player será exibido aqui quando houver uma aula válida selecionada.</p>
        </div>
      </div>
    `;

  app.innerHTML = `
    <div class="ead-root">
      <header class="course-header">
        <div class="container">
          <button type="button" class="back-btn" data-go-home>
            ${icons.arrowLeft}
            <span>Voltar</span>
          </button>

          <div class="divider"></div>

          <div class="logo">
            <span class="logo-primary">IIN</span>
          </div>
        </div>
      </header>

      <div class="container">
        <div class="course-layout">
          <div class="video-area">
            <section class="course-hero-box">
              <h1>${escapeHtml(course.title)}</h1>
              <p>${escapeHtml(course.description)}</p>

              <div class="course-hero-meta">
                <span>${course.totalWeeks} semanas com conteúdo</span>
                <span>${course.completedLessons}/${course.totalLessons} aulas concluídas</span>
              </div>
            </section>

            ${videoHTML}

            <section class="detail-card">
              ${lessonTabsHTML}
            </section>
          </div>

          <aside class="sidebar">
            <div class="sidebar-inner">
              <h2 class="sidebar-title">${escapeHtml(course.title)}</h2>
              <p class="sidebar-subtitle">${course.completedLessons} de ${course.totalLessons} aulas concluídas</p>

              <div class="lesson-list">
                ${weeksHTML}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;

  app.querySelector("[data-go-home]")?.addEventListener("click", () => goHome(ctx));

  app.querySelectorAll("[data-ead-week]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextWeekKey = button.getAttribute("data-ead-week");
      const week = weeks.find((item) => item.key === nextWeekKey);

      if (!week) {
        goHome(ctx);
        return;
      }

      currentWeekKey = currentWeekKey === nextWeekKey ? null : nextWeekKey;
      renderCoursePage(ctx, courseId);
    });
  });

  app.querySelectorAll("[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      const lessonId = button.getAttribute("data-lesson");
      const lesson = findLessonInContext(ctx, lessonId);

      if (!lesson || lesson.courseId !== courseId) {
        goHome(ctx);
        return;
      }

      currentLessonId = lessonId;
      currentWeekKey = lesson.weekKey;
      renderCoursePage(ctx, courseId);
    });
  });

  app.querySelector("[data-mark-done]")?.addEventListener("click", () => {
    if (!currentLesson) return;
    markLessonDone(ctx, currentLesson.id);
  });

  app.querySelectorAll("[data-ead-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-ead-tab");

      app.querySelectorAll("[data-ead-tab]").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-ead-tab") === tab);
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
  const userProgress = progress[sessionUserId] || { completed: {} };
  userProgress.completed = userProgress.completed || {};
  userProgress.completed[lessonId] = true;
  progress[sessionUserId] = userProgress;
  saveProgress(progress);

  const nextCtx = buildContextFromStorage();
  renderCoursePage(nextCtx, currentCourseId);
}

function openCourse(ctx, courseId) {
  const course = getCourseById(ctx, courseId);
  if (!course) {
    goHome(ctx);
    return;
  }

  currentPage = "course";
  currentCourseId = courseId;
  currentWeekKey = course.weeks[0]?.key || null;
  currentLessonId = course.weeks.find((week) => week.lessons.length)?.lessons[0]?.id || null;
  renderCoursePage(ctx, courseId);
  window.scrollTo(0, 0);
}

function goHome(ctx) {
  currentPage = "home";
  currentCourseId = null;
  currentLessonId = null;
  currentWeekKey = null;
  renderHome(ctx);
  window.scrollTo(0, 0);
}

function buildContextFromStorage() {
  const session = readSession();
  const userId = session.sessionUserId || "anon";
  const user = getCurrentUser(session.currentProjectKey, session.sessionUserId);
  const built = buildCourses(session.currentProjectKey, userId, user);

  return {
    ...built,
    user,
    userId,
    projectKey: session.currentProjectKey,
  };
}

function openLessonById(lessonId) {
  const ctx = buildContextFromStorage();
  const lesson = findLessonInContext(ctx, lessonId);

  if (!lesson) {
    goHome(ctx);
    return false;
  }

  const course = getCourseById(ctx, lesson.courseId);
  if (!course) {
    goHome(ctx);
    return false;
  }

  currentPage = "course";
  currentCourseId = lesson.courseId;
  currentWeekKey = lesson.weekKey;
  currentLessonId = lesson.id;
  renderCoursePage(ctx, lesson.courseId);
  return true;
}

window.openEadLessonById = openLessonById;

window.mountEadPlatform = function mountEadPlatform(options = {}) {
  const app = getEadApp();
  if (!app) return;

  const ctx = buildContextFromStorage();

  if (options?.lessonId) {
    if (openLessonById(options.lessonId)) return;
  }

  if (currentPage === "course" && currentCourseId) {
    const course = getCourseById(ctx, currentCourseId);
    if (course) {
      renderCoursePage(ctx, currentCourseId);
      return;
    }
  }

  goHome(ctx);
};