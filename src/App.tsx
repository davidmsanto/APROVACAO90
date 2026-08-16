import { useEffect, useMemo, useRef, useState } from "react";
import {
  AI_BANK,
  MODE_META,
  SUBJECTS,
  filterItems,
  topicsOf,
  type AiMode,
} from "./lib/knowledge";
import {
  generateWithGemini,
  pingGemini,
  type AiPayload,
  type DeckCard,
  type QuizQ,
  type ResumoBlock,
} from "./lib/ai";

/* ============================================================ helpers */

const KEY_STORE = "a90:gemini-key";
const HIST_STORE = "a90:historico";

function loadKey(): string {
  try { return localStorage.getItem(KEY_STORE) ?? ""; } catch { return ""; }
}
function loadHist(): { local: number; gemini: number } {
  try {
    const h = JSON.parse(localStorage.getItem(HIST_STORE) ?? "");
    return { local: Number(h?.local) || 0, gemini: Number(h?.gemini) || 0 };
  } catch { return { local: 0, gemini: 0 }; }
}

type Toast = { id: number; msg: string; tone: "green" | "amber" | "red" | "blue" };
let toastSeq = 0;

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ============================================================ dados do comparativo */

interface Provider {
  id: string;
  name: string;
  model: string;
  tag: string;
  tagColor: string;
  recommended?: boolean;
  verdict: string;
  scores: { freeTier: number; custo: number; ptbr: number; json: number; raciocinio: number };
}

const PROVIDERS: Provider[] = [
  {
    id: "gemini", name: "Gemini", model: "gemini-2.5-flash", tag: "Recomendado", tagColor: "#00FF68", recommended: true,
    verdict: "Melhor custo-benefício para o A90: free tier generoso, JSON estruturado nativo e PT-BR excelente. É o motor já integrado neste protótipo.",
    scores: { freeTier: 5, custo: 5, ptbr: 5, json: 5, raciocinio: 4 },
  },
  {
    id: "gpt", name: "ChatGPT", model: "gpt-4o-mini / GPT-5", tag: "Qualidade máxima", tagColor: "#f5b84b",
    verdict: "Raciocínio jurídico mais afiado para pegadinhas e Structured Outputs impecável. Ideal como fallback premium quando houver orçamento.",
    scores: { freeTier: 2, custo: 3, ptbr: 5, json: 5, raciocinio: 5 },
  },
  {
    id: "deepseek", name: "DeepSeek", model: "deepseek-chat / R1", tag: "Menor custo", tagColor: "#5cb3ff",
    verdict: "Preço imbatível e raciocínio forte (R1), mas fricção de pagamento/acesso fora da China e PT-BR jurídico menos refinado. Bom secundário via OpenRouter.",
    scores: { freeTier: 2, custo: 5, ptbr: 3, json: 4, raciocinio: 5 },
  },
  {
    id: "qwen", name: "Qwen", model: "qwen-max / qwen3", tag: "Alternativa", tagColor: "#c9a2ff",
    verdict: "Sólido e barato, bom multilíngue. Sem diferencial claro sobre o Gemini para este caso — vale considerar via OpenRouter/DashScope.",
    scores: { freeTier: 2, custo: 4, ptbr: 4, json: 4, raciocinio: 4 },
  },
  {
    id: "perplexity", name: "Perplexity", model: "sonar", tag: "Grounding", tagColor: "#f0655f",
    verdict: "Não é gerador de conteúdo — é busca com fontes. Reservar para a feature futura 'Radar de incidência ao vivo' (o que está caindo agora).",
    scores: { freeTier: 1, custo: 2, ptbr: 4, json: 3, raciocinio: 3 },
  },
];

const SCORE_LABELS: { key: keyof Provider["scores"]; label: string }[] = [
  { key: "freeTier", label: "Free tier" },
  { key: "custo", label: "Custo" },
  { key: "ptbr", label: "PT-BR" },
  { key: "json", label: "JSON" },
  { key: "raciocinio", label: "Raciocínio" },
];

/* ============================================================ pequenos */

function ScoreBar({ value, delay }: { value: number; delay: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="bar-grow h-[5px] w-[14px] rounded-full"
          style={{
            background: i < value ? "rgba(0,255,104,0.85)" : "rgba(0,255,104,0.12)",
            animationDelay: `${delay + i * 60}ms`,
            boxShadow: i < value ? "0 0 8px rgba(0,255,90,0.35)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function IncDots({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={`Incidência em prova: ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="h-[7px] w-[7px] rounded-full" style={{ background: i < n ? "#f5b84b" : "rgba(0,255,104,0.12)" }} />
      ))}
    </span>
  );
}

/* ============================================================ views de resultado */

function FlashDeck({ deck, onDone }: { deck: DeckCard[]; onDone: (known: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const saved = useRef(false);
  const card = deck[idx];

  const next = (k: boolean) => {
    const nk = known + (k ? 1 : 0);
    setKnown(nk);
    if (idx + 1 >= deck.length) {
      setDone(true);
      if (!saved.current) { saved.current = true; onDone(nk); }
      return;
    }
    setFlipped(false);
    setIdx(idx + 1);
  };

  if (done) {
    const pct = Math.round((known / deck.length) * 100);
    return (
      <div className="anim-rise flex flex-col items-center rounded-xl border border-line bg-pit p-10 text-center">
        <span className="num text-[56px] font-normal leading-none" style={{ color: pct >= 70 ? "#00FF68" : pct >= 50 ? "#f5b84b" : "#f0655f" }}>
          {known}/{deck.length}
        </span>
        <p className="mt-2 max-w-sm text-[13px] text-fog">
          {pct >= 80 ? "Domínio sólido — avance para questões de banca." : pct >= 50 ? "Bom caminho — repita os cards difíceis amanhã." : "Base fraca neste recorte: volte à teoria e refaça o deck."}
        </p>
        <button className="btn btn-ghost mt-5" onClick={() => { setIdx(0); setKnown(0); setDone(false); setFlipped(false); saved.current = false; }}>
          Refazer deck
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="num text-mist">Card {idx + 1}/{deck.length}</span>
        <span className="num" style={{ color: "#00FF68" }}>{known} dominados</span>
      </div>
      <button className="flip-scene block h-[250px] w-full cursor-pointer text-left" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
          <div className="flip-face flex flex-col justify-between rounded-xl border border-[rgba(92,179,255,0.35)] bg-gradient-to-b from-[rgba(92,179,255,0.08)] to-transparent p-6">
            <div className="flex items-center justify-between">
              <span className="chip" style={{ color: "#5cb3ff", border: "1px solid rgba(92,179,255,0.35)", background: "rgba(92,179,255,0.1)" }}>{card.topic}</span>
              <IncDots n={card.inc} />
            </div>
            <div className="font-display text-[21px] leading-snug text-snow">{card.q}</div>
            <div className="text-[11px] text-mist">clique para virar →</div>
          </div>
          <div className="flip-face flip-back flex flex-col justify-between rounded-xl border border-[rgba(0,255,104,0.35)] bg-gradient-to-b from-[rgba(0,255,104,0.08)] to-transparent p-6">
            <span className="chip self-start" style={{ color: "#00FF68", border: "1px solid rgba(0,255,104,0.35)", background: "rgba(0,255,104,0.1)" }}>Resposta</span>
            <div className="text-[14.5px] leading-relaxed text-snow">{card.a}</div>
            <div className="text-[11px] text-mist">avalie abaixo ↓</div>
          </div>
        </div>
      </button>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button className="btn btn-ghost" style={{ borderColor: "rgba(240,101,95,0.4)", color: "#f0655f" }} disabled={!flipped} onClick={() => next(false)}>
          Ainda não domino
        </button>
        <button className="btn" disabled={!flipped} onClick={() => next(true)}>Já domino</button>
      </div>
    </div>
  );
}

function QuizView({ quiz, onDone }: { quiz: QuizQ[]; onDone: (score: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const saved = useRef(false);
  const q = quiz[idx];
  const hit = answer !== null && answer === q.correct;

  const pick = (v: boolean) => {
    if (answer !== null) return;
    setAnswer(v);
    if (v === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= quiz.length) {
      setFinished(true);
      if (!saved.current) { saved.current = true; onDone(score, quiz.length); }
      return;
    }
    setIdx(idx + 1);
    setAnswer(null);
  };

  if (finished) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="anim-rise flex flex-col items-center rounded-xl border border-line bg-pit p-10 text-center">
        <span className="num text-[56px] font-normal leading-none" style={{ color: pct >= 70 ? "#00FF68" : pct >= 50 ? "#f5b84b" : "#f0655f" }}>{pct}%</span>
        <p className="mt-2 text-[13px] text-fog">
          {score}/{quiz.length} no estilo Cebraspe — {pct >= 75 ? "nível de aprovado." : pct >= 50 ? "em evolução; releia os comentários." : "abaixo da zona de corte; foque nos comentários."}
        </p>
        <span className="chip mt-3" style={{ color: pct >= 70 ? "#00FF68" : "#f5b84b", border: "1px solid rgba(0,255,104,0.3)", background: "rgba(0,255,104,0.08)" }}>
          Meta Cebraspe: ≥ 70%
        </span>
      </div>
    );
  }

  const ceStyle = (choice: boolean) => {
    const chosen = answer === choice;
    const isAnswer = q.correct === choice;
    if (answer === null) {
      return {
        borderColor: choice ? "rgba(0,255,104,0.4)" : "rgba(240,101,95,0.4)",
        color: choice ? "#00FF68" : "#f0655f",
        background: choice ? "rgba(0,255,104,0.05)" : "rgba(240,101,95,0.05)",
      };
    }
    if (isAnswer) return { borderColor: "#00FF68", color: "#00FF68", background: "rgba(0,255,104,0.12)" };
    if (chosen) return { borderColor: "#f0655f", color: "#f0655f", background: "rgba(240,101,95,0.1)" };
    return { borderColor: "rgba(0,255,104,0.12)", color: "#66716b", background: "transparent" };
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="num text-mist">Item {idx + 1}/{quiz.length}</span>
        <span className="num" style={{ color: "#00FF68" }}>{score} certos</span>
      </div>
      <div className="rounded-xl border border-line bg-pit p-6">
        <span className="chip" style={{ color: "#5cb3ff", border: "1px solid rgba(92,179,255,0.35)", background: "rgba(92,179,255,0.1)" }}>
          estilo cebraspe · {q.topic}
        </span>
        <p className="mt-4 text-[16px] font-medium leading-relaxed text-snow">{q.statement}</p>
        <div className="mt-5 flex gap-3">
          {([true, false] as const).map((choice) => {
            const st = ceStyle(choice);
            return (
              <button
                key={String(choice)}
                onClick={() => pick(choice)}
                disabled={answer !== null}
                className="flex-1 rounded-xl border-2 py-3 text-[15px] font-bold tracking-wider transition-all active:scale-[0.98] disabled:cursor-default"
                style={st}
              >
                {choice ? "CERTO" : "ERRADO"}
              </button>
            );
          })}
        </div>
        {answer !== null && (
          <div className="anim-rise mt-4 rounded-xl border p-4" style={{
            borderColor: hit ? "rgba(0,255,104,0.35)" : "rgba(240,101,95,0.35)",
            background: hit ? "rgba(0,255,104,0.06)" : "rgba(240,101,95,0.06)",
          }}>
            <div className="text-[12.5px] font-bold" style={{ color: hit ? "#00FF68" : "#f0655f" }}>
              {hit ? "Você acertou" : "Você errou"} — gabarito: {q.correct ? "CERTO" : "ERRADO"}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">{q.expl}</p>
            <button className="btn btn-ghost mt-3" onClick={next}>
              {idx + 1 >= quiz.length ? "Ver resultado final" : "Próximo item"} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumoView({ blocks, title }: { blocks: ResumoBlock[]; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const txt = blocks.map((b) => `## ${b.topic} [${"★".repeat(b.inc)}${"☆".repeat(5 - b.inc)}]\n${b.points.map((p) => `• ${p}`).join("\n")}\n⚠ Pegadinha: ${b.wrong}`).join("\n\n");
    navigator.clipboard?.writeText(`RESUMO A90 — ${title}\n\n${txt}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] text-fog">{blocks.length} blocos · ★ = incidência em prova</span>
        <button className="btn btn-ghost" onClick={copy}>{copied ? "Copiado ✓" : "Copiar resumo"}</button>
      </div>
      <div className="space-y-4">
        {blocks.map((b, i) => (
          <div key={`${b.topic}-${i}`} className="anim-rise rounded-xl border border-line bg-pit p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display text-[16.5px] text-snow">{b.topic}</span>
              <IncDots n={b.inc} />
              {b.inc === 5 && <span className="chip" style={{ color: "#f0655f", border: "1px solid rgba(240,101,95,0.4)", background: "rgba(240,101,95,0.1)" }}>cai sempre</span>}
            </div>
            <ul className="mt-3 space-y-1.5">
              {b.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-fog">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#00FF68", boxShadow: "0 0 8px rgba(0,255,104,0.6)" }} />
                  {p}
                </li>
              ))}
            </ul>
            {b.wrong && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-[rgba(245,184,75,0.25)] bg-[rgba(245,184,75,0.06)] px-3.5 py-2.5 text-[12.5px]">
                <span className="font-bold text-amber">⚠ PEGADINHA:</span>
                <span className="text-fog"><i>“{b.wrong}”</i> — parece certo, mas a banca anula.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ app */

export default function App() {
  const [key, setKey] = useState(loadKey);
  const [showKey, setShowKey] = useState(false);
  const [subjectId, setSubjectId] = useState("rlm");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<AiMode>("quiz");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [payload, setPayload] = useState<AiPayload | null>(null);
  const [engine, setEngine] = useState<"gemini" | "local">("local");
  const [hist, setHist] = useState(loadHist);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const subject = SUBJECTS.find((s) => s.id === subjectId)!;
  const topics = useMemo(() => topicsOf(subjectId), [subjectId]);
  const ground = useMemo(() => filterItems(subjectId, topic || undefined), [subjectId, topic]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setTopic(""); setPayload(null); setStatus("idle"); }, [subjectId]);

  const notify = (msg: string, tone: Toast["tone"] = "green") => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

  const bumpHist = (eng: "gemini" | "local") => {
    setHist((h) => {
      const nh = { ...h, [eng]: h[eng] + 1 };
      try { localStorage.setItem(HIST_STORE, JSON.stringify(nh)); } catch { /* noop */ }
      return nh;
    });
  };

  const saveKey = (v: string) => {
    setKey(v);
    try { localStorage.setItem(KEY_STORE, v); } catch { /* noop */ }
  };

  /* gera local a partir da base calibrada */
  const genLocal = (): AiPayload => {
    if (mode === "flashcards") {
      return { mode, deck: shuffle(ground).slice(0, 10).map((i) => ({ q: i.q, a: i.a, topic: i.topic, inc: i.inc })) };
    }
    if (mode === "quiz") {
      return { mode, quiz: shuffle(ground).slice(0, 8).map((i) => ({ statement: i.ce, correct: i.ceTrue, expl: i.expl, topic: i.topic })) };
    }
    return { mode, resumo: ground.slice(0, 6).map((i) => ({ topic: i.topic, inc: i.inc, points: i.points, wrong: i.wrong })) };
  };

  const generate = async () => {
    setStatus("loading");
    setPayload(null);
    clearTimeout(timer.current);
    if (key.trim()) {
      try {
        const res = await generateWithGemini(key.trim(), mode, ground, topic || undefined);
        setPayload(res);
        setEngine("gemini");
        setStatus("done");
        bumpHist("gemini");
        notify("Gerado com Gemini 2.5 Flash — JSON estruturado validado.", "green");
        return;
      } catch (e) {
        notify(`API falhou (${e instanceof Error ? e.message : "erro"}). Ativando motor local calibrado.`, "amber");
      }
    }
    timer.current = setTimeout(() => {
      setPayload(genLocal());
      setEngine("local");
      setStatus("done");
      bumpHist("local");
      setStatus("done");
    }, 700);
  };

  const testConnection = async () => {
    if (!key.trim()) { notify("Cole sua chave Gemini primeiro.", "red"); return; }
    notify("Testando conexão…", "blue");
    const r = await pingGemini(key.trim());
    notify(r.msg, r.ok ? "green" : "red");
  };

  const onResult = (s: number, t: number) => {
    notify(`Sessão registrada: ${s}/${t} · motor ${engine === "gemini" ? "Gemini" : "local"}.`, "blue");
  };

  const chipTone = {
    green: { c: "#00FF68", bg: "rgba(0,255,104,0.1)", bd: "rgba(0,255,104,0.35)" },
    amber: { c: "#f5b84b", bg: "rgba(245,184,75,0.1)", bd: "rgba(245,184,75,0.4)" },
    red: { c: "#f0655f", bg: "rgba(240,101,95,0.1)", bd: "rgba(240,101,95,0.4)" },
    blue: { c: "#5cb3ff", bg: "rgba(92,179,255,0.1)", bd: "rgba(92,179,255,0.4)" },
  } as const;

  return (
    <div className="relative min-h-full">
      <div className="bg-scene" /><div className="bg-grid" /><div className="bg-noise" />
      <div className="orb orb-a" /><div className="orb orb-b" />

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(380px,90vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="anim-rise rounded-xl border bg-[rgba(6,26,15,0.95)] px-4 py-3 text-[12.5px] font-semibold text-snow shadow-[0_18px_44px_-12px_rgba(0,0,0,0.9)] backdrop-blur"
            style={{ borderColor: chipTone[t.tone].bd, borderLeft: `3px solid ${chipTone[t.tone].c}` }}>
            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: chipTone[t.tone].c }} />
            {t.msg}
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 pb-20 sm:px-8">
        {/* ============ header ============ */}
        <header className="anim-rise flex flex-wrap items-center justify-between gap-4 border-b border-line py-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-[18px] text-ink"
              style={{ background: "linear-gradient(135deg,#00B947,#00FF68)", boxShadow: "0 0 26px rgba(0,255,90,0.4)" }}>90</div>
            <div className="leading-tight">
              <div className="font-display text-[19px] tracking-wide text-snow">APROVAÇÃO <span style={{ color: "#00FF68" }}>90</span></div>
              <div className="kicker">motor de ia · integração</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="chip" style={{ color: key ? "#00FF68" : "#66716b", border: `1px solid ${key ? "rgba(0,255,104,0.35)" : "rgba(0,255,104,0.12)"}`, background: key ? "rgba(0,255,104,0.08)" : "transparent" }}>
              <span className="pulse-g inline-block h-1.5 w-1.5 rounded-full" style={{ background: key ? "#00FF68" : "#66716b" }} />
              {key ? "gemini conectado" : "modo local"}
            </span>
            <span className="chip num" style={{ color: "#a5b0aa", border: "1px solid rgba(0,255,104,0.12)" }}>
              {hist.gemini + hist.local} gerações
            </span>
          </div>
        </header>

        {/* ============ veredito ============ */}
        <section className="anim-rise mt-14" style={{ animationDelay: "80ms" }}>
          <div className="kicker">[ decisão de arquitetura ]</div>
          <h1 className="font-display mt-3 max-w-3xl text-[42px] leading-[0.98] text-snow sm:text-[62px]">
            Um motor de IA. <span style={{ color: "#00FF68", textShadow: "0 0 44px rgba(0,255,104,0.35)" }}>Cinco candidatos.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-fog">
            Para gerar flashcards, questões C/E e resumos calibrados ao que mais cai, o A90 precisa de:
            <b className="text-snow"> PT-BR jurídico impecável</b>, <b className="text-snow">JSON estruturado</b> e{" "}
            <b className="text-snow">custo próximo de zero</b> na fase MVP. O comparativo abaixo pontua cada provedor nesses critérios.
          </p>

          <div className="mt-8 space-y-3">
            {PROVIDERS.map((p, i) => (
              <div key={p.id} className={`card card-hover anim-rise p-5 ${p.recommended ? "border-[rgba(0,255,104,0.45)]" : ""}`}
                style={{ animationDelay: `${120 + i * 70}ms`, boxShadow: p.recommended ? "0 0 34px rgba(0,255,90,0.14), inset 0 0 30px rgba(0,255,90,0.04)" : undefined }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[22px] text-snow">{p.name}</span>
                      <span className="chip" style={{ color: p.tagColor, border: `1px solid ${p.tagColor}55`, background: `${p.tagColor}14` }}>{p.tag}</span>
                    </div>
                    <div className="num mt-1 text-[11px] text-mist">{p.model}</div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {SCORE_LABELS.map((s) => (
                      <div key={s.key}>
                        <div className="kicker mb-1.5 !text-[8.5px]">{s.label}</div>
                        <ScoreBar value={p.scores[s.key]} delay={i * 70} />
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3.5 max-w-3xl text-[13px] leading-relaxed text-fog">{p.verdict}</p>
              </div>
            ))}
          </div>

          {/* arquitetura */}
          <div className="card anim-rise mt-6 grid gap-6 p-6 lg:grid-cols-[1fr_auto]" style={{ animationDelay: "520ms" }}>
            <div>
              <div className="kicker">[ como integrar sem ficar preso a um provedor ]</div>
              <ul className="mt-3 space-y-2 text-[13px] text-fog">
                {[
                  "Adapter único (interface AiProvider) — trocar Gemini por GPT/DeepSeek é mudança de configuração, não de código.",
                  "Base calibrada local como ground truth nos prompts: a IA gera no formato do edital, não no formato dela.",
                  "Fallback automático: API caiu → motor local calibrado assume, sem o app parar.",
                  "Chave fora do repositório. Na fase PWA multiusuário: proxy de backend (a chave nunca viaja no bundle).",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#00FF68", boxShadow: "0 0 8px rgba(0,255,104,0.6)" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="num flex flex-col items-center justify-center gap-1 rounded-xl border border-[rgba(0,255,104,0.2)] bg-pit px-6 py-4 text-center">
              <span className="text-[10px] uppercase tracking-[0.18em] text-mist">veredito</span>
              <span className="text-[26px]" style={{ color: "#00FF68", textShadow: "0 0 30px rgba(0,255,104,0.4)" }}>Gemini</span>
              <span className="text-[10.5px] text-mist">primário · GPT como reserva premium</span>
            </div>
          </div>
        </section>

        {/* ============ laboratório ============ */}
        <section className="mt-20">
          <div className="kicker">[ protótipo funcional ]</div>
          <h2 className="font-display mt-3 text-[34px] leading-[0.98] text-snow sm:text-[46px]">
            Laboratório <span style={{ color: "#00FF68" }}>IA A90</span>
          </h2>
          <p className="mt-3 max-w-2xl text-[13.5px] text-fog">
            Sem chave, roda o motor local calibrado ({AI_BANK.length} itens autorais). Com a chave Gemini colada ao lado, a geração
            passa a usar a API em tempo real — mesmo prompt, mesmo formato, mesmo fallback.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            {/* painel de controle */}
            <div className="card h-fit p-6">
              <div className="kicker mb-3">Chave da API (opcional)</div>
              <div className="flex gap-2">
                <input
                  className="input num"
                  type={showKey ? "text" : "password"}
                  placeholder="AIza…"
                  value={key}
                  onChange={(e) => saveKey(e.target.value)}
                  autoComplete="off"
                />
                <button className="btn btn-ghost !px-4" onClick={() => setShowKey((v) => !v)}>{showKey ? "ocultar" : "ver"}</button>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <button className="text-[11.5px] font-semibold underline-offset-2 hover:underline" style={{ color: "#38ff8a" }} onClick={testConnection}>
                  Testar conexão →
                </button>
                <a className="text-[11px] text-mist underline-offset-2 hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                  obter chave grátis
                </a>
              </div>
              <p className="mt-3 rounded-lg border border-[rgba(245,184,75,0.25)] bg-[rgba(245,184,75,0.05)] px-3 py-2 text-[10.5px] leading-relaxed text-fog">
                <b className="text-amber">Segurança:</b> a chave fica apenas no seu navegador (localStorage). Nunca publique chaves em
                repositórios; no PWA multiusuário, use proxy de backend.
              </p>

              <div className="kicker mb-2 mt-6">Disciplina</div>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => (
                  <button key={s.id} onClick={() => setSubjectId(s.id)}
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] transition-all active:scale-95"
                    style={{
                      borderColor: subjectId === s.id ? `${s.color}88` : "rgba(0,255,104,0.12)",
                      color: subjectId === s.id ? s.color : "#a5b0aa",
                      background: subjectId === s.id ? `${s.color}14` : "transparent",
                    }}>
                    {s.short}
                  </button>
                ))}
              </div>

              <div className="kicker mb-2 mt-5">Recorte do edital</div>
              <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Todos os tópicos calibrados</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>

              <div className="kicker mb-2 mt-5">Formato</div>
              <div className="space-y-2">
                {(Object.keys(MODE_META) as AiMode[]).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setPayload(null); setStatus("idle"); }}
                    className="block w-full rounded-xl border p-3 text-left transition-all active:scale-[0.99]"
                    style={{
                      borderColor: mode === m ? "rgba(0,255,104,0.45)" : "rgba(0,255,104,0.1)",
                      background: mode === m ? "rgba(0,255,104,0.06)" : "var(--pit)",
                    }}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${mode === m ? "pulse-g" : ""}`} style={{ background: mode === m ? "#00FF68" : "#66716b" }} />
                      <span className="font-display text-[15px]" style={{ color: mode === m ? "#00FF68" : "#f1f5f2" }}>{MODE_META[m].label}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-mist">{MODE_META[m].desc}</div>
                  </button>
                ))}
              </div>

              <button className="btn mt-6 w-full" onClick={generate} disabled={status === "loading"}>
                {status === "loading" ? "Gerando…" : `Gerar ${MODE_META[mode].label.toLowerCase()}`}
              </button>
              <p className="mt-3 text-center text-[10.5px] text-mist">
                {ground.length} itens na base para este recorte · motor ativo:{" "}
                <b style={{ color: key ? "#00FF68" : "#a5b0aa" }}>{key ? "Gemini API" : "local calibrado"}</b>
              </p>
            </div>

            {/* resultado */}
            <div className="card min-h-[420px] p-6">
              {status === "loading" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "#00FF68" }}>
                    <span className="inline-block h-2 w-2 rounded-full pulse-g" style={{ background: "#00FF68" }} />
                    {key ? "Consultando Gemini 2.5 Flash…" : "Motor local calibrando conteúdo…"}
                    <span className="caret">▍</span>
                  </div>
                  {[94, 80, 88, 62].map((w, i) => (
                    <div key={i} className="shimmer h-14 rounded-xl" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              )}

              {status === "idle" && !payload && (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,255,104,0.3)] bg-[rgba(0,255,104,0.08)]">
                    <span className="font-display text-[26px]" style={{ color: "#00FF68" }}>✦</span>
                  </div>
                  <div className="font-display mt-4 text-[20px] text-snow">Pronto para gerar</div>
                  <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-mist">
                    Escolha o recorte e o formato. Com chave Gemini, a geração é ao vivo via API; sem chave, o motor local entrega
                    conteúdo calibrado pela mesma base.
                  </p>
                </div>
              )}

              {status === "done" && payload && (
                <div className="anim-fade" key={`${payload.mode}-${engine}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="chip" style={{ color: subject.color, border: `1px solid ${subject.color}55`, background: `${subject.color}14` }}>{subject.name}</span>
                    <span className="chip" style={{ color: "#a5b0aa", border: "1px solid rgba(0,255,104,0.12)" }}>{MODE_META[payload.mode].label}</span>
                    <span className="chip" style={{
                      color: engine === "gemini" ? "#00FF68" : "#5cb3ff",
                      border: `1px solid ${engine === "gemini" ? "rgba(0,255,104,0.35)" : "rgba(92,179,255,0.35)"}`,
                      background: engine === "gemini" ? "rgba(0,255,104,0.08)" : "rgba(92,179,255,0.08)",
                    }}>
                      motor: {engine === "gemini" ? "gemini 2.5 flash" : "local calibrado"}
                    </span>
                    <button className="ml-auto text-[12px] font-semibold hover:underline" style={{ color: "#38ff8a" }} onClick={generate}>
                      ↻ gerar novamente
                    </button>
                  </div>
                  {payload.mode === "flashcards" && <FlashDeck deck={payload.deck} onDone={(k) => onResult(k, payload.deck.length)} />}
                  {payload.mode === "quiz" && <QuizView quiz={payload.quiz} onDone={(s, t) => onResult(s, t)} />}
                  {payload.mode === "resumo" && <ResumoView blocks={payload.resumo} title={subject.name} />}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ footer ============ */}
        <footer className="mt-20 border-t border-line pt-6 text-center">
          <p className="text-[11px] leading-relaxed text-mist">
            APROVAÇÃO 90 · Motor de IA — protótipo de integração. Adapter agnóstico de provedor · JSON estruturado ·
            fallback local automático · chaves somente no dispositivo do usuário.
          </p>
        </footer>
      </div>
    </div>
  );
}
