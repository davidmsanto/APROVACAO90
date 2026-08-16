import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../lib/store";
import type { AiMode } from "../lib/types";
import { AI_SUBJECTS, MODE_META, topicLabel } from "../lib/knowledge";
import { generateLocal, generateWithGemini, type AiOutput } from "../lib/ai";
import { fmtDay } from "../lib/calc";
import { Bar, Btn, Card, Chip, Dot, Select, TabHeader, TextInput, ToggleChip } from "../components/ui";
import { IcCheck, IcCopy, IcSpark, IcX } from "../components/icons";

const API_KEY = "aprovacao90:gemini_key";

function IncDots({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={`Incidência em prova: ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="h-[7px] w-[7px] rounded-full" style={{ background: i < n ? "#f5b84b" : "var(--color-raise)" }} />
      ))}
    </span>
  );
}

export default function Ia() {
  const { state, addAiResult, addQuestionLog, notify } = useStore();
  const subjects = state.subjects.filter((s) => AI_SUBJECTS.includes(s.id));
  const [subjectId, setSubjectId] = useState("rlm");
  const topics = state.topics.filter((t) => t.subjectId === subjectId);
  const [topicId, setTopicId] = useState("todos");
  const [mode, setMode] = useState<AiMode>("quiz");
  const [generating, setGenerating] = useState(false);
  const [payload, setPayload] = useState<AiOutput | null>(null);
  const [runId, setRunId] = useState(0);
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(API_KEY) ?? ""; } catch { return ""; }
  });
  const [lastScore, setLastScore] = useState<{ score: number; total: number } | null>(null);
  const [registered, setRegistered] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const subject = subjects.find((s) => s.id === subjectId)!;

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setTopicId("todos"); setPayload(null); }, [subjectId]);

  const saveKey = (v: string) => {
    setApiKey(v);
    try { v ? localStorage.setItem(API_KEY, v) : localStorage.removeItem(API_KEY); } catch {}
  };

  const generate = async () => {
    setGenerating(true);
    setPayload(null);
    setRegistered(false);
    setLastScore(null);
    const topicsSel = topicId === "todos" ? [] : [topicLabel(topicId)];
    let out: AiOutput;
    if (apiKey.trim()) {
      try {
        out = await generateWithGemini(apiKey.trim(), subject.name, topicsSel, mode);
      } catch {
        notify("Gemini indisponível — usando o motor local calibrado.", "amber");
        out = generateLocal(subjectId, topicId === "todos" ? undefined : topicId);
      }
    } else {
      await new Promise((r) => setTimeout(r, 900)); // feedback perceptível
      out = generateLocal(subjectId, topicId === "todos" ? undefined : topicId);
    }
    setPayload(out);
    setRunId((r) => r + 1);
    setGenerating(false);
  };

  const finish = (score: number, total: number) => {
    addAiResult({ subjectId, topicId: topicId === "todos" ? undefined : topicId, mode, score, total });
    setLastScore({ score, total });
    notify(`Resultado salvo no histórico: ${score}/${total}`, "green");
  };

  const registerQuiz = () => {
    if (!lastScore || !payload) return;
    addQuestionLog(
      {
        subjectId,
        topicId: topicId === "todos" ? state.topics.find((t) => t.subjectId === subjectId)!.id : topicId,
        total: lastScore.total,
        correct: lastScore.score,
        errors: [],
        source: "A90 IA · questões C/E",
      },
      { review: false },
    );
    setRegistered(true);
    notify("Bloco registrado — aproveitamento atualizado no Dashboard.", "green");
  };

  const history = useMemo(() => [...state.aiResults].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8), [state.aiResults]);

  return (
    <div>
      <TabHeader
        index="10"
        kicker="Motor A90 · conteúdo calibrado"
        title="IA de estudo"
        desc="Flashcards, questões C/E e resumos do que MAIS CAI em prova. Com chave Gemini gera em tempo real; sem chave, usa o motor local calibrado."
        right={<Chip color="#c9a2ff">{apiKey ? "motor: gemini 2.5 flash" : "motor: local calibrado"}</Chip>}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* painel de geração */}
        <div className="space-y-5">
          <Card className="p-6" delay={0}>
            <div className="kicker mb-4">Configurar geração</div>
            <div className="kicker mb-2 !text-[9.5px]">Disciplina</div>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <ToggleChip key={s.id} active={subjectId === s.id} color={s.color} onClick={() => setSubjectId(s.id)}>
                  {s.short}
                </ToggleChip>
              ))}
            </div>
            <div className="kicker mb-2 mt-5 !text-[9.5px]">Recorte do edital</div>
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="todos">Todos os tópicos calibrados</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            <div className="kicker mb-2 mt-5 !text-[9.5px]">Formato</div>
            <div className="space-y-2.5">
              {(Object.keys(MODE_META) as AiMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="block w-full rounded-xl border p-3.5 text-left transition-all active:scale-[0.98]"
                  style={{
                    borderColor: mode === m ? "rgba(0,255,104,0.4)" : "rgba(0,255,104,0.1)",
                    background: mode === m ? "rgba(0,255,104,0.06)" : "#04140a",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Dot color={mode === m ? "#00ff68" : "#66716b"} size={8} pulse={mode === m} />
                    <span className={`font-display text-[14.5px] font-semibold ${mode === m ? "text-brand2" : "text-snow"}`}>
                      {MODE_META[m].label}
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-mist">{MODE_META[m].desc}</div>
                </button>
              ))}
            </div>
            <Btn className="mt-5 w-full" onClick={generate} disabled={generating}>
              <IcSpark size={15} className={generating ? "animate-pulse" : ""} />
              {generating ? "Calibrando conteúdo…" : `Gerar ${MODE_META[mode].label.toLowerCase()}`}
            </Btn>
          </Card>

          <Card className="p-6" delay={60}>
            <div className="kicker mb-2 flex items-center gap-2"><IcSpark size={13} /> Chave Gemini (opcional)</div>
            <TextInput
              type="password"
              placeholder="Cole sua chave para gerar com IA real"
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
            />
            <p className="mt-2 text-[10.5px] leading-relaxed text-mist">
              Grátis no Google AI Studio. Fica salva só no seu navegador — no PWA multiusuário ela migra para um proxy de backend.
            </p>
          </Card>
        </div>

        {/* resultado */}
        <div className="space-y-5">
          <Card className="min-h-[380px] p-6" delay={80}>
            {generating && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-brand2">
                  <IcSpark size={15} className="animate-pulse" /> Motor A90 analisando o que mais cai<span className="caret text-brand2">▍</span>
                </div>
                {[92, 78, 85, 60].map((w, i) => (
                  <div key={i} className="shimmer h-14 rounded-xl" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}

            {!generating && !payload && (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,255,104,0.3)] bg-[rgba(0,255,104,0.08)]">
                  <IcSpark size={28} className="text-brand2" />
                </div>
                <div className="mt-4 font-display text-[18px] font-semibold text-snow">Pronto para gerar</div>
                <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-mist">
                  Escolha disciplina, recorte e formato. O conteúdo vem priorizado pela incidência real em provas estilo Cebraspe.
                </p>
              </div>
            )}

            {!generating && payload && (
              <div key={runId} className="anim-fade">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Chip color={subject.color}>{subject.name}</Chip>
                  <Chip color="#c9a2ff">{MODE_META[mode].label.toUpperCase()}</Chip>
                  <Chip color={payload.engine === "gemini" ? "#00ff68" : "#f5b84b"}>
                    {payload.engine === "gemini" ? "gemini 2.5 flash" : "local calibrado"}
                  </Chip>
                  <button onClick={generate} className="ml-auto text-[12px] font-semibold text-brand2 hover:underline">↻ gerar novamente</button>
                </div>

                {mode === "flashcards" && <Flashcards cards={payload.flashcards} onDone={(s, t) => finish(s, t)} />}
                {mode === "quiz" && <Quiz questions={payload.quiz} onDone={(s, t) => finish(s, t)} />}
                {mode === "resumo" && <Resumo blocks={payload.resumo} />}
              </div>
            )}

            {!generating && payload && mode === "quiz" && lastScore && (
              <div className="anim-rise mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-4 py-3">
                <span className="text-[12.5px] text-fog">
                  Levar o resultado para o Dashboard? Alimenta o aproveitamento de <b className="text-snow">{subject.name}</b>.
                </span>
                <Btn size="sm" onClick={registerQuiz} disabled={registered}>
                  {registered ? <><IcCheck size={13} /> Registrado</> : "Registrar no Dashboard"}
                </Btn>
              </div>
            )}
          </Card>

          <Card className="p-5" delay={140}>
            <div className="flex items-center justify-between">
              <div className="font-display text-[15px] font-semibold text-snow">Suas sessões com a IA</div>
              <Chip color="#c9a2ff">{state.aiResults.length} no total</Chip>
            </div>
            {history.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[rgba(0,255,104,0.15)] px-4 py-5 text-center text-[12.5px] text-mist">
                Nenhuma sessão ainda — gere seu primeiro conteúdo ao lado.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[rgba(0,255,104,0.06)]">
                {history.map((h) => {
                  const s = state.subjects.find((x) => x.id === h.subjectId);
                  const pct = Math.round((h.score / Math.max(1, h.total)) * 100);
                  return (
                    <div key={h.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                      <Dot color={s?.color ?? "#a5b0aa"} size={7} />
                      <span className="font-semibold text-snow">{s?.short}</span>
                      <span className="text-fog">{MODE_META[h.mode].label}</span>
                      {h.topicId && <span className="hidden text-mist sm:inline">· {topicLabel(h.topicId)}</span>}
                      <span className="ml-auto num text-mist">{fmtDay(h.date)}</span>
                      <span className="num w-16 text-right font-semibold" style={{ color: pct >= 70 ? "#00ff68" : pct >= 50 ? "#f5b84b" : "#f0655f" }}>
                        {h.score}/{h.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= flashcards ================= */
function Flashcards({ cards, onDone }: { cards: { q: string; a: string }[]; onDone: (score: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const saved = useRef(false);
  const card = cards[idx];

  const next = (wasKnown: boolean) => {
    const k = known + (wasKnown ? 1 : 0);
    setKnown(k);
    if (idx + 1 >= cards.length) {
      setDone(true);
      if (!saved.current) { saved.current = true; onDone(k, cards.length); }
      return;
    }
    setFlipped(false);
    setIdx(idx + 1);
  };

  if (done) {
    const pct = Math.round((known / cards.length) * 100);
    return (
      <div className="anim-rise flex flex-col items-center rounded-2xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-10 text-center">
        <span className="num text-[56px] font-semibold leading-none" style={{ color: pct >= 70 ? "#00ff68" : pct >= 50 ? "#f5b84b" : "#f0655f" }}>{known}/{cards.length}</span>
        <div className="mt-2 text-[13.5px] text-fog">{pct >= 80 ? "Domínio sólido — siga para questões de banca." : pct >= 50 ? "Bom caminho — repita os cards difíceis amanhã." : "Base fraca: volte à videoaula e refaça o deck."}</div>
      </div>
    );
  }
  if (!card) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="num text-[12px] text-mist">Card {idx + 1} de {cards.length}</span>
        <div className="w-40"><Bar pct={((idx + (flipped ? 1 : 0)) / cards.length) * 100} color="#00ff68" h={5} /></div>
        <span className="num text-[12px] text-brand2">{known} dominados</span>
      </div>
      <button className="flip-scene block h-[240px] w-full cursor-pointer text-left" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
          <div className="flip-face flex flex-col justify-between rounded-2xl border border-info/40 bg-gradient-to-b from-info/[0.08] to-transparent p-6">
            <Chip color="#5cb3ff">PERGUNTA</Chip>
            <div className="font-display text-[21px] font-semibold leading-snug text-snow">{card.q}</div>
            <div className="text-[11.5px] text-mist">clique para virar →</div>
          </div>
          <div className="flip-face flip-back flex flex-col justify-between rounded-2xl border border-[rgba(0,255,104,0.4)] bg-gradient-to-b from-[rgba(0,255,104,0.09)] to-transparent p-6">
            <Chip color="#00ff68">RESPOSTA</Chip>
            <div className="text-[15px] leading-relaxed text-snow">{card.a}</div>
            <div className="text-[11.5px] text-mist">avalie abaixo ↓</div>
          </div>
        </div>
      </button>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Btn variant="danger" onClick={() => next(false)} disabled={!flipped}><IcX size={14} /> Ainda não domino</Btn>
        <Btn onClick={() => next(true)} disabled={!flipped}><IcCheck size={14} /> Já domino</Btn>
      </div>
    </div>
  );
}

/* ================= quiz C/E ================= */
function Quiz({ questions, onDone }: { questions: { statement: string; correct: boolean; expl: string }[]; onDone: (score: number, total: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const saved = useRef(false);
  const q = questions[idx];
  const hit = answer !== null && answer === q.correct;

  const pick = (v: boolean) => {
    if (answer !== null) return;
    setAnswer(v);
    if (v === q.correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      if (!saved.current) { saved.current = true; onDone(score, questions.length); }
      return;
    }
    setIdx(idx + 1);
    setAnswer(null);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="anim-rise flex flex-col items-center rounded-2xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-10 text-center">
        <span className="num text-[56px] font-semibold leading-none" style={{ color: pct >= 70 ? "#00ff68" : pct >= 50 ? "#f5b84b" : "#f0655f" }}>{pct}%</span>
        <div className="mt-2 text-[13.5px] text-fog">{score} de {questions.length} itens — {pct >= 75 ? "nível de aprovado." : pct >= 50 ? "em evolução. Releia as explicações." : "abaixo da zona de corte. Foque nas explicações."}</div>
        <div className="mt-3"><Chip color={pct >= 70 ? "#00ff68" : "#f5b84b"}>META CEBRASPE: ≥70%</Chip></div>
      </div>
    );
  }
  if (!q) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="num text-[12px] text-mist">Item {idx + 1} de {questions.length}</span>
        <div className="w-40"><Bar pct={(idx / questions.length) * 100} color="#00ff68" h={5} /></div>
        <span className="num text-[12px] text-brand2">{score} certos</span>
      </div>
      <div className="rounded-2xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-6">
        <Chip color="#f5b84b">ESTILO CEBRASPE</Chip>
        <p className="mt-4 text-[16px] font-medium leading-relaxed text-snow">{q.statement}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => pick(true)}
            disabled={answer !== null}
            className="flex-1 rounded-xl border-2 py-3 text-[15px] font-extrabold tracking-wide transition-all active:scale-[0.98] disabled:cursor-default"
            style={{
              borderColor: answer === null ? "rgba(0,255,104,0.4)" : q.correct ? "#00ff68" : answer ? "#f0655f" : "rgba(0,255,104,0.1)",
              color: answer === null ? "#00ff68" : q.correct ? "#00ff68" : answer ? "#f0655f" : "#66716b",
              background: answer === null ? "rgba(0,255,104,0.04)" : q.correct ? "rgba(0,255,104,0.1)" : answer ? "rgba(240,101,95,0.08)" : "transparent",
            }}
          >
            CERTO
          </button>
          <button
            onClick={() => pick(false)}
            disabled={answer !== null}
            className="flex-1 rounded-xl border-2 py-3 text-[15px] font-extrabold tracking-wide transition-all active:scale-[0.98] disabled:cursor-default"
            style={{
              borderColor: answer === null ? "rgba(240,101,95,0.4)" : !q.correct ? "#00ff68" : !answer ? "#f0655f" : "rgba(0,255,104,0.1)",
              color: answer === null ? "#f0655f" : !q.correct ? "#00ff68" : !answer ? "#f0655f" : "#66716b",
              background: answer === null ? "rgba(240,101,95,0.04)" : !q.correct ? "rgba(0,255,104,0.1)" : !answer ? "rgba(240,101,95,0.08)" : "transparent",
            }}
          >
            ERRADO
          </button>
        </div>
        {answer !== null && (
          <div className="anim-rise mt-4 rounded-xl border p-4" style={{ borderColor: hit ? "rgba(0,255,104,0.35)" : "rgba(240,101,95,0.35)", background: hit ? "rgba(0,255,104,0.06)" : "rgba(240,101,95,0.06)" }}>
            <div className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: hit ? "#00ff68" : "#f0655f" }}>
              {hit ? <IcCheck size={15} /> : <IcX size={15} />}
              {hit ? "Você acertou" : "Errou"} — gabarito: {q.correct ? "CERTO" : "ERRADO"}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">{q.expl}</p>
            <Btn size="sm" variant="ghost" className="mt-3" onClick={next}>
              {idx + 1 >= questions.length ? "Ver resultado final" : "Próximo item"} →
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= resumo ================= */
function Resumo({ blocks }: { blocks: { topic: string; inc: number; points: string[]; wrong: string }[] }) {
  const { notify } = useStore();
  const copy = () => {
    const txt = blocks
      .map((b) => `## ${topicLabel(b.topic)} [${"★".repeat(b.inc)}]\n${b.points.map((p) => `• ${p}`).join("\n")}\n⚠ Pegadinha: ${b.wrong}`)
      .join("\n\n");
    navigator.clipboard?.writeText(`RESUMO A90\n\n${txt}`).catch(() => {});
    notify("Resumo copiado para a área de transferência.", "blue");
  };
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12.5px] text-fog">{blocks.length} blocos · ★ = incidência em prova</span>
        <Btn size="sm" variant="ghost" onClick={copy}><IcCopy size={13} /> Copiar resumo</Btn>
      </div>
      <div className="space-y-4">
        {blocks.map((b, i) => (
          <div key={i} className="anim-rise rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display text-[16px] font-semibold text-snow">{topicLabel(b.topic)}</span>
              <IncDots n={b.inc} />
              {b.inc === 5 && <Chip color="#f0655f">CAI SEMPRE</Chip>}
            </div>
            <ul className="mt-3 space-y-1.5">
              {b.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-fog">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand2" style={{ boxShadow: "0 0 8px #00ff68" }} />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-amber/25 bg-amber/[0.06] px-3.5 py-2.5 text-[12.5px] text-amber">
              <span className="font-extrabold">⚠ PEGADINHA:</span>
              <span className="text-fog"><i>“{b.wrong}”</i> — parece certo, mas a banca anula.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
