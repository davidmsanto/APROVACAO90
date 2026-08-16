import { useEffect, type ComponentType, type SVGProps } from "react";
import { StoreProvider, useStore, type TabId } from "./lib/store";
import { PHASES } from "./lib/types";
import { Brand } from "./components/Brand";
import { Dot } from "./components/ui";
import {
  IcBolt,
  IcCalendar,
  IcCards,
  IcFlag,
  IcGear,
  IcGrid,
  IcList,
  IcPlay,
  IcRefresh,
  IcSpark,
  IcTarget,
} from "./components/icons";
import Inicio from "./tabs/Inicio";
import Dashboard from "./tabs/Dashboard";
import Edital from "./tabs/Edital";
import Planejador from "./tabs/Planejador";
import Questoes from "./tabs/Questoes";
import Revisoes from "./tabs/Revisoes";
import Metas from "./tabs/Metas";
import Configuracoes from "./tabs/Configuracoes";
import Materiais from "./tabs/Materiais";
import Ia from "./tabs/Ia";
import Simulados from "./tabs/Simulados";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
type NavItem = { id: TabId; n: string; label: string; icon: Icon };

const NAV_PREP: NavItem[] = [
  { id: "inicio", n: "01", label: "Início", icon: IcBolt },
  { id: "dashboard", n: "02", label: "Dashboard", icon: IcGrid },
  { id: "edital", n: "03", label: "Edital", icon: IcList },
  { id: "planejador", n: "04", label: "Planejador", icon: IcCalendar },
  { id: "questoes", n: "05", label: "Questões", icon: IcTarget },
  { id: "revisoes", n: "06", label: "Revisões", icon: IcRefresh },
  { id: "metas", n: "07", label: "Metas", icon: IcFlag },
  { id: "config", n: "08", label: "Configurações", icon: IcGear },
];
const NAV_INTEL: NavItem[] = [
  { id: "materiais", n: "09", label: "Materiais", icon: IcPlay },
  { id: "ia", n: "10", label: "IA A90", icon: IcSpark },
  { id: "simulados", n: "11", label: "Simulados", icon: IcCards },
];

function Sidebar() {
  const { tab, setTab, stats, state } = useStore();
  const phase = PHASES[stats.phaseIndex];
  const reviewBadge = stats.dueToday + stats.overdue;

  const item = (it: NavItem, intel: boolean) => {
    const active = tab === it.id;
    const on = intel ? "#c9a2ff" : "#00ff68";
    return (
      <button
        key={it.id}
        onClick={() => setTab(it.id)}
        className="group relative mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150"
        style={{ background: active ? `linear-gradient(90deg, ${intel ? "rgba(201,162,255,0.10)" : "rgba(0,255,104,0.10)"}, transparent)` : "transparent" }}
      >
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200"
          style={{ background: on, opacity: active ? 1 : 0, transform: `translateY(-50%) scaleY(${active ? 1 : 0.3})`, boxShadow: active ? `0 0 10px ${on}` : "none" }}
        />
        <span className="num text-[10.5px] font-semibold" style={{ color: active ? on : "#66716b" }}>{it.n}</span>
        <it.icon size={16} style={{ color: active ? on : "#66716b" }} className="transition-colors" />
        <span className={`text-[13.5px] font-semibold ${active ? "text-snow" : "text-fog group-hover:text-snow"}`}>{it.label}</span>
        {it.id === "revisoes" && reviewBadge > 0 && (
          <span className="num ml-auto rounded-full bg-info/15 px-1.5 py-0.5 text-[10px] font-semibold text-info">{reviewBadge}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] flex-col border-r border-[rgba(0,255,104,0.1)] bg-[#04140a]/80 backdrop-blur-sm lg:flex">
      <div className="border-b border-[rgba(0,255,104,0.1)] px-5 py-5">
        <Brand />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="kicker mb-2.5 px-2">Preparação</div>
        {NAV_PREP.map((it) => item(it, false))}
        <div className="kicker mb-2.5 mt-5 px-2 !text-[#c9a2ff]">✦ Inteligência</div>
        {NAV_INTEL.map((it) => item(it, true))}
      </nav>
      <div className="border-t border-[rgba(0,255,104,0.1)] p-4">
        <div className="rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#061a0f] p-3.5">
          <div className="flex items-center gap-2">
            <Dot color={phase.color} pulse size={8} />
            <span className="text-[11px] font-semibold" style={{ color: phase.color }}>FASE: {phase.label.toUpperCase()}</span>
          </div>
          <div className="num mt-1.5 text-[22px] font-semibold leading-none text-snow" style={{ textShadow: "0 0 20px rgba(0,255,104,0.25)" }}>
            D-{stats.daysLeft}
          </div>
          <div className="mt-1 text-[10.5px] text-mist">{state.settings.concurso} · {state.settings.cargo}</div>
        </div>
        <div className="mt-3 text-center text-[10px] text-mist">MVP 1.0 · dados locais · PWA em breve</div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const { tab, setTab, stats } = useStore();
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(0,255,104,0.1)] bg-[#020b06]/90 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Brand size={36} />
        <div className="num rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-2.5 py-1 text-[13px] font-semibold text-brand2">
          D-{stats.daysLeft}
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto px-3 pb-2.5">
        {[...NAV_PREP, ...NAV_INTEL].map((it) => {
          const active = tab === it.id;
          const intel = it.n >= "09";
          const on = intel ? "#c9a2ff" : "#00ff68";
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all"
              style={{
                borderColor: active ? `${on}66` : "rgba(0,255,104,0.12)",
                color: active ? on : "var(--color-fog)",
                background: active ? `${on}12` : "transparent",
              }}
            >
              <it.icon size={13} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopBar() {
  const { state, stats } = useStore();
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2.5">
      {[
        ["CONCURSO", state.settings.concurso],
        ["CARGO", state.settings.cargo],
        ["BANCA", state.settings.banca],
      ].map(([k, v]) => (
        <span key={k} className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-3 py-1.5 text-[11.5px]">
          <span className="kicker !text-[9px]">{k}</span>
          <span className="font-semibold text-snow">{v}</span>
        </span>
      ))}
      <span className="ml-auto flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-3 py-1.5 text-[11.5px]">
        <Dot color={stats.indexBand.color} size={7} />
        <span className="kicker !text-[9px]">ÍNDICE</span>
        <span className="num font-semibold" style={{ color: stats.indexBand.color }}>{stats.indexScore}/100</span>
      </span>
    </div>
  );
}

function Toasts() {
  const { toasts } = useStore();
  const toneStyle = {
    green: { border: "rgba(0,255,104,0.35)", color: "#00ff68" },
    amber: { border: "rgba(245,184,75,0.35)", color: "#f5b84b" },
    red: { border: "rgba(240,101,95,0.35)", color: "#f0655f" },
    blue: { border: "rgba(92,179,255,0.35)", color: "#5cb3ff" },
  } as const;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(360px,90vw)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-rise rounded-xl border bg-[#061a0f]/95 px-4 py-3 text-[12.5px] font-semibold text-snow shadow-[0_18px_44px_-12px_rgba(0,0,0,0.9)] backdrop-blur"
          style={{ borderColor: toneStyle[t.tone].border, borderLeft: `3px solid ${toneStyle[t.tone].color}` }}
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: toneStyle[t.tone].color, boxShadow: `0 0 8px ${toneStyle[t.tone].color}` }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Shell() {
  const { tab } = useStore();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);
  const views: Record<TabId, ComponentType> = {
    inicio: Inicio,
    dashboard: Dashboard,
    edital: Edital,
    planejador: Planejador,
    questoes: Questoes,
    revisoes: Revisoes,
    metas: Metas,
    config: Configuracoes,
    materiais: Materiais,
    ia: Ia,
    simulados: Simulados,
  };
  const View = views[tab];
  return (
    <div className="relative min-h-full">
      <div className="bg-scene" />
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="glow-drift glow-a" />
      <div className="glow-drift glow-b" />
      <Sidebar />
      <MobileNav />
      <main className="relative z-10 lg:pl-[228px]">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:py-8">
          <div className="hidden lg:block"><TopBar /></div>
          <div key={tab} className="anim-fade"><View /></div>
          <footer className="mt-12 border-t border-[rgba(0,255,104,0.1)] pt-5 pb-2 text-center text-[11px] text-mist">
            APROVAÇÃO 90 · o usuário preenche os dados, o sistema faz os cálculos.
          </footer>
        </div>
      </main>
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
