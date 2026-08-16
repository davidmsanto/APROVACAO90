import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { Status, Topic } from "../lib/types";
import { STATUS_LIST, statusMeta } from "../lib/types";
import { fmtNum, fmtPct } from "../lib/calc";
import { Bar, Card, Chip, Dot, TabHeader, TextInput, Select } from "../components/ui";
import { IcChevron, IcPlus, IcX } from "../components/icons";

const IMP_COLOR = { alta: "#f0655f", media: "#f5b84b", baixa: "#66716b" } as const;

function DifficultyDots({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={`Dificuldade ${n}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: i < n ? (n >= 4 ? "#f0655f" : n === 3 ? "#f5b84b" : "#00ff68") : "var(--color-raise)" }}
        />
      ))}
    </span>
  );
}

function TopicRow({ t, delay }: { t: Topic; delay: number }) {
  const { setTopicStatus, notify } = useStore();
  const meta = statusMeta(t.status);
  const acc = t.questions ? (t.correct / t.questions) * 100 : null;
  const accColor = acc === null ? "#66716b" : acc >= 80 ? "#00ff68" : acc >= 60 ? "#f5b84b" : "#f0655f";

  const statusSelect = (
    <Select
      value={t.status}
      onChange={(e) => {
        setTopicStatus(t.id, e.target.value as Status);
        notify(`Status: ${statusMeta(e.target.value as Status).label}`, "blue");
      }}
      className="!py-1.5 !text-[12px]"
      style={{ color: meta.color, borderColor: `${meta.color}55` }}
    >
      {STATUS_LIST.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </Select>
  );

  return (
    <div
      className="anim-rise grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-[rgba(0,255,104,0.06)] px-4 py-3 transition-colors last:border-0 hover:bg-[rgba(0,255,104,0.03)] sm:grid-cols-[minmax(200px,1.4fr)_100px_110px_150px_90px]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-snow">{t.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <Chip color={IMP_COLOR[t.importance]}>{t.importance === "media" ? "média" : t.importance}</Chip>
          <DifficultyDots n={t.difficulty} />
        </div>
      </div>
      <div className="hidden sm:block">
        <Bar pct={meta.pct} color={meta.color} h={5} delay={delay + 100} />
        <span className="num mt-1 block text-[10.5px] text-mist">{meta.pct}%</span>
      </div>
      <div className="hidden sm:block">{statusSelect}</div>
      <div className="num hidden text-[12.5px] text-fog sm:block">{t.questions ? fmtNum(t.questions) : "—"}</div>
      <div className="num hidden text-[12.5px] font-semibold sm:block" style={{ color: accColor }}>
        {acc === null ? "—" : fmtPct(acc)}
      </div>
      <div className="sm:hidden">{statusSelect}</div>
    </div>
  );
}

export default function Edital() {
  const { state, stats, editalFilter, setEditalFilter, addTopic, notify } = useStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "todos">("todos");
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    state.subjects.slice(0, 2).forEach((s) => (o[s.id] = true));
    if (editalFilter) o[editalFilter] = true;
    return o;
  });
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const subjects = state.subjects.filter((s) => s.id !== "sim");

  const filtered = useMemo(() => {
    return subjects
      .filter((s) => !editalFilter || s.id === editalFilter)
      .map((s) => ({
        subject: s,
        topics: state.topics
          .filter((t) => t.subjectId === s.id)
          .filter((t) => (statusFilter === "todos" ? true : t.status === statusFilter))
          .filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
      }))
      .filter((g) => g.topics.length > 0 || (!query && statusFilter === "todos"));
  }, [subjects, state.topics, editalFilter, statusFilter, query]);

  const filteredSubject = editalFilter ? state.subjects.find((s) => s.id === editalFilter) : null;

  return (
    <div>
      <TabHeader
        index="03"
        kicker="Base de dados central"
        title="Edital verticalizado"
        desc="Disciplina → tópico → status → prioridade → progresso. Tudo aqui alimenta o Dashboard, Planejador, Revisões e o Índice A90."
        right={<div className="num rounded-full border border-[rgba(0,255,104,0.3)] bg-[rgba(0,255,104,0.1)] px-4 py-2.5 text-[15px] font-semibold text-brand2">{stats.editalPct}% coberto</div>}
      />

      <Card className="mb-5 flex flex-wrap items-center gap-3 p-4" delay={40}>
        <TextInput placeholder="Buscar tópico…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-[240px]" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "todos")} className="max-w-[190px]">
          <option value="todos">Todos os status</option>
          {STATUS_LIST.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        {filteredSubject && (
          <button
            onClick={() => setEditalFilter(null)}
            className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-3 py-2 text-[12.5px] font-semibold text-brand2 transition-all hover:bg-[rgba(0,255,104,0.2)]"
          >
            <span className="h-2 w-2 rounded-[3px]" style={{ background: filteredSubject.color }} />
            {filteredSubject.name}
            <IcX size={13} />
          </button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {STATUS_LIST.map((s) => (
            <span key={s.value} className="flex items-center gap-1.5 text-[11.5px] text-fog">
              <Dot color={s.color} size={7} /> {state.topics.filter((t) => t.status === s.value).length}
            </span>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map(({ subject, topics }, gi) => {
          const all = state.topics.filter((t) => t.subjectId === subject.id);
          const progress = all.length ? Math.round(all.reduce((a, t) => a + statusMeta(t.status).pct, 0) / all.length) : 0;
          const q = all.reduce((a, t) => a + t.questions, 0);
          const c = all.reduce((a, t) => a + t.correct, 0);
          const isOpen = open[subject.id];
          return (
            <Card key={subject.id} className="overflow-hidden" delay={gi * 60}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [subject.id]: !isOpen }))}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(0,255,104,0.03)] sm:grid-cols-[auto_1.3fr_1fr_auto_auto]"
              >
                <span className="h-3.5 w-3.5 rounded-[5px]" style={{ background: subject.color, boxShadow: `0 0 10px ${subject.color}55` }} />
                <span>
                  <span className="block font-display text-[16px] font-semibold text-snow">{subject.name}</span>
                  <span className="text-[11.5px] text-mist">{all.length} tópicos · {fmtNum(q)} questões</span>
                </span>
                <span className="hidden items-center gap-2.5 sm:flex">
                  <span className="w-32"><Bar pct={progress} color={subject.color} h={7} /></span>
                  <span className="num text-[12.5px] font-semibold text-fog">{progress}%</span>
                </span>
                <span className="num hidden text-[12.5px] font-semibold sm:block" style={{ color: q ? (c / q >= 0.8 ? "#00ff68" : c / q >= 0.6 ? "#f5b84b" : "#f0655f") : "#66716b" }}>
                  {q ? fmtPct((c / q) * 100) : "—"}
                </span>
                <span className="text-mist transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                  <IcChevron size={17} />
                </span>
              </button>

              {isOpen && (
                <div className="anim-fade border-t border-[rgba(0,255,104,0.1)]">
                  <div className="kicker hidden grid-cols-[minmax(200px,1.4fr)_100px_110px_150px_90px] gap-4 border-b border-[rgba(0,255,104,0.06)] bg-[#04140a]/60 px-4 py-2 sm:grid">
                    <span>Tópico</span><span>Progresso</span><span>Status</span><span>Questões</span><span>Acertos</span>
                  </div>
                  {topics.map((t, i) => (
                    <TopicRow key={t.id} t={t} delay={i * 40} />
                  ))}
                  {topics.length === 0 && (
                    <div className="px-5 py-6 text-center text-[13px] text-mist">Nenhum tópico encontrado com estes filtros.</div>
                  )}
                  <div className="border-t border-[rgba(0,255,104,0.06)] p-3">
                    {adding === subject.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newName.trim().length > 1) {
                            addTopic(subject.id, newName.trim());
                            notify(`Tópico adicionado em ${subject.name}`, "blue");
                            setNewName("");
                            setAdding(null);
                          }
                        }}
                      >
                        <TextInput autoFocus maxLength={60} placeholder="Nome do novo tópico…" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        <button type="submit" className="rounded-full bg-gradient-to-br from-[#00b947] to-[#00e85d] px-4 text-[12px] font-semibold text-[#001b09] transition-all hover:shadow-[0_0_20px_rgba(0,255,90,0.35)] active:scale-95">
                          Adicionar
                        </button>
                        <button type="button" onClick={() => setAdding(null)} className="rounded-full border border-[rgba(0,255,104,0.2)] px-3 text-[12px] text-fog hover:text-snow">
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAdding(subject.id)}
                        className="flex items-center gap-2 rounded-full border border-dashed border-[rgba(0,255,104,0.2)] px-3 py-2 text-[12.5px] font-semibold text-mist transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2"
                      >
                        <IcPlus size={14} /> Adicionar tópico a {subject.short}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
