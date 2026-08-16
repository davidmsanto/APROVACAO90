import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AiResult,
  AppState,
  ErrorType,
  MockPlan,
  PastExam,
  PlannerSlot,
  QuestionLog,
  Settings,
  Status,
  StudySession,
  Topic,
} from "./types";
import { buildSeed, addDays, iso } from "./seed";
import { computeStats, type Stats } from "./calc";
import { sanitizeState, sanitizeText, clampInt, safeId } from "./security";

const KEY = "aprovacao90:v1";

export type TabId =
  | "inicio"
  | "dashboard"
  | "edital"
  | "planejador"
  | "questoes"
  | "revisoes"
  | "metas"
  | "config"
  | "materiais"
  | "ia"
  | "simulados";

export interface Toast {
  id: number;
  msg: string;
  tone: "green" | "amber" | "red" | "blue";
}

interface Store {
  state: AppState;
  stats: Stats;
  tab: TabId;
  setTab: (t: TabId) => void;
  editalFilter: string | null;
  setEditalFilter: (s: string | null) => void;
  toasts: Toast[];
  notify: (msg: string, tone?: Toast["tone"]) => void;

  addQuestionLog: (
    d: { subjectId: string; topicId: string; total: number; correct: number; errors: ErrorType[]; source: string },
    opts?: { review?: boolean },
  ) => void;
  completeReview: (id: string) => void;
  setTopicStatus: (topicId: string, status: Status) => void;
  addTopic: (subjectId: string, name: string) => void;
  togglePlanner: (dateISO: string, slot: PlannerSlot) => void;
  toggleFocus: (item: { key: string; topic: Topic; minutes: number }) => void;
  updateSettings: (s: Settings) => void;
  resetAll: () => void;
  addVideoSession: (d: { subjectId: string; topicId?: string; minutes: number; note: string }) => void;
  addAiResult: (d: { subjectId: string; topicId?: string; mode: AiResult["mode"]; score: number; total: number }) => void;
  addPastExam: (d: Omit<PastExam, "id">) => void;
  removePastExam: (id: string) => void;
  addMock: (m: MockPlan) => void;
  updateMock: (id: string, patch: Partial<MockPlan>) => void;
  removeMock: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

function load(): AppState {
  const fresh = buildSeed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: AppState =
        parsed && typeof parsed === "object"
          ? {
              ...fresh,
              ...(parsed as Partial<AppState>),
              settings: { ...fresh.settings, ...((parsed as Partial<AppState>).settings ?? {}) },
            }
          : fresh;
      return sanitizeState(merged, fresh);
    }
  } catch {
    /* payload inválido → seed */
  }
  return fresh;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [tab, setTab] = useState<TabId>("inicio");
  const [editalFilter, setEditalFilter] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useMemo(() => ({ current: 0 }), []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state]);

  const notify = useCallback((msg: string, tone: Toast["tone"] = "green") => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, [tid]);

  const today = iso(new Date());

  const addQuestionLog: Store["addQuestionLog"] = useCallback(
    (d, opts) => {
      setState((s) => {
        const total = clampInt(d.total, 0, 100000, 0);
        const correct = clampInt(d.correct, 0, total, 0);
        if (total <= 0) return s;
        const log: QuestionLog = {
          id: `uq-${safeId("q")}`,
          date: today,
          subjectId: d.subjectId,
          topicId: d.topicId,
          total,
          correct,
          errors: Array.isArray(d.errors) ? d.errors.slice(0, 10) : [],
          source: sanitizeText(d.source ?? "Banco de questões", 60),
        };
        const [r1] = s.settings.intervals;
        const reviews =
          opts?.review === false
            ? s.reviews
            : [
                ...s.reviews,
                {
                  id: `ur-${safeId("r")}`,
                  subjectId: d.subjectId,
                  topicId: d.topicId,
                  stage: 1 as const,
                  due: iso(addDays(new Date(), r1)),
                  done: false,
                },
              ];
        return {
          ...s,
          questionLogs: [...s.questionLogs, log],
          topics: s.topics.map((t) =>
            t.id === d.topicId ? { ...t, questions: t.questions + total, correct: t.correct + correct } : t,
          ),
          reviews,
        };
      });
    },
    [today],
  );

  const completeReview: Store["completeReview"] = useCallback(
    (id) => {
      setState((s) => {
        const rev = s.reviews.find((r) => r.id === id);
        if (!rev || rev.done) return s;
        const next = [...s.reviews.map((r) => (r.id === id ? { ...r, done: true, doneOn: today } : r))];
        if (rev.stage < 3) {
          const gap = s.settings.intervals[rev.stage === 1 ? 1 : 2];
          next.push({
            id: `ur-${safeId("r")}`,
            subjectId: rev.subjectId,
            topicId: rev.topicId,
            stage: (rev.stage + 1) as 1 | 2 | 3,
            due: iso(addDays(new Date(), gap)),
            done: false,
          });
        }
        return { ...s, reviews: next };
      });
    },
    [today],
  );

  const setTopicStatus: Store["setTopicStatus"] = useCallback((topicId, status) => {
    setState((s) => ({
      ...s,
      topics: s.topics.map((t) => (t.id === topicId ? { ...t, status } : t)),
    }));
  }, []);

  const addTopic: Store["addTopic"] = useCallback((subjectId, name) => {
    setState((s) => ({
      ...s,
      topics: [
        ...s.topics,
        {
          id: `${subjectId}-${safeId("t")}`,
          subjectId,
          name: sanitizeText(name, 80),
          status: "nao_iniciado",
          importance: "media",
          difficulty: 3,
          questions: 0,
          correct: 0,
        },
      ],
    }));
  }, []);

  const togglePlanner: Store["togglePlanner"] = useCallback((dateISO, slot) => {
    setState((s) => {
      const key = `${dateISO}:${slot.id}`;
      const done = s.plannerDone.includes(key);
      const sessId = `plan:${key}`;
      if (done) {
        return {
          ...s,
          plannerDone: s.plannerDone.filter((k) => k !== key),
          sessions: s.sessions.filter((x) => x.id !== sessId),
        };
      }
      const sess: StudySession = {
        id: sessId,
        date: dateISO,
        subjectId: slot.subjectId,
        topicId: slot.topicId,
        minutes: slot.minutes,
        kind: slot.kind,
      };
      return { ...s, plannerDone: [...s.plannerDone, key], sessions: [...s.sessions, sess] };
    });
  }, []);

  const toggleFocus: Store["toggleFocus"] = useCallback((item) => {
    setState((s) => {
      const done = s.focusDone.includes(item.key);
      const sess: StudySession = {
        id: `focus:${item.key}`,
        date: item.key.split(":")[0],
        subjectId: item.topic.subjectId,
        topicId: item.topic.id,
        minutes: item.minutes,
        kind: "questoes",
      };
      return {
        ...s,
        focusDone: done ? s.focusDone.filter((k) => k !== item.key) : [...s.focusDone, item.key],
        sessions: done ? s.sessions.filter((x) => x.id !== sess.id) : [...s.sessions, sess],
      };
    });
  }, []);

  const updateSettings = useCallback((settings: Settings) => {
    setState((s) => ({ ...s, settings }));
  }, []);

  const resetAll = useCallback(() => {
    setState(buildSeed());
  }, []);

  const addVideoSession: Store["addVideoSession"] = useCallback(
    ({ subjectId, topicId, minutes, note }) => {
      const mins = clampInt(minutes, 1, 24 * 60, 0);
      if (mins <= 0) return;
      setState((s) => ({
        ...s,
        sessions: [
          ...s.sessions,
          {
            id: `vid-${safeId("v")}`,
            date: today,
            subjectId,
            topicId,
            minutes: mins,
            kind: "teoria",
            note: sanitizeText(note, 120),
          },
        ],
      }));
    },
    [today],
  );

  const addAiResult: Store["addAiResult"] = useCallback(
    ({ subjectId, topicId, mode, score, total }) => {
      setState((s) => ({
        ...s,
        aiResults: [
          ...s.aiResults,
          {
            id: `ai-${safeId("a")}`,
            date: today,
            subjectId,
            topicId,
            mode,
            score: clampInt(score, 0, 100000, 0),
            total: clampInt(total, 0, 100000, 0),
          },
        ],
      }));
    },
    [today],
  );

  const addPastExam: Store["addPastExam"] = useCallback((d) => {
    setState((s) => ({
      ...s,
      pastExams: [
        ...s.pastExams,
        {
          ...d,
          id: `pe-${safeId("p")}`,
          name: sanitizeText(d.name, 60),
          banca: sanitizeText(d.banca, 40),
          year: clampInt(d.year, 1990, 2100, new Date().getFullYear()),
        },
      ],
    }));
  }, []);

  const removePastExam: Store["removePastExam"] = useCallback((id) => {
    setState((s) => ({ ...s, pastExams: s.pastExams.filter((p) => p.id !== id) }));
  }, []);

  const addMock: Store["addMock"] = useCallback((m) => {
    setState((s) => ({ ...s, mocks: [m, ...s.mocks] }));
  }, []);

  const updateMock: Store["updateMock"] = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      mocks: s.mocks.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const removeMock: Store["removeMock"] = useCallback((id) => {
    setState((s) => ({ ...s, mocks: s.mocks.filter((m) => m.id !== id) }));
  }, []);

  const stats = useMemo(() => computeStats(state), [state]);

  const value: Store = {
    state,
    stats,
    tab,
    setTab,
    editalFilter,
    setEditalFilter,
    toasts,
    notify,
    addQuestionLog,
    completeReview,
    setTopicStatus,
    addTopic,
    togglePlanner,
    toggleFocus,
    updateSettings,
    resetAll,
    addVideoSession,
    addAiResult,
    addPastExam,
    removePastExam,
    addMock,
    updateMock,
    removeMock,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore fora do provider");
  return ctx;
}
