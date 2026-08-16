import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { ErrorType } from "../lib/types";
import { ERROR_LIST } from "../lib/types";
import { fmtDay, fmtNum, fmtPct } from "../lib/calc";
import { Btn, Card, Chip, Dot, Field, Select, TabHeader, TextInput, ToggleChip } from "../components/ui";
import { IcCheck } from "../components/icons";

export default function Questoes() {
  const { state, stats, addQuestionLog, notify } = useStore();
  const subjects = state.subjects.filter((s) => s.id !== "sim");
  const [subjectId, setSubjectId] = useState("rlm");
  const topics = state.topics.filter((t) => t.subjectId === subjectId);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [total, setTotal] = useState("");
  const [correct, setCorrect] = useState("");
  const [errors, setErrors] = useState<ErrorType[]>([]);
  const [source, setSource] = useState(state.settings.banca);
  const [filter, setFilter] = useState("todos");
  const [limit, setLimit] = useState(14);

  const pickSubject = (id: string) => {
    setSubjectId(id);
    setTopicId(state.topics.filter((x) => x.subjectId === id)[0]?.id ?? "");
  };

  const submit = () => {
    const t = parseInt(total, 10);
    const c = parseInt(correct, 10);
    if (!t || t <= 0 || isNaN(c) || c < 0) {
      notify("Informe um número válido de questões e acertos.", "red");
      return;
    }
    if (c > t) {
      notify("Acertos não podem superar o total de questões.", "red");
      return;
    }
    addQuestionLog({ subjectId, topicId, total: t, correct: c, errors, source: source || state.settings.banca });
    notify(`+${t} questões registradas · revisão R1 agendada para amanhã`, "green");
    setTotal("");
    setCorrect("");
    setErrors([]);
  };

  const logs = useMemo(
    () =>
      [...state.questionLogs]
        .filter((l) => filter === "todos" || l.subjectId === filter)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.questionLogs, filter],
  );

  const errorDist = useMemo(() => {
    const count: Record<string, number> = {};
    state.questionLogs.forEach((l) => l.errors.forEach((e) => (count[e] = (count[e] ?? 0) + 1)));
    const max = Math.max(...Object.values(count), 1);
    return ERROR_LIST.map((e) => ({ ...e, n: count[e.value] ?? 0, pct: ((count[e.value] ?? 0) / max) * 100 }));
  }, [state.questionLogs]);

  const topicName = (id: string) => state.topics.find((t) => t.id === id)?.name ?? "—";
  const subjOf = (id: string) => state.subjects.find((s) => s.id === id);

  return (
    <div>
      <TabHeader
        index="05"
        kicker="Registro de desempenho"
        title="Questões"
        desc="Cada bloco atualiza o aproveitamento da disciplina, alimenta os alertas e agenda a revisão R1."
        right={<Chip color="#f5b84b">{fmtNum(stats.questionsTotal)} no ciclo</Chip>}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit p-6" delay={40}>
          <div className="kicker mb-4">Registrar bloco de questões</div>
          <div className="space-y-4">
            <Field label="Disciplina">
              <Select value={subjectId} onChange={(e) => pickSubject(e.target.value)}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tópico">
              <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Questões">
                <TextInput type="number" min={1} placeholder="ex.: 30" value={total} onChange={(e) => setTotal(e.target.value)} />
              </Field>
              <Field label="Acertos">
                <TextInput type="number" min={0} placeholder="ex.: 24" value={correct} onChange={(e) => setCorrect(e.target.value)} />
              </Field>
            </div>
            {total && correct && parseInt(total) > 0 && (
              <div className="anim-fade flex items-center gap-2 rounded-lg border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-3 py-2 text-[12.5px]">
                <span className="text-mist">Aproveitamento do bloco:</span>
                <span
                  className="num font-semibold"
                  style={{
                    color:
                      parseInt(correct) / parseInt(total) >= 0.8 ? "#00ff68" :
                      parseInt(correct) / parseInt(total) >= 0.6 ? "#f5b84b" : "#f0655f",
                  }}
                >
                  {fmtPct((parseInt(correct) / parseInt(total)) * 100)}
                </span>
              </div>
            )}
            <Field label="Tipos de erro (opcional)">
              <div className="flex flex-wrap gap-1.5">
                {ERROR_LIST.map((e) => (
                  <ToggleChip
                    key={e.value}
                    active={errors.includes(e.value)}
                    color="#f5b84b"
                    onClick={() => setErrors((cur) => (cur.includes(e.value) ? cur.filter((x) => x !== e.value) : [...cur, e.value]))}
                  >
                    {e.label}
                  </ToggleChip>
                ))}
              </div>
            </Field>
            <Field label="Fonte">
              <TextInput value={source} onChange={(e) => setSource(e.target.value)} placeholder="Banca / banco de questões" />
            </Field>
            <Btn className="w-full" onClick={submit}>
              <IcCheck size={15} /> Registrar e agendar R1
            </Btn>
            <p className="text-[11px] leading-relaxed text-mist">
              Ao registrar, o sistema soma ao tópico no edital e cria a revisão R1 (+{state.settings.intervals[0]} dia).
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5" delay={100}>
            <div className="kicker mb-3">Onde estão os erros</div>
            <div className="space-y-2">
              {errorDist.map((e, i) => (
                <div key={e.value} className="grid grid-cols-[110px_1fr_auto] items-center gap-3">
                  <span className="text-[12px] font-medium text-fog">{e.label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-raise">
                    <div className="bar-grow h-full rounded-full bg-amber/80" style={{ width: `${e.pct}%`, animationDelay: `${i * 70}ms` }} />
                  </div>
                  <span className="num text-[11.5px] text-mist">{e.n}×</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden" delay={160}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,255,104,0.1)] px-5 py-4">
              <div className="font-display text-[16px] font-semibold text-snow">Histórico de blocos</div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-auto !py-1.5 !text-[12px]">
                <option value="todos">Todas as disciplinas</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="kicker border-b border-[rgba(0,255,104,0.1)] bg-[#04140a]/60">
                    <th className="px-5 py-2.5 font-semibold">Data</th>
                    <th className="px-3 py-2.5 font-semibold">Tópico</th>
                    <th className="px-3 py-2.5 font-semibold">Bloco</th>
                    <th className="px-3 py-2.5 font-semibold">Acerto</th>
                    <th className="px-5 py-2.5 font-semibold">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, limit).map((l, i) => {
                    const s = subjOf(l.subjectId);
                    const pct = (l.correct / l.total) * 100;
                    return (
                      <tr key={l.id} className="anim-rise border-b border-[rgba(0,255,104,0.06)] text-[12.5px] last:border-0 hover:bg-[rgba(0,255,104,0.03)]" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                        <td className="num px-5 py-3 text-fog">{fmtDay(l.date)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Dot color={s?.color ?? "#a5b0aa"} size={7} />
                            <span className="max-w-[220px] truncate font-semibold text-snow">{topicName(l.topicId)}</span>
                          </div>
                          <span className="text-[10.5px] text-mist">{l.source}</span>
                        </td>
                        <td className="num px-3 py-3 text-fog">{l.correct}/{l.total}</td>
                        <td className="num px-3 py-3 font-semibold" style={{ color: pct >= 80 ? "#00ff68" : pct >= 60 ? "#f5b84b" : "#f0655f" }}>
                          {fmtPct(pct, 0)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {l.errors.map((e) => (
                              <span key={e} className="rounded-full border border-amber/30 bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber">
                                {ERROR_LIST.find((x) => x.value === e)?.label}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {logs.length > limit && (
              <div className="p-4 text-center">
                <Btn variant="ghost" size="sm" onClick={() => setLimit((l) => l + 20)}>
                  Mostrar mais ({logs.length - limit} restantes)
                </Btn>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
