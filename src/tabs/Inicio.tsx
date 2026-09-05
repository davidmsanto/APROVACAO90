import { useStore, type TabId } from "../lib/store";
import { PHASES } from "../lib/types";
import { parseISO, fmtMin, fmtPct } from "../lib/calc";
import { Card, Dot, useCountUp, Chip } from "../components/ui";
import { Brand } from "../components/Brand";
import {
  IcArrow,
  IcBolt,
  IcBook,
  IcCalendar,
  IcCards,
  IcChart,
  IcFlag,
  IcFlame,
  IcGrid,
  IcList,
  IcPlay,
  IcRefresh,
  IcSpark,
  IcTarget,
  IcGear,
} from "../components/icons";

const MODULES: { n: string; label: string; tab: TabId; icon: (p: { size?: number }) => React.ReactElement }[] = [
  { n: "01", label: "Início", tab: "inicio", icon: IcBolt },
  { n: "02", label: "Dashboard", tab: "dashboard", icon: IcGrid },
  { n: "03", label: "Edital", tab: "edital", icon: IcList },
  { n: "04", label: "Planejador", tab: "planejador", icon: IcCalendar },
  { n: "05", label: "Questões", tab: "questoes", icon: IcTarget },
  { n: "06", label: "Revisões", tab: "revisoes", icon: IcRefresh },
  { n: "07", label: "Metas", tab: "metas", icon: IcFlag },
  { n: "08", label: "Configurações", tab: "config", icon: IcGear },
];

function BigCountdown() {
  const { stats } = useStore();
  const days = useCountUp(stats.daysLeft, 1200);
  return (
    <div className="flex items-baseline gap-4">
      <span
        className="num text-[86px] font-normal leading-none tracking-tight text-snow sm:text-[116px]"
        style={{ textShadow: "0 0 60px rgba(0,255,104,0.3)" }}
      >
        {days}
      </span>
      <span className="font-display text-[22px] font-light uppercase tracking-[0.3em] text-brand2 sm:text-[26px]">dias</span>
    </div>
  );
}

export default function Inicio() {
  const { state, stats, setTab } = useStore();
  const s = stats;
  const cfg = state.settings;
  const examDate = parseISO(cfg.examDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const phase = PHASES[s.phaseIndex];

  return (
    <div className="space-y-6">
      {/* ===== quadro principal: contagem regressiva ===== */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card className="anim-rise relative overflow-hidden p-6 sm:p-8" delay={0}>
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: phase.color }}
          />
          <div className="relative border-y border-[rgba(0,255,104,0.22)] py-5 text-center">
            <div className="mb-2.5 flex justify-center">
              <Brand imageOnly size={72} />
            </div>
            <div className="kicker mb-2">[ painel de preparação ]</div>
            <div
              className="font-display text-[34px] tracking-[0.12em] text-snow sm:text-[46px]"
              style={{ textShadow: "0 0 44px rgba(0,255,104,0.35)" }}
            >
              APROVAÇÃO <span className="text-brand2">90</span>
            </div>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-28 w-2/3 -translate-x-1/2 -translate-y-1/2"
              style={{ background: "radial-gradient(circle, rgba(0,255,104,0.13), transparent 65%)" }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              ["Concurso", cfg.concurso],
              ["Cargo", cfg.cargo],
              ["Banca", cfg.banca],
              ["Prova", parseISO(cfg.examDate).toLocaleDateString("pt-BR")],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="kicker">{k}</div>
                <div className="mt-1 text-[15px] font-semibold text-snow">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="kicker mb-2 flex items-center gap-2">
                <IcCalendar size={14} /> Dias restantes para a prova
              </div>
              <BigCountdown />
              <div className="mt-2 text-[13px] capitalize text-fog">{examDate}</div>
            </div>
            <div className="max-w-[240px]">
              <div className="flex items-center gap-2">
                <Dot color={phase.color} pulse size={10} />
                <span className="font-display text-[18px] font-semibold" style={{ color: phase.color }}>
                  Fase: {phase.label}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fog">{phase.desc}</p>
            </div>
          </div>

          {/* linha das fases */}
          <div className="mt-8">
            <div className="relative flex">
              <div className="absolute left-0 right-0 top-[7px] h-[2px] bg-raise" />
              <div
                className="bar-grow absolute left-0 top-[7px] h-[2px]"
                style={{
                  width: `${(s.phaseIndex / 3) * 100}%`,
                  background: "linear-gradient(90deg, #00ff68, " + phase.color + ")",
                }}
              />
              {PHASES.map((p, i) => (
                <div key={p.key} className="relative flex-1 text-center">
                  <span
                    className="relative z-10 mx-auto block h-4 w-4 rounded-full border-2"
                    style={{
                      background: i <= s.phaseIndex ? p.color : "var(--color-panel)",
                      borderColor: i <= s.phaseIndex ? p.color : "var(--color-line2)",
                      boxShadow: i === s.phaseIndex ? `0 0 12px ${p.color}` : "none",
                    }}
                  />
                  <span
                    className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: i === s.phaseIndex ? p.color : "var(--color-mist)" }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== central de ação ===== */}
        <Card className="anim-rise flex flex-col p-6" delay={120}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IcBolt size={16} className="text-brand2" />
              <span className="font-display text-[17px] font-semibold text-snow">Central de ação</span>
            </div>
            <Chip color="#00ff68">HOJE</Chip>
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {s.focus.length === 0 && (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[rgba(0,255,104,0.15)] px-4 py-8 text-center text-[13px] text-mist">
                Tudo em dia — o foco de amanhã é calculado à meia-noite.
              </div>
            )}
            {s.focus.map((f, i) => (
              <button
                key={f.key}
                onClick={() => setTab("dashboard")}
                className="anim-rise group block w-full rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.35)] hover:shadow-[0_0_24px_rgba(0,255,90,0.1)]"
                style={{ animationDelay: `${200 + i * 90}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="num text-[11px] font-bold text-brand2">0{i + 1}</span>
                  <span className="h-2 w-2 rounded-[3px]" style={{ background: f.subject.color }} />
                  <span className="font-display text-[15px] font-semibold text-snow">{f.subject.name}</span>
                </div>
                <div className="mt-1 text-[13px] text-fog">{f.topic.name}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="num text-[11px] text-mist">{f.minutes} min · {f.reason}</span>
                  <span className="text-mist transition-transform group-hover:translate-x-1"><IcArrow size={14} /></span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-4 py-3">
            <IcFlame size={18} className="flame-anim text-amber" />
            <div>
              <span className="num text-[15px] font-bold text-amber">{s.streak} dias</span>
              <span className="text-[12px] text-fog"> de constância · recorde {s.bestStreak}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== mapa dos módulos ===== */}
      <Card className="anim-rise p-6" delay={200}>
        <div className="flex items-center justify-between">
          <div className="font-display text-[17px] font-semibold text-snow">Os 8 módulos da preparação</div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-y-3">
          {MODULES.map((m, i) => (
            <div key={m.tab} className="flex items-center">
              <button
                onClick={() => setTab(m.tab)}
                className="group flex items-center gap-2.5 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-3.5 py-2.5 transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.4)] hover:bg-[rgba(0,255,104,0.05)]"
              >
                <span className="num text-[11px] font-bold text-brand2">{m.n}</span>
                <span className="text-mist transition-colors group-hover:text-brand2">{m.icon({ size: 15 })}</span>
                <span className="text-[13px] font-semibold text-snow">{m.label}</span>
              </button>
              {i < MODULES.length - 1 && <span className="mx-1.5 text-[rgba(0,255,104,0.25)]"><IcArrow size={14} /></span>}
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-[rgba(0,255,104,0.1)] pt-5">
          <div className="kicker mb-3 !text-[#c9a2ff]">✦ Inteligência A90 — camadas novas do sistema</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => setTab("materiais")}
              className="group rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#c9a2ff]/50"
            >
              <div className="flex items-center gap-2.5">
                <IcPlay size={16} className="text-[#c9a2ff]" />
                <span className="num text-[11px] font-bold text-[#c9a2ff]">09</span>
                <span className="font-display text-[15px] font-semibold text-snow">Materiais</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                Videoaulas gratuitas (PT · RLM · INFO · DC · DA), sessão cronometrada e bancos de questões grátis.
              </p>
            </button>
            <button
              onClick={() => setTab("ia")}
              className="group rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#c9a2ff]/50"
            >
              <div className="flex items-center gap-2.5">
                <IcSpark size={16} className="text-[#c9a2ff]" />
                <span className="num text-[11px] font-bold text-[#c9a2ff]">10</span>
                <span className="font-display text-[15px] font-semibold text-snow">IA A90</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                Flashcards, questões C/E e resumos calibrados pelo que mais cai — {state.aiResults.length} sessões feitas.
              </p>
            </button>
            <button
              onClick={() => setTab("simulados")}
              className="group rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#c9a2ff]/50"
            >
              <div className="flex items-center gap-2.5">
                <IcCards size={16} className="text-[#c9a2ff]" />
                <span className="num text-[11px] font-bold text-[#c9a2ff]">11</span>
                <span className="font-display text-[15px] font-semibold text-snow">Simulados</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-mist">
                Gerador baseado em provas anteriores ({state.pastExams.length} no banco) · {state.mocks.length} simulados montados.
              </p>
            </button>
          </div>
        </div>
      </Card>

      {/* ===== regra do jogo + números rápidos ===== */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="anim-rise flex flex-col justify-between p-6" delay={260}>
          <div>
            <div className="kicker mb-3">A regra do jogo</div>
            <p className="font-display text-[24px] font-semibold leading-snug text-snow">
              Você preenche os dados.
              <br />
              <span className="text-brand2">O sistema faz os cálculos.</span>
            </p>
          </div>
          <div className="mt-6 space-y-2 text-[13px] text-fog">
            {[
              "Onde estou? O painel responde em 10 segundos.",
              "O que está ruim? Alertas automáticos por disciplina.",
              "O que fazer agora? Foco de hoje priorizado.",
              "Estou evoluindo? Gráficos semanais de questões e acertos.",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand2" style={{ boxShadow: "0 0 8px #00ff68" }} />
                {t}
              </div>
            ))}
          </div>
        </Card>

        <Card className="anim-rise p-6" delay={320}>
          <div className="kicker mb-4">Seu ciclo até agora</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "Edital coberto", v: `${s.editalPct}%`, icon: <IcList size={16} />, c: "#5cb3ff" },
              { k: "Horas de estudo", v: fmtMin(s.hoursTotalMin), icon: <IcBook size={16} />, c: "#00ff68" },
              { k: "Questões feitas", v: s.questionsTotal.toLocaleString("pt-BR"), icon: <IcTarget size={16} />, c: "#f5b84b" },
              { k: "Aproveitamento", v: fmtPct(s.accTotal), icon: <IcChart size={16} />, c: s.accTotal >= 80 ? "#00ff68" : "#f5b84b" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] p-4 transition-colors hover:border-[rgba(0,255,104,0.35)]">
                <div style={{ color: x.c }}>{x.icon}</div>
                <div className="num mt-2.5 text-[22px] font-semibold text-snow">{x.v}</div>
                <div className="mt-0.5 text-[11px] text-mist">{x.k}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-[11.5px] text-mist">
              <span>Progresso do edital</span>
              <span className="num text-brand2">{s.editalPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-raise">
              <div
                className="bar-grow h-full rounded-full"
                style={{
                  width: `${s.editalPct}%`,
                  background: "linear-gradient(90deg, #006b2c, #00ff68)",
                  boxShadow: "0 0 16px rgba(0,255,104,0.35)",
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
