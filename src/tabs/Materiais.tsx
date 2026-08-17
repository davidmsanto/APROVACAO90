import { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { QUESTION_SITES, VIDEO_CHANNELS, ytSearch } from "../lib/knowledge";
import { fmtMin } from "../lib/calc";
import { Btn, Card, Chip, Dot, Field, Select, TabHeader, TextInput } from "../components/ui";
import { IcCheck, IcCopy, IcExternal, IcPause, IcPlay, IcClock } from "../components/icons";

export default function Materiais() {
  const { addVideoSession, notify, visibleSubjects, visibleTopics } = useStore();
  const subjects = visibleSubjects.filter((s) => ["por", "rlm", "inf", "dcn", "dad"].includes(s.id));
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "por");
  const topics = visibleTopics.filter((t) => t.subjectId === subjectId);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [duration, setDuration] = useState(50);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);
  const topic = topics.find((t) => t.id === topicId);

  useEffect(() => {
    setTopicId(visibleTopics.filter((t) => t.subjectId === subjectId)[0]?.id ?? "");
  }, [subjectId, visibleTopics]);

  useEffect(() => () => { if (interval.current) clearInterval(interval.current); }, []);

  if (!subject) {
    return (
      <div>
        <TabHeader
          index="09"
          kicker="Conteúdo gratuito"
          title="Materiais"
          desc="Videoaulas gratuitas das disciplinas básicas e os melhores bancos de questões grátis."
          right={<Chip color="#00ff68">100% gratuito</Chip>}
        />
        <Card className="p-10 text-center">
          <p className="text-[13px] text-fog">
            As disciplinas básicas (Português, RLM, Informática, D. Constitucional, D. Administrativo) não estão no edital ativo.
            Importe um edital que as contenha ou volte ao edital padrão.
          </p>
        </Card>
      </div>
    );
  }

  const start = () => {
    setRunning(true);
    interval.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const pause = () => {
    setRunning(false);
    if (interval.current) clearInterval(interval.current);
  };
  const conclude = () => {
    pause();
    addVideoSession({ subjectId, topicId: topicId || undefined, minutes: duration, note: `Videoaula — ${topic?.name ?? subject.name}` });
    notify(`Sessão de ${duration} min registrada — horas e streak atualizados`, "green");
    setElapsed(0);
  };
  const pct = Math.min(100, (elapsed / (duration * 60)) * 100);

  const copyTopic = (name: string) => {
    navigator.clipboard?.writeText(name).catch(() => {});
    notify(`"${name}" copiado — cole na busca do site`, "blue");
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div>
      <TabHeader
        index="09"
        kicker="Conteúdo gratuito"
        title="Materiais"
        desc="Videoaulas gratuitas das disciplinas básicas e os melhores bancos de questões grátis. Sessão cronometrada alimenta o Dashboard."
        right={<Chip color="#00ff68">100% gratuito</Chip>}
      />

      {/* ===== sessão de videoaula ===== */}
      <Card className="p-6" delay={0}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="kicker mb-4 flex items-center gap-2"><IcPlay size={14} /> Sessão de estudos com videoaula</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Disciplina">
                <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Tópico">
                <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="Duração da sessão">
                <div className="flex gap-2">
                  {[25, 50, 75].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className="flex-1 rounded-full border px-3 py-2.5 text-[12px] font-semibold uppercase transition-all active:scale-95"
                      style={{
                        borderColor: duration === d ? "rgba(0,255,104,0.5)" : "rgba(0,255,104,0.14)",
                        color: duration === d ? "#00ff68" : "var(--color-fog)",
                        background: duration === d ? "rgba(0,255,104,0.08)" : "transparent",
                      }}
                    >
                      {d}min
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <a
              href={ytSearch(`${topic?.name ?? subject.name} ${subject.name} aula completa`)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center gap-3 rounded-xl border border-[rgba(0,255,104,0.25)] bg-gradient-to-r from-[rgba(0,255,104,0.08)] to-transparent px-4 py-3.5 transition-all hover:border-[rgba(0,255,104,0.5)] hover:shadow-[0_0_24px_rgba(0,255,90,0.12)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00b947] to-[#00e85d] text-[#001b09]"><IcPlay size={16} /></span>
              <span>
                <span className="block text-[13.5px] font-semibold text-snow">Abrir videoaula no YouTube</span>
                <span className="text-[11.5px] text-mist">busca pronta: "{topic?.name ?? subject.name}"</span>
              </span>
              <span className="ml-auto text-mist"><IcExternal size={15} /></span>
            </a>
            <div className="mt-2 text-[11.5px] text-mist">
              Canal sugerido: <b className="text-fog">{VIDEO_CHANNELS.find((c) => c.subjectId === subjectId)?.channel}</b>
            </div>
          </div>

          {/* cronômetro */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(0,255,104,0.15)] bg-[#04140a] p-6">
            <div className="kicker mb-3 flex items-center gap-2"><IcClock size={13} /> Cronômetro da sessão</div>
            <div className="num text-[56px] font-semibold leading-none text-snow" style={{ textShadow: running ? "0 0 40px rgba(0,255,104,0.4)" : "none" }}>
              {mm}:{ss}
            </div>
            <div className="mt-4 w-full max-w-[260px]">
              <div className="h-2 overflow-hidden rounded-full bg-raise">
                <div className="h-full rounded-full bg-gradient-to-r from-[#006b2c] to-[#00ff68] transition-all duration-500" style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(0,255,104,0.4)" }} />
              </div>
            </div>
            <div className="mt-4 flex gap-2.5">
              {!running ? (
                <Btn size="sm" onClick={start}><IcPlay size={13} /> Iniciar</Btn>
              ) : (
                <Btn size="sm" variant="ghost" onClick={pause}><IcPause size={13} /> Pausar</Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={conclude} disabled={elapsed === 0}>
                <IcCheck size={13} /> Concluir {duration}min
              </Btn>
            </div>
            <div className="mt-3 text-[10.5px] text-mist">concluir soma {duration} min às suas horas e ao streak</div>
          </div>
        </div>
      </Card>

      {/* ===== bancos de questões ===== */}
      <div className="mt-6">
        <div className="kicker mb-3">Bancos de questões gratuitos</div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUESTION_SITES.map((site, i) => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="card card-hover anim-rise group flex flex-col p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[16px] font-semibold text-snow">{site.name}</span>
                <span className="text-mist transition-transform group-hover:translate-x-1"><IcExternal size={15} /></span>
              </div>
              <div className="mt-2"><Chip color="#00ff68">{site.tag}</Chip></div>
              <div className="mt-4 border-t border-[rgba(0,255,104,0.08)] pt-3 text-[11px] text-mist">
                {site.url.replace("https://", "").replace("www.", "")}
              </div>
            </a>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] text-mist">
          Dica: copie um tópico do edital e cole na busca do banco para filtrar questões por assunto.
        </p>
      </div>
    </div>
  );
}
