/* ============ APROVAÇÃO 90 · modelo de dados ============ */

export type Status = "nao_iniciado" | "em_estudo" | "revisar" | "concluido";
export type Importance = "alta" | "media" | "baixa";
export type ErrorType = "conteudo" | "interpretacao" | "atencao" | "estrategia" | "memorizacao";
export type SessionKind = "teoria" | "questoes" | "revisao" | "simulado";

export const STATUS_LIST: { value: Status; label: string; color: string; pct: number }[] = [
  { value: "nao_iniciado", label: "Não iniciado", color: "#66716b", pct: 0 },
  { value: "em_estudo", label: "Em estudo", color: "#5cb3ff", pct: 40 },
  { value: "revisar", label: "Revisar", color: "#f5b84b", pct: 70 },
  { value: "concluido", label: "Concluído", color: "#38ff8a", pct: 100 },
];

export const statusMeta = (s: Status) => STATUS_LIST.find((x) => x.value === s) ?? STATUS_LIST[0];

export const LEVEL_LIST = ["Iniciante", "Intermediário", "Avançado"];
export const IMPORTANCE_LIST = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
] as const;
export const DIFFICULTY_LIST = ["Muito baixa", "Baixa", "Média", "Alta", "Muito alta"];
export const ERROR_LIST: { value: ErrorType; label: string }[] = [
  { value: "conteudo", label: "Conteúdo" },
  { value: "interpretacao", label: "Interpretação" },
  { value: "atencao", label: "Atenção" },
  { value: "estrategia", label: "Estratégia" },
  { value: "memorizacao", label: "Memorização" },
];
export const KIND_LABEL: Record<SessionKind, string> = {
  teoria: "Teoria",
  questoes: "Questões",
  revisao: "Revisão",
  simulado: "Simulado",
};

export const PHASES = [
  { key: "construcao", label: "Construção", color: "#38ff8a", desc: "Teoria + questões — formando a base." },
  { key: "consolidacao", label: "Consolidação", color: "#f5b84b", desc: "Questões + revisões — fixando o conteúdo." },
  { key: "aperfeicoamento", label: "Aperfeiçoamento", color: "#fb923c", desc: "Questões + simulados + pontos fracos." },
  { key: "reta_final", label: "Reta final", color: "#f0655f", desc: "Revisão + questões + simulados." },
] as const;

/* ============ entidades ============ */

export interface Subject {
  id: string;
  name: string;
  short: string;
  color: string;
  weight: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  status: Status;
  importance: Importance;
  difficulty: number; // 1–5
  questions: number;
  correct: number;
}

export interface QuestionLog {
  id: string;
  date: string;
  subjectId: string;
  topicId: string;
  total: number;
  correct: number;
  errors: ErrorType[];
  source: string;
}

export interface StudySession {
  id: string;
  date: string;
  subjectId: string;
  topicId?: string;
  minutes: number;
  kind: SessionKind;
  note?: string;
}

export interface Review {
  id: string;
  subjectId: string;
  topicId: string;
  stage: 1 | 2 | 3;
  due: string;
  done: boolean;
  doneOn?: string;
}

export interface PlannerSlot {
  id: string;
  day: number; // 0=segunda … 6=domingo
  subjectId: string;
  topicId?: string;
  label: string;
  minutes: number;
  kind: SessionKind;
}

/* ============ módulo 11 · Simulados ============ */

export interface PastExam {
  id: string;
  name: string;
  banca: string;
  year: number;
  link?: string;
  distribution: Record<string, number>; // subjectId → nº de questões
}

export interface MockSubjectPlan {
  subjectId: string;
  questions: number;
  topics: { topicId: string; questions: number }[];
}

export interface MockPlan {
  id: string;
  name: string;
  createdAt: string;
  bancaRef: string;
  totalQuestions: number;
  timeMinutes: number;
  basedOn: string[];
  distribution: MockSubjectPlan[];
  status: "planejado" | "concluido";
  results?: Record<string, { correct: number; total: number }>;
}

/* ============ módulo 10 · IA ============ */

export type AiMode = "flashcards" | "quiz" | "resumo";

export interface AiResult {
  id: string;
  date: string;
  subjectId: string;
  topicId?: string;
  mode: AiMode;
  score: number;
  total: number;
}

/* ============ configurações ============ */

export interface Settings {
  concurso: string;
  cargo: string;
  banca: string;
  examDate: string;
  weeklyGoalHours: number;
  courseGoalHours: number;
  intervals: [number, number, number];
  thresholds: { green: number; yellow: number };
  weights: { edital: number; questoes: number; consistencia: number; revisoes: number; metas: number };
}

/* ---------- importador de edital ---------- */

export interface ImportPlanItem {
  subjectId?: string; // mapeado para disciplina existente
  subjectName?: string; // cria nova disciplina (quando sem subjectId)
  topics: { name: string }[];
}

export type ImportMode = "add" | "replace";

export interface AppState {
  subjects: Subject[];
  topics: Topic[];
  questionLogs: QuestionLog[];
  sessions: StudySession[];
  reviews: Review[];
  planner: PlannerSlot[];
  plannerDone: string[];
  focusDone: string[];
  pastExams: PastExam[];
  mocks: MockPlan[];
  aiResults: AiResult[];
  startedAt: string;
  settings: Settings;
}
