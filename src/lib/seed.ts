import type {
  AppState,
  PastExam,
  PlannerSlot,
  QuestionLog,
  Review,
  StudySession,
  Subject,
  Topic,
} from "./types";

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const off = (n: number) => iso(addDays(new Date(), n));

/* rand determinístico por seed (dados demo estáveis) */
let s = 42;
const rnd = () => {
  s = (s * 1103515245 + 12345) % 2147483648;
  return s / 2147483648;
};
const ri = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

/* ============ disciplinas ============ */
export const SUBJECTS: Subject[] = [
  { id: "por", name: "Língua Portuguesa", short: "Português", color: "#5cb3ff", weight: 3 },
  { id: "rlm", name: "Raciocínio Lógico", short: "RLM", color: "#f5b84b", weight: 2 },
  { id: "inf", name: "Informática", short: "Informática", color: "#c9a2ff", weight: 2 },
  { id: "dpe", name: "Direito Penal", short: "D. Penal", color: "#f0655f", weight: 3 },
  { id: "dpp", name: "Direito Processual Penal", short: "D. Proc. Penal", color: "#fb923c", weight: 3 },
  { id: "dad", name: "Direito Administrativo", short: "D. Administrativo", color: "#38ff8a", weight: 3 },
  { id: "dcn", name: "Direito Constitucional", short: "D. Constitucional", color: "#4dd0e1", weight: 3 },
  { id: "lex", name: "Legislação Especial", short: "Legislação", color: "#a5b0aa", weight: 2 },
];

const T: Record<string, [string, 0 | 1 | 2, number][]> = {
  por: [
    ["Compreensão e interpretação de textos", 2, 2],
    ["Coesão e coerência", 1, 3],
    ["Ortografia oficial", 0, 2],
    ["Acentuação gráfica", 0, 1],
    ["Classes de palavras", 1, 2],
    ["Concordância verbal e nominal", 2, 3],
    ["Regência verbal e nominal", 2, 4],
    ["Crase", 2, 4],
    ["Pontuação", 1, 3],
    ["Sintaxe da oração e do período", 2, 3],
    ["Semântica e vocabulário", 1, 2],
    ["Redação oficial", 0, 2],
  ],
  rlm: [
    ["Proposições e conectivos", 2, 3],
    ["Tabela-verdade", 2, 3],
    ["Equivalências e negações", 2, 4],
    ["Argumentos e validade", 1, 4],
    ["Lógica de primeira ordem", 1, 4],
    ["Análise combinatória", 2, 4],
    ["Probabilidade", 1, 4],
    ["Sequências e padrões", 0, 3],
  ],
  inf: [
    ["Conceitos de internet e intranet", 1, 2],
    ["Navegadores", 0, 1],
    ["Correio eletrônico", 0, 1],
    ["Segurança da informação", 2, 3],
    ["Malwares e vírus", 1, 3],
    ["Backup e armazenamento", 0, 2],
    ["Sistemas operacionais", 1, 2],
    ["Pacote de escritório", 1, 2],
  ],
  dpe: [
    ["Princípios do Direito Penal", 1, 2],
    ["Aplicação da lei penal", 2, 3],
    ["Teoria do crime", 2, 4],
    ["Tipicidade e ilicitude", 2, 4],
    ["Culpabilidade", 1, 4],
    ["Concurso de pessoas", 1, 3],
    ["Penas e dosimetria", 2, 4],
    ["Crimes contra a pessoa", 2, 3],
    ["Crimes contra o patrimônio", 2, 3],
    ["Crimes contra a administração pública", 2, 4],
  ],
  dpp: [
    ["Princípios processuais", 1, 2],
    ["Inquérito policial", 2, 3],
    ["Ação penal", 2, 3],
    ["Jurisdição e competência", 1, 4],
    ["Provas", 2, 4],
    ["Prisão e liberdade provisória", 2, 4],
    ["Procedimentos", 1, 4],
    ["Recursos", 1, 4],
  ],
  dad: [
    ["Princípios da administração", 1, 2],
    ["Organização administrativa", 1, 2],
    ["Atos administrativos", 2, 4],
    ["Poderes administrativos", 1, 3],
    ["Licitações e contratos", 2, 4],
    ["Servidores públicos", 2, 3],
    ["Responsabilidade civil do Estado", 1, 4],
    ["Improbidade administrativa", 2, 4],
    ["Controle da administração", 1, 3],
  ],
  dcn: [
    ["Princípios fundamentais", 1, 2],
    ["Direitos e garantias fundamentais", 2, 4],
    ["Direitos sociais", 1, 3],
    ["Nacionalidade e direitos políticos", 1, 3],
    ["Organização do Estado", 2, 4],
    ["Administração pública", 2, 3],
    ["Poder Legislativo", 1, 3],
    ["Poder Executivo", 1, 3],
    ["Poder Judiciário", 1, 4],
    ["Segurança pública", 2, 3],
  ],
  lex: [
    ["Lei 8.112/90 (regime jurídico)", 2, 4],
    ["Lei 9.784/99 (processo administrativo)", 1, 3],
    ["Lei de acesso à informação", 0, 2],
    ["Estatuto e legislação da PC", 2, 4],
  ],
};

const IMP: ("baixa" | "media" | "alta")[] = ["baixa", "media", "alta"];

function buildTopics(): Topic[] {
  const out: Topic[] = [];
  for (const sub of SUBJECTS) {
    T[sub.id].forEach(([name, imp, diff], i) => {
      out.push({
        id: `${sub.id}-${i + 1}`,
        subjectId: sub.id,
        name,
        status: "nao_iniciado",
        importance: IMP[imp],
        difficulty: diff,
        questions: 0,
        correct: 0,
      });
    });
  }
  return out;
}

/* ============ histórico simulado (30 dias) ============ */

const ACC: Record<string, number> = {
  por: 0.84,
  dpe: 0.79,
  dcn: 0.78,
  dpp: 0.75,
  dad: 0.73,
  lex: 0.7,
  inf: 0.64,
  rlm: 0.61,
};

function buildLogs(topics: Topic[]): QuestionLog[] {
  const logs: QuestionLog[] = [];
  for (let d = -29; d <= 0; d++) {
    if (rnd() < 0.25) continue; // dias sem questão
    const nBlocks = ri(1, 3);
    for (let b = 0; b < nBlocks; b++) {
      const sub = SUBJECTS[ri(0, SUBJECTS.length - 1)];
      const subTopics = topics.filter((t) => t.subjectId === sub.id);
      const topic = subTopics[ri(0, subTopics.length - 1)];
      const total = ri(15, 40);
      const acc = ACC[sub.id] + (rnd() - 0.5) * 0.12;
      const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
      const errors = correct / total < 0.75 ? (["atencao", "conteudo"] as const).slice(0, ri(1, 2)) : [];
      logs.push({
        id: `log${d}_${b}`,
        date: off(d),
        subjectId: sub.id,
        topicId: topic.id,
        total,
        correct,
        errors: [...errors],
        source: "Banca — Cebraspe",
      });
      topic.questions += total;
      topic.correct += correct;
      if (topic.status === "nao_iniciado") topic.status = rnd() < 0.6 ? "em_estudo" : "concluido";
      else if (rnd() < 0.15) topic.status = "concluido";
    }
  }
  return logs;
}

function buildSessions(): StudySession[] {
  const sess: StudySession[] = [];
  for (let d = -29; d <= 0; d++) {
    // streak: últimos 7 dias sempre estudou
    const active = d >= -6 ? true : rnd() > 0.2;
    if (!active) continue;
    const n = ri(1, d >= -6 ? 2 : 1);
    for (let i = 0; i < n; i++) {
      const sub = SUBJECTS[ri(0, SUBJECTS.length - 1)];
      sess.push({
        id: `ses${d}_${i}`,
        date: off(d),
        subjectId: sub.id,
        minutes: ri(3, 12) * 10,
        kind: rnd() < 0.55 ? "teoria" : "questoes",
      });
    }
  }
  return sess;
}

function buildReviews(topics: Topic[]): Review[] {
  const revs: Review[] = [];
  for (let i = 0; i < 26; i++) {
    const sub = SUBJECTS[ri(0, SUBJECTS.length - 1)];
    const subTopics = topics.filter((t) => t.subjectId === sub.id);
    const topic = subTopics[ri(0, subTopics.length - 1)];
    const stage = ri(1, 3) as 1 | 2 | 3;
    const due = ri(-4, 9);
    const done = due < 0 ? rnd() < 0.7 : rnd() < 0.35;
    revs.push({
      id: `rev${i}`,
      subjectId: sub.id,
      topicId: topic.id,
      stage,
      due: off(due),
      done,
      doneOn: done ? off(due - ri(0, 1)) : undefined,
    });
  }
  return revs;
}

const PLANNER: PlannerSlot[] = [
  { id: "p0", day: 0, subjectId: "por", label: "Concordância verbal", minutes: 60, kind: "teoria" },
  { id: "p1", day: 0, subjectId: "rlm", label: "Proposições + questões", minutes: 60, kind: "questoes" },
  { id: "p2", day: 1, subjectId: "dpe", label: "Teoria do crime", minutes: 60, kind: "teoria" },
  { id: "p3", day: 1, subjectId: "dcn", label: "Direitos fundamentais", minutes: 45, kind: "teoria" },
  { id: "p4", day: 2, subjectId: "rlm", label: "Tabela-verdade", minutes: 60, kind: "questoes" },
  { id: "p5", day: 2, subjectId: "inf", label: "Segurança da informação", minutes: 45, kind: "teoria" },
  { id: "p6", day: 3, subjectId: "dpp", label: "Inquérito policial", minutes: 60, kind: "teoria" },
  { id: "p7", day: 3, subjectId: "por", label: "Crase — questões", minutes: 45, kind: "questoes" },
  { id: "p8", day: 4, subjectId: "dad", label: "Atos administrativos", minutes: 60, kind: "teoria" },
  { id: "p9", day: 4, subjectId: "lex", label: "Lei 8.112/90", minutes: 45, kind: "teoria" },
  { id: "p10", day: 5, subjectId: "rlm", label: "Revisão da semana", minutes: 60, kind: "revisao" },
  { id: "p11", day: 5, subjectId: "dpe", label: "Questões banca", minutes: 60, kind: "questoes" },
  { id: "p12", day: 6, subjectId: "dcn", label: "Simulado parcial", minutes: 90, kind: "simulado" },
];

/* Provas anteriores de referência */
const PAST_EXAMS: PastExam[] = [
  {
    id: "pe1",
    name: "PC/AL — Agente",
    banca: "CESPE/Cebraspe",
    year: 2012,
    link: "https://www.pciconcursos.com.br/provas/",
    distribution: { por: 14, rlm: 8, inf: 8, dpe: 12, dpp: 10, dad: 8, dcn: 10, lex: 10 },
  },
  {
    id: "pe2",
    name: "PC/AL — Agente",
    banca: "Cebraspe",
    year: 2021,
    link: "https://www.pciconcursos.com.br/provas/",
    distribution: { por: 16, rlm: 8, inf: 8, dpe: 14, dpp: 12, dad: 10, dcn: 12, lex: 16 },
  },
  {
    id: "pe3",
    name: "PF — Agente",
    banca: "Cebraspe",
    year: 2021,
    link: "https://www.pciconcursos.com.br/provas/",
    distribution: { por: 14, rlm: 10, inf: 12, dpe: 10, dpp: 10, dad: 8, dcn: 10, lex: 12 },
  },
  {
    id: "pe4",
    name: "PRF — Policial",
    banca: "Cebraspe",
    year: 2021,
    link: "https://www.pciconcursos.com.br/provas/",
    distribution: { por: 20, rlm: 10, inf: 6, dpe: 8, dpp: 8, dad: 5, dcn: 10, lex: 23 },
  },
];

export function buildSeed(): AppState {
  const topics = buildTopics();
  return {
    subjects: SUBJECTS,
    topics,
    questionLogs: buildLogs(topics),
    sessions: buildSessions(),
    reviews: buildReviews(topics),
    planner: PLANNER,
    plannerDone: [],
    focusDone: [],
    pastExams: PAST_EXAMS,
    mocks: [],
    aiResults: [],
    startedAt: off(-30),
    settings: {
      concurso: "PC/AL 2026",
      cargo: "Agente",
      banca: "Cebraspe",
      examDate: off(119),
      weeklyGoalHours: 18,
      courseGoalHours: 100,
      intervals: [1, 7, 30],
      thresholds: { green: 80, yellow: 60 },
      weights: { edital: 25, questoes: 25, consistencia: 20, revisoes: 15, metas: 15 },
    },
  };
}
