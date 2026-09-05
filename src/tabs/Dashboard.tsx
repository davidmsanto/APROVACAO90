import { useState } from "react";
import { useStore } from "../lib/store";
import type { FocusItem } from "../lib/calc";
import { fmtMin, fmtNum, fmtPct, parseISO, TONE_COLOR } from "../lib/calc";
import { Bar, Btn, Card, Chip, Dot, Ring, SectionTitle, TabHeader, useCountUp } from "../components/ui";
import {
  IcAlert,
  IcArrow,
  IcBolt,
  IcCheck,
  IcClock,
  IcFlame,
  IcRefresh,
  IcTarget,
  IcTrophy,
} from "../components/icons";

/* ================= indicadores ================= */

function TileEdital() {
  const { stats, setTab } = useStore();
  const pct = useCountUp(stats.editalPct);
  const rows = stats.rows;
  return (
    <Card hover className="col-span-2 p-5" delay={0}>
      <div className="flex items-start justify-between">
        <div className="kicker">🎯 Progresso do edital</div>
        <button onClick={() => setTab("edital")} className="text-[11.5px] font-semibold text-brand2 hover:underline">
          abrir edital →
        </button>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="num text-[44px] font-semibold leading-none text-snow">{pct}%</span>
        <span className="text-[12.5px] text-mist">
          {stats.topicsDone} de {stats.topicsTotal} tópicos concluídos
        </span>
      </div>
      <div className="mt-4 flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full">
        {rows.map((r, i) => (
          <div
            key={r.subject.id}
            className="relative h-full overflow-hidden rounded-sm bg-raise"
            style={{ flexGrow: Math.max(1, r.topics.length) }}
            title={`${r.subject.name} — ${r.progress}%`}
          >
            <div
              className="bar-grow absolute inset-y-0 left-0 rounded-sm"
              style={{ width: `${r.progress}%`, background: r.subject.color, animationDelay: `${150 + i * 70}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {rows.map((r) => (
          <span key={r.subject.id} className="flex items-center gap-1.5 text-[11px] text-fog">
            <span className="h-2 w-2 rounded-[3px]" style={{ background: r.subject.color }} />
            {r.subject.short} <span className="num text-mist">{r.progress}%</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function TileHoras() {
  const { state, stats } = useStore();
  const min = useCountUp(stats.hoursTotalMin);
  const goal = state.settings.courseGoalHours * 60;
  return (
    <Card hover className="p-5" delay={60}>
      <div className="kicker flex items-center gap-1.5"><IcClock size={13} /> Horas estudadas</div>
      <div className="num mt-2 text-[30px] font-semibold leading-none text-snow">{fmtMin(min)}</div>
      <div className="mt-3">
        <Bar pct={(stats.hoursTotalMin / goal) * 100} color="#00ff68" h={6} delay={200} />
        <div className="mt-1.5 text-[11.5px] text-mist">Meta do ciclo: {state.settings.courseGoalHours}h</div>
      </div>
    </Card>
  );
}

function TileQuestoes() {
  const { state, stats } = useStore();
  const q = useCountUp(stats.questionsTotal);
  const last7 = state.questionLogs
    .filter((l) => Date.now() - parseISO(l.date).getTime() < 7 * 86400000)
    .reduce((a, l) => a + l.total, 0);
  return (
    <Card hover className="p-5" delay={120}>
      <div className="kicker flex items-center gap-1.5"><IcTarget size={13} /> Questões</div>
      <div className="num mt-2 text-[30px] font-semibold leading-none text-snow">{fmtNum(q)}</div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-mist">
        <Chip color="#f5b84b">+{fmtNum(last7)} em 7 dias</Chip>
      </div>
    </Card>
  );
}

function TileAproveitamento() {
  const { state, stats } = useStore();
  const a = useCountUp(Math.round(stats.accTotal * 10) / 10);
  const th = state.settings.thresholds;
  const color = stats.accTotal >= th.green ? "#00ff68" : stats.accTotal >= th.yellow ? "#f5b84b" : "#f0655f";
  return (
    <Card hover className="p-5" delay={180}>
      <div className="kicker">✅ Aproveitamento</div>
      <div className="num mt-2 text-[30px] font-semibold leading-none" style={{ color }}>
        {a.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </div>
      <div className="relative mt-4 h-1.5 rounded-full bg-raise">
        <div className="bar-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${stats.accTotal}%`, background: color, animationDelay: "250ms" }} />
        <span className="absolute -top-[3px] h-3 w-[2px] bg-amber" style={{ left: `${th.yellow}%` }} />
        <span className="absolute -top-[3px] h-3 w-[2px] bg-brand2" style={{ left: `${th.green}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-mist">
        <span>crítico &lt;{th.yellow}</span>
        <span>consolidado ≥{th.green}</span>
      </div>
    </Card>
  );
}

function TileRevisoes() {
  const { stats, setTab } = useStore();
  const p = useCountUp(stats.reviewsPct);
  return (
    <Card hover className="p-5" delay={240}>
      <div className="kicker flex items-center gap-1.5"><IcRefresh size={13} /> Revisões</div>
      <div className="num mt-2 text-[30px] font-semibold leading-none text-snow">{p}%</div>
      <div className="mt-2 text-[11.5px] text-mist">concluídas no ciclo</div>
      <button onClick={() => setTab("revisoes")} className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-info hover:underline">
        <Dot color={stats.dueToday + stats.overdue > 0 ? "#5cb3ff" : "#00ff68"} pulse size={7} />
        {stats.dueToday + stats.overdue} para hoje → revisar
      </button>
    </Card>
  );
}

function TileMeta() {
  const { state, stats } = useStore();
  const goal = state.settings.weeklyGoalHours;
  const pct = Math.min(100, (stats.weekMinutes / (goal * 60)) * 100);
  return (
    <Card hover className="p-5" delay={300}>
      <div className="kicker">📅 Meta semanal</div>
      <div className="num mt-2 text-[30px] font-semibold leading-none text-snow">
        {fmtMin(stats.weekMinutes)} <span className="text-[16px] text-mist">/ {goal}h</span>
      </div>
      <div className="mt-3">
        <Bar pct={pct} color={pct >= 100 ? "#00ff68" : "#5cb3ff"} h={6} delay={350} />
        <div className="mt-1.5 text-[11.5px] text-mist">
          {pct >= 100 ? "Meta da semana cumprida 🏆" : `Faltam ${fmtMin(Math.max(0, goal * 60 - stats.weekMinutes))} nesta semana`}
        </div>
      </div>
    </Card>
  );
}

/* ================= índice A90 ================= */

function IndexCard() {
  const { stats } = useStore();
  const score = useCountUp(stats.indexScore, 1200);
  return (
    <Card className="col-span-2 p-6" delay={120}>
      <SectionTitle kicker="Métrica proprietária" title="Índice APROVAÇÃO 90" />
      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <Ring value={stats.indexScore} size={168} stroke={13} color={stats.indexBand.color}>
            <span className="num text-[44px] font-semibold leading-none text-snow">{score}</span>
            <span className="num text-[12px] font-semibold text-mist">/ 100</span>
          </Ring>
          <div className="mt-3 flex items-center gap-2">
            <Dot color={stats.indexBand.color} pulse size={9} />
            <span className="font-display text-[16px] font-semibold" style={{ color: stats.indexBand.color }}>
              {stats.indexBand.label}
            </span>
          </div>
        </div>
        <div>
          <p className="max-w-md text-[13px] leading-relaxed text-fog">{stats.indexBand.desc}</p>
          <div className="mt-4 space-y-2.5">
            {stats.indexParts.map((p, i) => (
              <div key={p.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium text-fog">{p.label}</span>
                  <span className="num text-mist">peso {p.weight}%</span>
                </div>
                <span className="num text-right text-[12.5px] font-semibold text-snow">{p.value}</span>
                <div className="col-span-2">
                  <Bar
                    pct={p.value}
                    h={5}
                    delay={200 + i * 90}
                    color={p.value >= 78 ? "#00ff68" : p.value >= 55 ? "#f5b84b" : "#f0655f"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function StreakCard() {
  const { stats } = useStore();
  const max = Math.max(...stats.last14.map((d) => d.minutes), 1);
  return (
    <Card className="p-6" delay={200}>
      <div className="flex items-center justify-between">
        <div className="kicker">⏰ Regularidade</div>
        <IcFlame size={22} className="flame-anim text-amber" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-[46px] font-semibold leading-none text-amber">{stats.streak}</span>
        <span className="text-[13px] font-semibold text-fog">dias consecutivos estudando</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[12px] text-mist">
        <IcTrophy size={14} className="text-brand2" /> Melhor sequência: <b className="num text-snow">{stats.bestStreak} dias</b>
      </div>
      <div className="mt-5">
        <div className="kicker mb-2 !text-[9.5px]">Últimos 14 dias</div>
        <div className="flex items-end gap-1.5">
          {stats.last14.map((d, i) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date} — ${fmtMin(d.minutes)}`}>
              <div className="flex h-12 w-full items-end overflow-hidden rounded-[4px] bg-raise">
                <div
                  className="col-grow w-full rounded-[4px]"
                  style={{
                    height: `${d.minutes ? 18 + (d.minutes / max) * 82 : 0}%`,
                    background: d.minutes ? (d.minutes >= 90 ? "#00ff68" : "#006b2c") : "transparent",
                    animationDelay: `${i * 40}ms`,
                    boxShadow: d.minutes >= 90 ? "0 0 10px rgba(0,255,104,0.4)" : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-mist">
          <span>-13d</span><span>hoje</span>
        </div>
      </div>
    </Card>
  );
}

/* ================= foco de hoje ================= */

function FocusCard() {
  const { state, stats, toggleFocus, notify } = useStore();
  const [ritual, setRitual] = useState<Record<string, boolean[]>>({});
  const checks = ["Estudar", "Resolver questões", "Registrar desempenho"];

  const set = (key: string, i: number) =>
    setRitual((r) => {
      const cur = r[key] ?? [false, false, false];
      const nx = [...cur];
      nx[i] = !nx[i];
      return { ...r, [key]: nx };
    });

  const item = (f: FocusItem, idx: number) => {
    const done = state.focusDone.includes(f.key);
    const r = ritual[f.key] ?? [false, false, false];
    const canFinish = r[0];
    return (
      <div
        key={f.key}
        className="anim-rise rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 transition-colors hover:border-[rgba(0,255,104,0.3)]"
        style={{ animationDelay: `${idx * 90}ms` }}
      >
        <div className="flex items-start gap-3.5">
          <span
            className="num mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[14px] font-semibold"
            style={{ borderColor: `${f.subject.color}55`, color: f.subject.color, background: `${f.subject.color}12` }}
          >
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-[16px] font-semibold text-snow">{f.subject.name}</span>
              <Chip color={f.subject.color}>{f.subject.short}</Chip>
            </div>
            <div className="mt-0.5 text-[13.5px] text-fog">{f.topic.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-mist">
              <span className="flex items-center gap-1"><IcClock size={12} /> {f.minutes} minutos</span>
              <span className="flex items-center gap-1"><IcBolt size={12} /> {f.reason}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {checks.map((c, i) => (
                <button
                  key={c}
                  onClick={() => set(f.key, i)}
                  disabled={done}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    borderColor: r[i] ? "rgba(0,255,104,0.5)" : "rgba(0,255,104,0.14)",
                    color: r[i] ? "#00ff68" : "var(--color-fog)",
                    background: r[i] ? "rgba(0,255,104,0.08)" : "transparent",
                  }}
                >
                  <span
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border"
                    style={{ borderColor: r[i] ? "#00ff68" : "rgba(0,255,104,0.2)", background: r[i] ? "#00ff68" : "transparent" }}
                  >
                    {r[i] && <IcCheck size={10} className="tick-anim text-[#001b09]" />}
                  </span>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            {done ? (
              <span className="flex items-center gap-1.5 rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-3 py-2 text-[12px] font-semibold text-brand2">
                <IcCheck size={14} /> Concluído
              </span>
            ) : (
              <Btn
                size="sm"
                disabled={!canFinish}
                onClick={() => {
                  toggleFocus({ key: f.key, topic: f.topic, minutes: f.minutes });
                  notify(`Sessão de ${f.minutes} min registrada — ${f.subject.short}`);
                }}
              >
                Concluir sessão
              </Btn>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6" delay={60}>
      <SectionTitle kicker="Central de ação" title="📚 Foco de hoje" />
      <p className="mt-2 max-w-xl text-[12.5px] text-fog">
        Priorizado automaticamente: dificuldade × aproveitamento × importância no edital.
        Marque o ritual e conclua a sessão para alimentar o painel.
      </p>
      {stats.focus.length > 0 && stats.focus.every((f) => state.focusDone.includes(f.key)) && (
        <div className="anim-rise mt-4 flex items-center gap-3 rounded-xl border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-4 py-3">
          <IcTrophy size={18} className="text-brand2" />
          <div>
            <div className="text-[13.5px] font-semibold text-brand2">Foco de hoje concluído 🏆</div>
            <div className="text-[12px] text-fog">Sessões registradas — streak, horas e Índice atualizados.</div>
          </div>
        </div>
      )}
      <div className="mt-4 space-y-3">{stats.focus.map(item)}</div>
    </Card>
  );
}

/* ================= radar ================= */

function RadarCard() {
  const { stats, setTab, setEditalFilter } = useStore();
  const labels = { green: "Consolidado", yellow: "Atenção", red: "Crítico", gray: "Sem dados" } as const;
  return (
    <Card className="p-6" delay={120}>
      <SectionTitle kicker="Radar das disciplinas" title="Onde investir energia agora" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="kicker border-b border-[rgba(0,255,104,0.1)]">
              <th className="pb-2.5 pr-3 font-semibold">Disciplina</th>
              <th className="pb-2.5 pr-3 font-semibold">Progresso</th>
              <th className="pb-2.5 pr-3 font-semibold">Questões</th>
              <th className="pb-2.5 pr-3 font-semibold">Acertos</th>
              <th className="pb-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.rows.map((r, i) => (
              <tr
                key={r.subject.id}
                onClick={() => {
                  setEditalFilter(r.subject.id);
                  setTab("edital");
                }}
                className="anim-rise cursor-pointer border-b border-[rgba(0,255,104,0.06)] transition-colors last:border-0 hover:bg-[rgba(0,255,104,0.04)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: r.subject.color }} />
                    <span className="text-[13.5px] font-semibold text-snow">{r.subject.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-24"><Bar pct={r.progress} color={r.subject.color} h={6} delay={200 + i * 60} /></div>
                    <span className="num text-[12px] text-fog">{r.progress}%</span>
                  </div>
                </td>
                <td className="num py-3 pr-3 text-[13px] text-fog">{fmtNum(r.questions)}</td>
                <td className="num py-3 pr-3 text-[13px] font-semibold" style={{ color: TONE_COLOR[r.tone] }}>
                  {r.acc === null ? "—" : fmtPct(r.acc)}
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: TONE_COLOR[r.tone] }}>
                    <Dot color={TONE_COLOR[r.tone]} pulse={r.tone === "red"} size={8} />
                    {labels[r.tone]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ================= alertas ================= */

function AlertsCard() {
  const { stats, setTab, setEditalFilter } = useStore();
  const sevColor = { red: "#f0655f", yellow: "#f5b84b", green: "#00ff68" } as const;
  const sevLabel = { red: "PRIORIDADE", yellow: "ATENÇÃO", green: "NO RITMO" } as const;
  return (
    <Card className="p-6" delay={180}>
      <SectionTitle kicker="Alerta inteligente" title="🚨 O sistema analisou sua semana" />
      <div className="mt-4 space-y-3">
        {stats.alerts.slice(0, 5).map((a, i) => (
          <button
            key={a.subjectName + a.sev}
            onClick={() => {
              setEditalFilter(a.gotoSubject);
              setTab("edital");
            }}
            className="anim-rise group block w-full rounded-xl border border-[rgba(0,255,104,0.1)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.3)]"
            style={{ animationDelay: `${i * 80}ms`, borderLeft: `3px solid ${sevColor[a.sev]}` }}
          >
            <div className="flex items-center gap-2.5">
              <Dot color={sevColor[a.sev]} pulse={a.sev === "red"} size={9} />
              <span className="num text-[10.5px] font-semibold tracking-widest" style={{ color: sevColor[a.sev] }}>
                {sevLabel[a.sev]}
              </span>
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-snow">
                <span className="h-2 w-2 rounded-[3px]" style={{ background: a.color }} />
                {a.subjectName}
              </span>
              <span className="ml-auto text-mist transition-transform group-hover:translate-x-1"><IcArrow size={15} /></span>
            </div>
            <div className="mt-2 text-[13px] font-semibold text-snow">{a.title}</div>
            <div className="text-[12px] text-fog">{a.detail}</div>
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#061a0f] px-3 py-2 text-[12px] text-fog">
              <IcAlert size={13} className="mt-0.5 shrink-0" style={{ color: sevColor[a.sev] }} />
              <span><b className="text-snow">Recomendação:</b> {a.rec}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ================= evolução semanal ================= */

function EvolutionCard() {
  const { state, stats } = useStore();
  const max = Math.max(...stats.weeks.map((w) => w.questions), 1);
  const th = state.settings.thresholds.green;
  return (
    <Card className="p-6" delay={240}>
      <SectionTitle kicker="📈 Evolução semanal" title="Você precisa enxergar a subida" />
      <div className="mt-5 grid gap-8 md:grid-cols-2">
        <div>
          <div className="kicker mb-3">Questões resolvidas / semana</div>
          <div className="flex h-40 items-end gap-3">
            {stats.weeks.map((w, i) => (
              <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`num text-[11px] font-semibold ${w.current ? "text-brand2" : "text-fog"}`}>
                  {w.questions || ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="col-grow w-full rounded-t-md"
                    style={{
                      height: `${Math.max(3, (w.questions / max) * 100)}%`,
                      background: w.current
                        ? "linear-gradient(180deg, #00ff68, #006b2c)"
                        : "linear-gradient(180deg, #0e3320, #061a0f)",
                      animationDelay: `${i * 90}ms`,
                      boxShadow: w.current ? "0 0 18px rgba(0,255,104,0.3)" : "none",
                    }}
                  />
                </div>
                <span className={`text-[10.5px] ${w.current ? "font-semibold text-brand2" : "text-mist"}`}>
                  {w.current ? "atual" : w.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="kicker mb-3">Aproveitamento % / semana</div>
          <svg viewBox="0 0 320 150" className="w-full">
            {[0, 25, 50, 75, 100].map((g) => (
              <line key={g} x1="26" x2="312" y1={128 - g * 1.1} y2={128 - g * 1.1} stroke="rgba(0,255,104,0.07)" strokeWidth="1" />
            ))}
            <line x1="26" x2="312" y1={128 - th * 1.1} y2={128 - th * 1.1} stroke="#00ff68" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <text x="310" y={124 - th * 1.1} textAnchor="end" fill="#00ff68" fontSize="9" fontFamily="IBM Plex Mono">
              meta {th}%
            </text>
            {(() => {
              const pts = stats.weeks
                .map((w, i) => ({ x: 36 + i * 54, y: 128 - (w.acc ?? 0) * 1.1, w }))
                .filter((p) => p.w.acc !== null);
              if (pts.length === 0) return null;
              const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
              const area = `M ${pts[0].x} 128 L ${line.replace(/ /g, " L ")} L ${pts[pts.length - 1].x} 128 Z`;
              return (
                <>
                  <path d={area} fill="rgba(0,255,104,0.08)" />
                  <polyline points={line} fill="none" stroke="#00ff68" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p) => (
                    <g key={p.x}>
                      <circle cx={p.x} cy={p.y} r="3.4" fill="#020b06" stroke="#00ff68" strokeWidth="2" />
                      <text x={p.x} y={p.y - 9} textAnchor="middle" fill={p.w.current ? "#00ff68" : "#a5b0aa"} fontSize="10" fontWeight="700" fontFamily="IBM Plex Mono">
                        {Math.round(p.w.acc ?? 0)}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[10.5px] text-mist">
            {stats.weeks.map((w) => (
              <span key={w.label} className={w.current ? "font-semibold text-brand2" : ""}>
                {w.current ? "atual" : w.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ================= página ================= */

export default function Dashboard() {
  const { state, stats, setTab } = useStore();
  return (
    <div>
      <TabHeader
        index="02"
        kicker="Painel de preparação"
        title="Dashboard"
        desc={`${state.settings.concurso} · ${state.settings.cargo} · banca ${state.settings.banca}.`}
        right={
          <div className="flex items-center gap-2">
            <Chip color={stats.indexBand.color}>ÍNDICE {stats.indexScore}/100</Chip>
            <Btn variant="ghost" size="sm" onClick={() => setTab("questoes")}>
              + Registrar questões
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <TileEdital />
        <TileHoras />
        <TileQuestoes />
        <TileAproveitamento />
        <TileRevisoes />
        <TileMeta />
        <Card hover className="flex flex-col justify-between border-[rgba(0,255,104,0.25)] bg-gradient-to-b from-[rgba(0,255,104,0.07)] to-transparent p-5" delay={340}>
          <div className="kicker !text-brand2">⏳ Contagem regressiva</div>
          <div className="num mt-2 text-[30px] font-semibold leading-none text-brand2" style={{ textShadow: "0 0 24px rgba(0,255,104,0.4)" }}>D-{stats.daysLeft}</div>
          <div className="mt-2 text-[11.5px] text-mist">prova em {parseISO(state.settings.examDate).toLocaleDateString("pt-BR")}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <IndexCard />
        <StreakCard />
      </div>

      <div className="mt-6">
        <FocusCard />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <RadarCard />
        <AlertsCard />
      </div>

      <div className="mt-6">
        <EvolutionCard />
      </div>
    </div>
  );
}
