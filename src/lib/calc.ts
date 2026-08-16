import type { AppState, Subject, Topic } from "./types";
import { statusMeta, PHASES } from "./types";

/* ============ formatadores ============ */

export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDaysD = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const mondayOf = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0=segunda
  x.setDate(x.getDate() - day);
  return x;
};

export const fmtMin = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}min`;
  return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, "0")}`;
};

export const fmtNum = (n: number) => n.toLocaleString("pt-BR");

export const fmtPct = (v: number, digits = 1) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;

export const fmtDay = (iso: string) => {
  const d = parseISO(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const fmtFull = (iso: string) => {
  const d = parseISO(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

export type Tone = "green" | "yellow" | "red" | "gray";

export const TONE_COLOR: Record<Tone, string> = {
  green: "#38ff8a",
  yellow: "#f5b84b",
  red: "#f0655f",
  gray: "#66716b",
};

/* ============ tipos derivados ============ */

export interface SubjectRow {
  subject: Subject;
  topics: Topic[];
  topicsDone: number;
  progress: number;
  questions: number;
  correct: number;
  acc: number | null;
  tone: Tone;
}

export interface FocusItem {
  key: string;
  topic: Topic;
  subject: Subject;
  minutes: number;
  reason: string;
}

export interface Alert {
  subjectName: string;
  color: string;
  sev: "red" | "yellow" | "green";
  title: string;
  detail: string;
  rec: string;
  gotoSubject: string;
}

export interface Stats {
  todayISO: string;
  daysLeft: number;
  phaseIndex: number;

  topicsTotal: number;
  topicsDone: number;
  editalPct: number;

  hoursTotalMin: number;
  weekMinutes: number;

  questionsTotal: number;
  correctTotal: number;
  accTotal: number;

  reviewsTotal: number;
  reviewsDone: number;
  reviewsPct: number;
  dueToday: number;
  overdue: number;

  streak: number;
  bestStreak: number;
  last14: { date: string; minutes: number }[];

  rows: SubjectRow[];
  weeks: { label: string; questions: number; acc: number | null; current: boolean }[];

  indexScore: number;
  indexBand: { label: string; color: string; desc: string };
  indexParts: { key: string; label: string; weight: number; value: number }[];

  alerts: Alert[];
  focus: FocusItem[];
}

/* ============ motor ============ */

export function computeStats(state: AppState): Stats {
  const now = new Date();
  const todayISO = isoOf(now);
  const cfg = state.settings;

  const exam = parseISO(cfg.examDate);
  const daysLeft = Math.max(0, Math.ceil((exam.getTime() - parseISO(todayISO).getTime()) / 86400000));
  const phaseIndex = daysLeft > 120 ? 0 : daysLeft > 60 ? 1 : daysLeft > 21 ? 2 : 3;

  /* ---- edital ---- */
  const topicsTotal = state.topics.length;
  const progressOf = (t: Topic) => statusMeta(t.status).pct;
  const editalPct = topicsTotal
    ? Math.round(state.topics.reduce((a, t) => a + progressOf(t), 0) / topicsTotal)
    : 0;
  const topicsDone = state.topics.filter((t) => t.status === "concluido").length;

  /* ---- horas ---- */
  const hoursTotalMin = state.sessions.reduce((a, x) => a + x.minutes, 0);
  const monday = isoOf(mondayOf(now));
  const weekMinutes = state.sessions
    .filter((x) => x.date >= monday && x.date <= todayISO)
    .reduce((a, x) => a + x.minutes, 0);

  /* ---- questões ---- */
  const questionsTotal = state.questionLogs.reduce((a, x) => a + x.total, 0);
  const correctTotal = state.questionLogs.reduce((a, x) => a + x.correct, 0);
  const accTotal = questionsTotal ? (correctTotal / questionsTotal) * 100 : 0;

  /* ---- revisões ---- */
  const reviewsTotal = state.reviews.length;
  const reviewsDone = state.reviews.filter((r) => r.done).length;
  const reviewsPct = reviewsTotal ? Math.round((reviewsDone / reviewsTotal) * 100) : 0;
  const dueToday = state.reviews.filter((r) => !r.done && r.due === todayISO).length;
  const overdue = state.reviews.filter((r) => !r.done && r.due < todayISO).length;

  /* ---- regularidade ---- */
  const minutesByDay = new Map<string, number>();
  state.sessions.forEach((x) => minutesByDay.set(x.date, (minutesByDay.get(x.date) ?? 0) + x.minutes));

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = isoOf(addDaysD(now, -i));
    if ((minutesByDay.get(d) ?? 0) > 0) streak++;
    else if (i === 0) continue; // hoje ainda pode estudar
    else break;
  }

  let bestStreak = 0;
  let run = 0;
  for (let i = 399; i >= 0; i--) {
    const d = isoOf(addDaysD(now, -i));
    if ((minutesByDay.get(d) ?? 0) > 0) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else run = 0;
  }
  bestStreak = Math.max(bestStreak, streak);

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = isoOf(addDaysD(now, -(13 - i)));
    return { date: d, minutes: minutesByDay.get(d) ?? 0 };
  });

  /* ---- linhas por disciplina ---- */
  const rows: SubjectRow[] = state.subjects
    .filter((s) => s.id !== "sim")
    .map((subject) => {
      const topics = state.topics.filter((t) => t.subjectId === subject.id);
      const progress = topics.length
        ? Math.round(topics.reduce((a, t) => a + progressOf(t), 0) / topics.length)
        : 0;
      const questions = topics.reduce((a, t) => a + t.questions, 0);
      const correct = topics.reduce((a, t) => a + t.correct, 0);
      const acc = questions ? (correct / questions) * 100 : null;
      const tone: Tone =
        acc === null ? "gray" : acc >= cfg.thresholds.green ? "green" : acc >= cfg.thresholds.yellow ? "yellow" : "red";
      return {
        subject,
        topics,
        topicsDone: topics.filter((t) => t.status === "concluido").length,
        progress,
        questions,
        correct,
        acc,
        tone,
      };
    });

  /* ---- evolução semanal (últimas 4 semanas) ---- */
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = addDaysD(mondayOf(now), -(3 - i) * 7);
    const end = addDaysD(start, 6);
    const a = isoOf(start);
    const b = isoOf(end);
    const logs = state.questionLogs.filter((x) => x.date >= a && x.date <= b);
    const q = logs.reduce((acc, x) => acc + x.total, 0);
    const c = logs.reduce((acc, x) => acc + x.correct, 0);
    return {
      label: `S${i + 1}`,
      questions: q,
      acc: q ? (c / q) * 100 : null,
      current: i === 3,
    };
  });

  /* ---- Índice A90 ---- */
  const consistencyRaw = Math.min(1, streak / 7) * 70 + Math.min(1, bestStreak / 14) * 30;
  const goalMin = cfg.weeklyGoalHours * 60;
  const metaValue = Math.min(100, (weekMinutes / Math.max(1, goalMin)) * 100);

  const parts = [
    { key: "edital", label: "Progresso do edital", weight: cfg.weights.edital, value: editalPct },
    { key: "questoes", label: "Aproveitamento em questões", weight: cfg.weights.questoes, value: Math.round(accTotal) },
    { key: "consistencia", label: "Consistência", weight: cfg.weights.consistencia, value: Math.round(consistencyRaw) },
    { key: "revisoes", label: "Revisões em dia", weight: cfg.weights.revisoes, value: reviewsPct },
    { key: "metas", label: "Cumprimento de metas", weight: cfg.weights.metas, value: Math.round(metaValue) },
  ];
  const indexScore = Math.round(parts.reduce((a, p) => a + (p.value * p.weight) / 100, 0));

  const indexBand =
    indexScore >= 78
      ? { label: "Excelente ritmo", color: "#00ff68", desc: "Preparação consistente. Mantenha o plano e proteja a regularidade." }
      : indexScore >= 62
        ? { label: "Boa evolução", color: "#00ff68", desc: "Sua preparação está evoluindo, mas existem pontos que precisam de atenção." }
        : indexScore >= 45
          ? { label: "Em construção", color: "#f5b84b", desc: "A base está em formação. Concentre energia nos alertas vermelhos." }
          : { label: "Em risco", color: "#f0655f", desc: "Reajuste o plano: menos frentes abertas, mais constância." };

  /* ---- alertas ---- */
  const alerts: Alert[] = [];
  for (const r of rows) {
    if (r.tone === "red") {
      alerts.push({
        subjectName: r.subject.name,
        color: r.subject.color,
        sev: "red",
        title: `Aproveitamento de ${fmtPct(r.acc ?? 0)}.`,
        detail: `Abaixo da meta de ${cfg.thresholds.yellow}%. ${r.questions} questões resolvidas.`,
        rec: "Aumentar o número de questões e revisar os assuntos com maior índice de erro.",
        gotoSubject: r.subject.id,
      });
    } else if (r.tone === "yellow") {
      alerts.push({
        subjectName: r.subject.name,
        color: r.subject.color,
        sev: "yellow",
        title: `Progresso do edital em ${r.progress}%.`,
        detail: `Aproveitamento de ${fmtPct(r.acc ?? 0)} — dentro da zona de atenção.`,
        rec: "Priorizar os tópicos ainda não estudados e manter o ritmo de questões.",
        gotoSubject: r.subject.id,
      });
    } else if (r.tone === "green" && r.acc !== null) {
      alerts.push({
        subjectName: r.subject.name,
        color: r.subject.color,
        sev: "green",
        title: `Aproveitamento de ${fmtPct(r.acc)}.`,
        detail: "Acima da meta de consolidação.",
        rec: "Manter o ritmo e priorizar questões de maior dificuldade.",
        gotoSubject: r.subject.id,
      });
    }
  }
  alerts.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === "red" ? -1 : b.sev === "red" ? 1 : a.sev === "yellow" ? -1 : 1));

  /* ---- foco de hoje ---- */
  const doneToday = new Set(state.focusDone.filter((k) => k.startsWith(todayISO)).map((k) => k.split(":")[1]));
  const impW = { alta: 3, media: 2, baixa: 1 } as const;
  const scored = state.topics
    .filter((t) => t.status !== "concluido" && !doneToday.has(t.id))
    .map((t) => {
      const sub = state.subjects.find((x) => x.id === t.subjectId)!;
      const row = rows.find((r) => r.subject.id === t.subjectId);
      const accPenalty = row?.acc != null ? (100 - row.acc) / 100 : 0.5;
      const score = impW[t.importance] * sub.weight * (1 + t.difficulty * 0.15) * (1 + accPenalty);
      const reason =
        row?.tone === "red"
          ? "disciplina crítica"
          : t.importance === "alta"
            ? "alta importância no edital"
            : "dificuldade elevada";
      return { t, sub, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const focus: FocusItem[] = scored.map(({ t, sub, reason }) => ({
    key: `${todayISO}:${t.id}`,
    topic: t,
    subject: sub,
    minutes: t.difficulty >= 4 ? 60 : 45,
    reason,
  }));

  return {
    todayISO,
    daysLeft,
    phaseIndex,
    topicsTotal,
    topicsDone,
    editalPct,
    hoursTotalMin,
    weekMinutes,
    questionsTotal,
    correctTotal,
    accTotal,
    reviewsTotal,
    reviewsDone,
    reviewsPct,
    dueToday,
    overdue,
    streak,
    bestStreak,
    last14,
    rows,
    weeks,
    indexScore,
    indexBand,
    indexParts: parts,
    alerts,
    focus,
  };
}

export { PHASES };
