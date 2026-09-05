import { useStore } from "../lib/store";
import { PHASES } from "../lib/types";
import { fmtMin } from "../lib/calc";
import { Bar, Card, Chip, Dot, TabHeader } from "../components/ui";
import { IcFlag, IcTrophy } from "../components/icons";

const RANGES = ["acima de 120 dias", "61 a 120 dias", "22 a 60 dias", "21 dias ou menos"];

export default function Metas() {
  const { state, stats, updateSettings, notify } = useStore();
  const goal = state.settings.weeklyGoalHours;
  const done = stats.weekMinutes;
  const pct = Math.min(100, (done / (goal * 60)) * 100);
  const goalHistory = stats.weeks.map((w) => {
    const plannedMin = goal * 60;
    const reachedMin = (w.questions > 0 ? w.questions * 2 : 0) + (w.current ? done : 0);
    return { ...w, plannedMin, reachedPct: Math.min(100, Math.round((reachedMin / plannedMin) * 100)) };
  });

  const setGoal = (v: number) => {
    const next = Math.min(60, Math.max(2, v));
    updateSettings({ ...state.settings, weeklyGoalHours: next });
    notify(`Meta semanal ajustada para ${next}h`, "blue");
  };

  return (
    <div>
      <TabHeader
        index="07"
        kicker="Compromisso semanal"
        title="Metas"
        desc="A meta semanal é o combustível da consistência. Ela alimenta diretamente o componente 'Metas' do Índice A90."
        right={<Chip color={pct >= 100 ? "#00ff68" : "#f5b84b"}>{Math.round(pct)}% da semana</Chip>}
      />

      <Card className="p-6" delay={0}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="kicker mb-1 flex items-center gap-2"><IcFlag size={14} /> Meta semanal</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setGoal(goal - 2)}
                className="num flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,255,104,0.2)] text-[18px] text-fog transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2 active:scale-90"
              >
                −
              </button>
              <span className="num text-[52px] font-semibold leading-none text-snow" style={{ textShadow: "0 0 30px rgba(0,255,104,0.25)" }}>
                {goal}<span className="text-[24px] text-mist">h</span>
              </span>
              <button
                onClick={() => setGoal(goal + 2)}
                className="num flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,255,104,0.2)] text-[18px] text-fog transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2 active:scale-90"
              >
                +
              </button>
            </div>
            <div className="mt-1 text-[12.5px] text-mist">por semana · ≈ {Math.round((goal / 7) * 10) / 10}h por dia</div>
          </div>
          <div className="min-w-[260px] flex-1">
            <div className="mb-1.5 flex justify-between text-[12px] text-mist">
              <span>Executado nesta semana</span>
              <span className="num font-semibold text-brand2">{fmtMin(done)} / {goal}h</span>
            </div>
            <Bar pct={pct} color={pct >= 100 ? "#00ff68" : "#5cb3ff"} h={10} />
            <div className="mt-2 text-[12px] text-fog">
              {pct >= 100
                ? "Meta cumprida — cada hora extra agora é margem de segurança."
                : `Faltam ${fmtMin(Math.max(0, goal * 60 - done))} para fechar a semana no verde.`}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6" delay={60}>
          <div className="kicker mb-4">Últimas 4 semanas × meta</div>
          <div className="space-y-4">
            {goalHistory.map((w, i) => {
              const ok = w.reachedPct >= 100;
              return (
                <div key={w.label} className="anim-rise" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className={`font-semibold ${w.current ? "text-brand2" : "text-fog"}`}>
                      {w.current ? "Semana atual" : w.label}
                      {ok && <IcTrophy size={13} className="ml-1.5 inline text-amber" />}
                    </span>
                    <span className="num text-mist">{w.reachedPct}%</span>
                  </div>
                  <Bar pct={w.reachedPct} color={ok ? "#00ff68" : w.reachedPct >= 60 ? "#f5b84b" : "#f0655f"} h={7} delay={i * 100} />
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-mist">
            Semanas no verde mantêm o componente de Metas do Índice alto e protegem sua regularidade.
          </p>
        </Card>

        <Card className="p-6" delay={120}>
          <div className="kicker mb-4">Fases da preparação</div>
          <div className="space-y-2.5">
            {PHASES.map((p, i) => (
              <div key={p.key} className="flex items-center gap-3 rounded-xl border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-3.5 py-3">
                <Dot color={p.color} pulse={i === stats.phaseIndex} size={9} />
                <div className="flex-1">
                  <span className="text-[13px] font-semibold text-snow">{p.label}</span>
                  <span className="ml-2 text-[11.5px] text-mist">{RANGES[i]}</span>
                  <div className="text-[11.5px] text-fog">{p.desc}</div>
                </div>
                {i === stats.phaseIndex && <Chip color={p.color}>FASE ATUAL</Chip>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
