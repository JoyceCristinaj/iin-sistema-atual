"use strict";

// ✅ AULAS (EAD) - suporte a YouTube e Google Drive
function normalizeVideoUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return { ok: false, error: "Cole um link de vídeo." };

  // YouTube (watch?v= / youtu.be / shorts)
  const ytMatch =
    raw.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);

  if (ytMatch) {
    const id = ytMatch[1];
    return {
      ok: true,
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Google Drive (file/d/ID/view)
  const gdMatch =
    raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/i) ||
    raw.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,})/i) ||
    raw.match(/drive\.google\.com\/uc\?id=([A-Za-z0-9_-]{10,})/i);

  if (gdMatch) {
    const id = gdMatch[1];
    return {
      ok: true,
      provider: "gdrive",
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      thumb: "",
    };
  }

  return { ok: false, error: "Link inválido. Use YouTube ou Google Drive (arquivo de vídeo)." };
}

function ensureLessonsBag(projectKey = state.currentProjectKey) {
  if (!state.lessonsByProject[projectKey]) state.lessonsByProject[projectKey] = [];
  return state.lessonsByProject[projectKey];
}

// ✅ AULAS (EAD) - modalidades canônicas e regras pedagógicas
const EAD_MODALITIES = ["Boxe", "Muay Thai", "Jiu Jitso"];
const LESSON_CATEGORIES = EAD_MODALITIES.slice();

const EAD_PEDAGOGY = Object.freeze({
  Boxe: { maxWeeks: 52, maxLessonsPerWeek: 2 },
  "Muay Thai": { maxWeeks: 52, maxLessonsPerWeek: 2 },
  "Jiu Jitso": { maxWeeks: 54, maxLessonsPerWeek: 3 },
});

const EAD_ALLOWED_CATEGORIES_BY_NUCLEUS = Object.freeze({
  Jacarezinho: ["Muay Thai", "Jiu Jitso"],
  Penha: ["Jiu Jitso"],
  "Santa Cruz": ["Boxe"],
  "Campo Grande": ["Jiu Jitso"],
  Freguesia: ["Jiu Jitso"],
  Realengo: ["Boxe"],
});

function normalizeEadCategory(rawCategory) {
  const text = normText(rawCategory);
  if (!text) return "";
  if (text.includes("box")) return "Boxe";
  if (text.includes("muay")) return "Muay Thai";
  if (text.includes("jiu")) return "Jiu Jitso";
  return "";
}

function getEadPedagogy(category) {
  const normalized = normalizeEadCategory(category);
  return EAD_PEDAGOGY[normalized] || EAD_PEDAGOGY["Muay Thai"];
}

function getAllowedEadCategoriesForUser(user = currentUser(), projectKey = state.currentProjectKey) {
  if (!user || ["admin", "gestao", "supervisao"].includes(user.role)) return EAD_MODALITIES.slice();
  if (user.role !== "professor") return EAD_MODALITIES.slice();

  const explicit = EAD_ALLOWED_CATEGORIES_BY_NUCLEUS[user.nucleus];
  if (Array.isArray(explicit) && explicit.length) return explicit.slice();

  return Array.from(
    new Set((PROJECT_MODALITIES[projectKey] || []).map(normalizeEadCategory).filter(Boolean))
  );
}

function canUserAccessEadCategory(category, user = currentUser(), projectKey = state.currentProjectKey) {
  const normalized = normalizeEadCategory(category);
  if (!normalized) return false;
  return getAllowedEadCategoriesForUser(user, projectKey).includes(normalized);
}

function findNextLessonSlot(usedSlots, category) {
  const rule = getEadPedagogy(category);
  for (let week = 1; week <= rule.maxWeeks; week += 1) {
    for (let lessonOrder = 1; lessonOrder <= rule.maxLessonsPerWeek; lessonOrder += 1) {
      const slotKey = `${week}:${lessonOrder}`;
      if (!usedSlots.has(slotKey)) return { week, lessonOrder };
    }
  }
  return null;
}

function ensureEadWeeksBag(projectKey = state.currentProjectKey) {
  if (!state.weeksByProject[projectKey]) state.weeksByProject[projectKey] = [];
  if (!Array.isArray(state.weeksByProject[projectKey])) state.weeksByProject[projectKey] = [];
  return state.weeksByProject[projectKey];
}

function sanitizeEadWeekEntry(entry, projectKey = state.currentProjectKey) {
  const category = normalizeEadCategory(entry?.category);
  if (!category) return null;

  const rule = getEadPedagogy(category);
  const week = Number.parseInt(entry?.week, 10);
  if (!Number.isInteger(week) || week < 1 || week > rule.maxWeeks) return null;

  return {
    id: entry?.id || crypto.randomUUID(),
    project: entry?.project || projectKey,
    category,
    week,
    title: String(entry?.title || "").trim(),
    summary: String(entry?.summary || "").trim(),
    notes: String(entry?.notes || "").trim(),
    updatedAt: entry?.updatedAt || new Date().toISOString(),
  };
}

function sanitizeEadLessonEntry(entry, projectKey = state.currentProjectKey) {
  const normalizedCategory = normalizeEadCategory(entry?.category);
  const rawCategory = String(entry?.category || "").trim();
  const category = normalizedCategory || rawCategory;
  const rule = normalizedCategory ? getEadPedagogy(normalizedCategory) : null;

  const rawWeek = Number.parseInt(entry?.week, 10);
  const rawOrder = Number.parseInt(entry?.lessonOrder ?? entry?.order, 10);

  const hasValidWeek = Boolean(rule && Number.isInteger(rawWeek) && rawWeek >= 1 && rawWeek <= rule.maxWeeks);
  const hasValidOrder = Boolean(
    rule &&
    Number.isInteger(rawOrder) &&
    rawOrder >= 1 &&
    rawOrder <= rule.maxLessonsPerWeek
  );

  return {
    id: entry?.id || crypto.randomUUID(),
    project: entry?.project || projectKey,
    title: String(entry?.title || "").trim() || "Aula sem título",
    category,
    level: String(entry?.level || "").trim(),
    week: hasValidWeek ? rawWeek : null,
    lessonOrder: hasValidOrder ? rawOrder : null,
    desc: String(entry?.desc || "").trim(),
    extra: String(entry?.extra || "").trim(),
    provider: String(entry?.provider || "").trim(),
    embedUrl: String(entry?.embedUrl || "").trim(),
    thumb: String(entry?.thumb || "").trim(),
    createdAt: entry?.createdAt || new Date().toISOString(),
  };
}

function normalizeEadData(projectKey = state.currentProjectKey) {
  const weekBag = ensureEadWeeksBag(projectKey);
  const weekMap = new Map();

  weekBag.forEach((entry) => {
    const sanitized = sanitizeEadWeekEntry(entry, projectKey);
    if (!sanitized) return;
    weekMap.set(`${sanitized.category}|${sanitized.week}`, sanitized);
  });

  state.weeksByProject[projectKey] = Array.from(weekMap.values()).sort((a, b) => {
    const byCategory = a.category.localeCompare(b.category, "pt-BR");
    if (byCategory !== 0) return byCategory;
    return a.week - b.week;
  });

  const rawLessons = Array.isArray(state.lessonsByProject[projectKey]) ? state.lessonsByProject[projectKey] : [];
  const canonicalByCategory = Object.fromEntries(EAD_MODALITIES.map((category) => [category, []]));
  const legacyLessons = [];

  rawLessons.forEach((entry) => {
    const sanitized = sanitizeEadLessonEntry(entry, projectKey);
    const canonicalCategory = normalizeEadCategory(sanitized.category);

    if (!canonicalCategory) {
      legacyLessons.push(sanitized);
      return;
    }

    sanitized.category = canonicalCategory;
    canonicalByCategory[canonicalCategory].push(sanitized);
  });

  const normalizedLessons = [];

  EAD_MODALITIES.forEach((category) => {
    const lessons = canonicalByCategory[category]
      .slice()
      .sort((a, b) =>
        String(a.createdAt || "").localeCompare(String(b.createdAt || "")) ||
        String(a.title || "").localeCompare(String(b.title || ""), "pt-BR")
      );

    const usedSlots = new Set();

    lessons.forEach((lesson) => {
      if (lesson.week && lesson.lessonOrder) {
        const key = `${lesson.week}:${lesson.lessonOrder}`;
        if (!usedSlots.has(key)) {
          usedSlots.add(key);
          normalizedLessons.push(lesson);
          return;
        }
      }

      const nextSlot = findNextLessonSlot(usedSlots, category);
      if (nextSlot) {
        lesson.week = nextSlot.week;
        lesson.lessonOrder = nextSlot.lessonOrder;
        usedSlots.add(`${nextSlot.week}:${nextSlot.lessonOrder}`);
      } else {
        lesson.week = null;
        lesson.lessonOrder = null;
      }

      normalizedLessons.push(lesson);
    });
  });

  state.lessonsByProject[projectKey] = normalizedLessons
    .concat(legacyLessons)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

window.IIN_EAD = {
  STORAGE_KEY,
  SESSION_KEY,
  categories: EAD_MODALITIES.slice(),
  pedagogy: EAD_PEDAGOGY,
  allowedByNucleus: EAD_ALLOWED_CATEGORIES_BY_NUCLEUS,
  normalizeCategory: normalizeEadCategory,
  getPedagogy: getEadPedagogy,
  getAllowedCategoriesForUser: getAllowedEadCategoriesForUser,
  canUserAccessCategory: canUserAccessEadCategory,
};

