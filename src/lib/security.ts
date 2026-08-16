import type { AppState } from "./types";

/* ============ camada de segurança (dados do próprio usuário) ============ */

/** Só permite http(s). Bloqueia javascript:, data:, vbscript: etc. */
export function sanitizeUrl(u: string | undefined | null): string | undefined {
  if (!u) return undefined;
  const s = u.trim();
  if (!s) return undefined;
  try {
    const parsed = new URL(s, "https://placeholder.local");
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    return undefined;
  }
  return undefined;
}

export function sanitizeText(t: unknown, max: number): string {
  if (typeof t !== "string") return "";
  return t.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max).trim();
}

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function safeId(prefix: string): string {
  try {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function isStrArr(a: unknown): a is string[] {
  return Array.isArray(a) && a.every((x) => typeof x === "string");
}

/** Saneia todo o estado persistido antes de confiá-lo ao app. */
export function sanitizeState(raw: unknown, fresh: AppState): AppState {
  if (!raw || typeof raw !== "object") return fresh;
  const p = raw as Record<string, unknown>;
  const out: AppState = { ...fresh };

  if (Array.isArray(p.subjects) && p.subjects.length) out.subjects = p.subjects;
  if (Array.isArray(p.topics) && p.topics.length) out.topics = p.topics;
  if (Array.isArray(p.questionLogs)) out.questionLogs = p.questionLogs;
  if (Array.isArray(p.sessions)) out.sessions = p.sessions;
  if (Array.isArray(p.reviews)) out.reviews = p.reviews;
  if (Array.isArray(p.planner) && p.planner.length) out.planner = p.planner;
  if (isStrArr(p.plannerDone)) out.plannerDone = p.plannerDone;
  if (isStrArr(p.focusDone)) out.focusDone = p.focusDone;
  if (Array.isArray(p.pastExams) && p.pastExams.length) out.pastExams = p.pastExams;
  if (Array.isArray(p.mocks)) out.mocks = p.mocks;
  if (Array.isArray(p.aiResults)) out.aiResults = p.aiResults;
  if (typeof p.startedAt === "string" && ISO_RE.test(p.startedAt)) out.startedAt = p.startedAt;

  if (p.settings && typeof p.settings === "object") {
    const s = p.settings as Record<string, unknown>;
    const fs = fresh.settings;
    const merged = { ...fs, ...s };
    merged.concurso = sanitizeText(merged.concurso, 40) || fs.concurso;
    merged.cargo = sanitizeText(merged.cargo, 40) || fs.cargo;
    merged.banca = sanitizeText(merged.banca, 30) || fs.banca;
    merged.examDate =
      typeof merged.examDate === "string" && ISO_RE.test(merged.examDate) ? merged.examDate : fs.examDate;
    merged.weeklyGoalHours = clampInt(merged.weeklyGoalHours, 1, 168, fs.weeklyGoalHours);
    merged.courseGoalHours = clampInt(merged.courseGoalHours, 10, 5000, fs.courseGoalHours);
    if (Array.isArray(merged.intervals) && merged.intervals.length === 3) {
      merged.intervals = merged.intervals.map((x, i) => clampInt(x, 1, 365, fs.intervals[i])) as [
        number,
        number,
        number,
      ];
    }
    out.settings = merged;
  }

  return out;
}
