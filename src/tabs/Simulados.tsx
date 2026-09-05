import { useState } from "react";
import { useStore } from "../lib/store";
import type { MockPlan, MockSubjectPlan, PastExam } from "../lib/types";
import { fmtMin, isoOf } from "../lib/calc";
import { sanitizeUrl } from "../lib/security";
import { Bar, Btn, Card, Chip, Dot, SectionTitle, TabHeader, TextInput, ToggleChip } from "../components/ui";
import { IcCheck, IcChevron, IcExternal, IcSpark, IcTrash } from "../components/icons";

const IMP_W = { alta: 3, media: 2, baixa: 1 } as const;

function allocate(weights: { id: string; w: number }[], total: number): { id: string; n: number }[] {
  const sum = weights.reduce((a, x) => a + x.w, 0);
  if (sum <= 0 || total <= 0) return weights.map((x) => ({ id: x.id, n: 0 }));
  const raw = weights.map((x) => ({ id: x.id, exact: (x.w / sum) * total }));
  const base = raw.map((x) => ({ id: x.id, n: Math.floor(x.exact), frac: x.exact - Math.floor(x.exact) }));
  let left = total - base.reduce((a, x) => a + x.n, 0);
  const order = [...base].sort((a, b) => b.frac - a.frac);
  for (const b of order) {
    if (left <= 0) break;
    b.n += 1;
    left -= 1;
  }
  return base.map((b) => ({ id: b.id, n: b.n }));
}

function PastExamForm({ onDone }: { onDone: () => void }) {
  const { state, addPastExam, notify } = useStore();
  const subjects = state.subjects.filter((s) => s.id !== "sim");
  const [name, setName] = useState("");
  const [banca, setBanca] = useState(state.settings.banca);
  const [year, setYear] = useState(String(new Date().getFullYear() - 3));
  const [link, setLink] = useState("https://www.pciconcursos.com.br/provas/");
  const [dist, setDist] = useState<Record<string, string>>({});

  const save = () => {
    if (name.trim().length < 3) { notify("Dê um nome à prova (ex.: PC/DF — Agente).", "red"); return; }
    const distribution: Record<string, number> = {};
    let total = 0;
    subjects.forEach((s) => {
      const n = parseInt(dist[s.id] ?? "0", 10) || 0;
      if (n > 0) { distribution[s.id] = n; total += n; }
    });
    if (total === 0) { notify("Informe a quantidade de questões de pelo menos uma disciplina.", "red"); return; }
    addPastExam({ name: name.trim(), banca: banca.trim() || state.settings.banca, year: parseInt(year, 10) || 2024, link: sanitizeUrl(link), distribution });
    notify(`Prova adicionada (${total} questões) — já disponível no gerador.`, "green");
    onDone();
  };

  return (
    <div className="anim-rise rounded-xl border border-[rgba(0,255,104,0.3)] bg-[#04140a] p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block sm:col-span-2">
          <span className="kicker mb-1 block">Prova</span>
          <TextInput placeholder="ex.: PC/DF — Agente" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block"><span className="kicker mb-1 block">Banca</span><TextInput value={banca} onChange={(e) => setBanca(e.target.value)} /></label>
        <label className="block"><span className="kicker mb-1 block">Ano</span><TextInput type="number" value={year} onChange={(e) => setYear(e.target.value)} /></label>
        <label className="block sm:col-span-4"><span className="kicker mb-1 block">Link do PDF (opcional)</span><TextInput value={link} onChange={(e) => setLink(e.target.value)} /></label>
      </div>
      <div className="kicker mt-4 mb-2">Questões por disciplina</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {subjects.map((s) => (
          <label key={s.id} className="flex items-center gap-2 rounded-lg border border-[rgba(0,255,104,0.1)] bg-[#061a0f] px-2.5 py-1.5">
            <Dot color={s.color} size={7} />
            <span className="text-[11.5px] font-semibold text-fog">{s.short}</span>
            <input
              type="number" min={0} placeholder="0"
              value={dist[s.id] ?? ""}
              onChange={(e) => setDist((d) => ({ ...d, [s.id]: e.target.value }))}
              className="num ml-auto w-14 bg-transparent text-right text-[13px] text-snow outline-none"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <Btn size="sm" onClick={save}>Adicionar ao banco</Btn>
        <Btn size="sm" variant="ghost" onClick={onDone}>Cancelar</Btn>
      </div>
    </div>
  );
}

export default function Simulados() {
  const { state, removePastExam, addMock, updateMock, removeMock, addQuestionLog, notify, visibleSubjects, visibleTopics } = useStore();
  const subjects = visibleSubjects.filter((s) => s.id !== "sim");
  const [selected, setSelected] = useState<string[]>(state.pastExams.slice(0, 2).map((p) => p.id));
  const [totalQ, setTotalQ] = useState(80);
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(state.mocks[0]?.id ?? null);
  const [feedDashboard, setFeedDashboard] = useState(true);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const selExams = state.pastExams.filter((p) => selected.includes(p.id));

  const generate = () => {
    if (selExams.length === 0) { notify("Selecione ao menos uma prova anterior como base.", "red"); return; }
    const subjWeights = subjects
      .map((s) => ({ id: s.id, w: selExams.reduce((a, p) => a + (p.distribution[s.id] ?? 0), 0) }))
      .filter((x) => x.w > 0);
    const bySubject = allocate(subjWeights, totalQ);
    const distribution: MockSubjectPlan[] = bySubject
      .filter((b) => b.n > 0)
      .map((b) => {
        const topics = visibleTopics.filter((t) => t.subjectId === b.id);
        const tw = topics.map((t) => ({ id: t.id, w: IMP_W[t.importance] * (1 + t.difficulty * 0.12) }));
        const byTopic = allocate(tw, b.n).filter((x) => x.n > 0);
        return { subjectId: b.id, questions: b.n, topics: byTopic.map((x) => ({ topicId: x.id, questions: x.n })) };
      });
    const mock: MockPlan = {
      id: `mock${Date.now()}`,
      name: `Simulado #${state.mocks.length + 1} · ${totalQ} questões`,
      createdAt: isoOf(new Date()),
      bancaRef: selExams[0].banca,
      totalQuestions: totalQ,
      timeMinutes: totalQ * 2,
      basedOn: selExams.map((p) => `${p.name} ${p.year}`),
      distribution,
      status: "planejado",
    };
    addMock(mock);
    setExpanded(mock.id);
    notify(`Simulado gerado: ${totalQ} questões · ~${fmtMin(mock.timeMinutes)} de prova.`, "green");
  };

  const recordSubject = (mock: MockPlan, subjectId: string) => {
    const val = inputs[`${mock.id}:${subjectId}`];
    const correct = parseInt(val ?? "", 10);
    const plan = mock.distribution.find((d) => d.subjectId === subjectId)!;
    if (isNaN(correct) || correct < 0 || correct > plan.questions) { notify(`Acertos devem estar entre 0 e ${plan.questions}.`, "red"); return; }
    const results = { ...(mock.results ?? {}), [subjectId]: { correct, total: plan.questions } };
    const allDone = mock.distribution.every((d) => results[d.subjectId]);
    updateMock(mock.id, { results, status: allDone ? "concluido" : "planejado" });
    if (feedDashboard) {
      addQuestionLog(
        {
          subjectId,
          topicId: plan.topics[0]?.topicId ?? state.topics.find((t) => t.subjectId === subjectId)!.id,
          total: plan.questions,
          correct,
          errors: [],
          source: mock.name,
        },
        { review: false },
      );
    }
    setInputs((i) => {
      const { [`${mock.id}:${subjectId}`]: _removed, ...rest } = i;
      return rest;
    });
    notify(allDone ? "Simulado concluído — resultado consolidado! 🏆" : `Resultado salvo.`, allDone ? "green" : "blue");
  };

  const mockScore = (m: MockPlan) => {
    const r = m.results ?? {};
    const done = m.distribution.filter((d) => r[d.subjectId]);
    if (done.length === 0) return null;
    const tot = done.reduce((a, d) => a + d.questions, 0);
    const cor = done.reduce((a, d) => a + (r[d.subjectId]?.correct ?? 0), 0);
    return Math.round((cor / tot) * 100);
  };

  const examTotal = (p: PastExam) => Object.values(p.distribution).reduce((a, b) => a + b, 0);
  const topicName = (id: string) => state.topics.find((t) => t.id === id)?.name ?? id;

  return (
    <div>
      <TabHeader
        index="11"
        kicker="Treino de prova real"
        title="Simulados"
        desc="Adicione provas anteriores e o gerador monta um simulado com a MESMA distribuição da banca, priorizando os tópicos mais pesados do edital."
        right={<Chip color="#c9a2ff">{state.mocks.length} gerados</Chip>}
      />

      <Card className="p-6" delay={0}>
        <SectionTitle
          kicker="Passo 1 · Banco de provas anteriores"
          title="O que a banca já cobrou"
          right={<Btn size="sm" variant={formOpen ? "ghost" : "solid"} onClick={() => setFormOpen((f) => !f)}>+ Adicionar prova</Btn>}
        />
        <div className="mt-5 space-y-4">
          {formOpen && <PastExamForm onDone={() => setFormOpen(false)} />}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {state.pastExams.map((p, i) => {
              const active = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                  className="anim-rise relative rounded-xl border p-4 text-left transition-all active:scale-[0.98]"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    borderColor: active ? "rgba(201,162,255,0.5)" : "rgba(0,255,104,0.1)",
                    background: active ? "rgba(201,162,255,0.07)" : "#04140a",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-[14.5px] font-semibold text-snow">{p.name}</div>
                      <div className="num text-[11px] text-mist">{p.banca} · {p.year}</div>
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md border transition-all" style={{ borderColor: active ? "#c9a2ff" : "rgba(0,255,104,0.2)", background: active ? "#c9a2ff" : "transparent" }}>
                      {active && <IcCheck size={12} className="tick-anim text-[#1a0f2e]" />}
                    </span>
                  </div>
                  <div className="mt-3 flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
                    {subjects.filter((s) => (p.distribution[s.id] ?? 0) > 0).map((s) => (
                      <div key={s.id} style={{ flexGrow: p.distribution[s.id], background: s.color }} title={`${s.name}: ${p.distribution[s.id]}`} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="num text-[11.5px] font-semibold text-fog">{examTotal(p)} questões</span>
                    <span className="flex items-center gap-2">
                      {sanitizeUrl(p.link) && (
                        <a href={sanitizeUrl(p.link)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-mist hover:text-info"><IcExternal size={13} /></a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePastExam(p.id);
                          setSelected((s) => s.filter((x) => x !== p.id));
                          notify("Prova removida do banco.", "amber");
                        }}
                        className="text-mist transition-colors hover:text-danger"
                      >
                        <IcTrash size={13} />
                      </button>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6" delay={60}>
        <SectionTitle kicker="Passo 2 · Gerador" title="Monte seu simulado" />
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="kicker mb-2">Provas selecionadas: {selExams.length}</div>
            <div className="flex flex-wrap gap-1.5">
              {selExams.length === 0 && <span className="text-[12.5px] text-mist">nenhuma — clique nos cards acima</span>}
              {selExams.map((p) => <Chip key={p.id} color="#c9a2ff">{p.name} {p.year}</Chip>)}
            </div>
          </div>
          <div>
            <div className="kicker mb-2">Tamanho do simulado</div>
            <div className="flex gap-2">
              {[60, 80, 100, 120].map((n) => (
                <ToggleChip key={n} active={totalQ === n} color="#c9a2ff" onClick={() => setTotalQ(n)}>{n} itens</ToggleChip>
              ))}
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={generate}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#a877ff] to-[#c9a2ff] px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-[#1a0f2e] shadow-[0_0_20px_rgba(201,162,255,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(201,162,255,0.5)] active:scale-[0.98]"
            >
              <IcSpark size={15} /> Gerar simulado
            </button>
          </div>
        </div>
        <p className="mt-4 text-[11.5px] leading-relaxed text-mist">
          Distribuição proporcional à incidência nas provas selecionadas × peso dos tópicos no edital.
          Tempo estimado no ritmo Cebraspe: <b className="num text-fog">2 min/questão</b>.
        </p>
      </Card>

      <div className="mt-6 space-y-4">
        {state.mocks.length === 0 ? (
          <Card className="p-10 text-center" delay={120}>
            <div className="font-display text-[17px] font-semibold text-snow">Nenhum simulado ainda</div>
            <p className="mx-auto mt-1.5 max-w-md text-[12.5px] text-mist">
              Selecione provas acima, escolha o tamanho e clique em “Gerar simulado”.
            </p>
          </Card>
        ) : (
          state.mocks.map((m, mi) => {
            const open = expanded === m.id;
            const score = mockScore(m);
            const doneCount = Object.keys(m.results ?? {}).length;
            return (
              <Card key={m.id} className="overflow-hidden" delay={mi * 60}>
                <button onClick={() => setExpanded(open ? null : m.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(0,255,104,0.03)] sm:grid-cols-[1fr_auto_auto_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[16px] font-semibold text-snow">{m.name}</span>
                      <Chip color={m.status === "concluido" ? "#00ff68" : "#f5b84b"}>{m.status === "concluido" ? "CONCLUÍDO" : "EM EXECUÇÃO"}</Chip>
                    </div>
                    <div className="mt-1 text-[11.5px] text-mist">criado em {m.createdAt} · base: {m.basedOn.join(" + ")}</div>
                  </div>
                  <div className="hidden text-center sm:block"><div className="num text-[18px] font-semibold text-snow">{m.totalQuestions}</div><div className="text-[10px] text-mist">questões</div></div>
                  <div className="hidden text-center sm:block"><div className="num text-[18px] font-semibold text-info">{fmtMin(m.timeMinutes)}</div><div className="text-[10px] text-mist">tempo</div></div>
                  <span className={`text-mist transition-transform duration-300 ${open ? "rotate-180" : ""}`}><IcChevron size={17} /></span>
                </button>

                {open && (
                  <div className="anim-fade border-t border-[rgba(0,255,104,0.1)] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[12.5px] text-fog">
                        Execução: <b className="num text-snow">{doneCount}/{m.distribution.length}</b> disciplinas
                        {score !== null && (
                          <span className="ml-2 font-semibold" style={{ color: score >= 70 ? "#00ff68" : score >= 50 ? "#f5b84b" : "#f0655f" }}>· parcial {score}%</span>
                        )}
                      </span>
                      <span className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-fog">
                          <button
                            onClick={() => setFeedDashboard((f) => !f)}
                            className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-all"
                            style={{ borderColor: feedDashboard ? "#00ff68" : "rgba(0,255,104,0.2)", background: feedDashboard ? "#00ff68" : "transparent" }}
                          >
                            {feedDashboard && <IcCheck size={11} className="tick-anim text-[#001b09]" />}
                          </button>
                          alimentar o Dashboard
                        </label>
                        <button
                          onClick={() => { removeMock(m.id); notify("Simulado excluído.", "amber"); }}
                          className="flex items-center gap-1.5 rounded-full border border-[rgba(240,101,95,0.4)] px-2.5 py-1.5 text-[11.5px] font-semibold text-danger transition-all hover:bg-[rgba(240,101,95,0.1)]"
                        >
                          <IcTrash size={12} /> excluir
                        </button>
                      </span>
                    </div>
                    <div className="space-y-3">
                      {m.distribution.map((d) => {
                        const s = state.subjects.find((x) => x.id === d.subjectId)!;
                        const res = m.results?.[d.subjectId];
                        return (
                          <div key={d.subjectId} className="rounded-xl border border-[rgba(0,255,104,0.1)] bg-[#04140a] p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Dot color={s.color} size={9} />
                              <span className="text-[14px] font-semibold text-snow">{s.name}</span>
                              <span className="num text-[12px] text-mist">{d.questions} questões</span>
                              <div className="hidden w-32 sm:block"><Bar pct={(d.questions / m.totalQuestions) * 100 * 2.2} color={s.color} h={5} /></div>
                              {res ? (
                                <span className="ml-auto flex items-center gap-2">
                                  <span className="num text-[13px] font-semibold" style={{ color: res.correct / res.total >= 0.7 ? "#00ff68" : res.correct / res.total >= 0.5 ? "#f5b84b" : "#f0655f" }}>{res.correct}/{res.total}</span>
                                  <Chip color="#00ff68">FEITO</Chip>
                                </span>
                              ) : (
                                <span className="ml-auto flex items-center gap-2">
                                  <input
                                    type="number" min={0} max={d.questions} placeholder="acertos"
                                    value={inputs[`${m.id}:${d.subjectId}`] ?? ""}
                                    onChange={(e) => setInputs((i) => ({ ...i, [`${m.id}:${d.subjectId}`]: e.target.value }))}
                                    className="num w-24 rounded-lg border border-[rgba(0,255,104,0.2)] bg-[#061a0f] px-2.5 py-1.5 text-[12.5px] text-snow outline-none focus:border-[rgba(0,255,104,0.5)]"
                                  />
                                  <Btn size="sm" onClick={() => recordSubject(m, d.subjectId)}>Salvar</Btn>
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {d.topics.map((t) => (
                                <span key={t.topicId} className="flex items-center gap-1.5 rounded-full border border-[rgba(0,255,104,0.1)] bg-[#061a0f] px-2 py-1 text-[11px] text-fog">
                                  {topicName(t.topicId)} <b className="num text-snow">×{t.questions}</b>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
