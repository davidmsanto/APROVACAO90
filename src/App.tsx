import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { StoreProvider, useStore, type TabId } from "./lib/store";
import { PHASES } from "./lib/types";
import { Brand } from "./components/Brand";
import { Dot } from "./components/ui";
import AuthScreen from "./components/AuthScreen";
import Paywall from "./components/Paywall";
import {
  dataKeyFor,
  fmtCountdown,
  getSessionUser,
  logout,
  TRIAL_MS,
  usePlanClock,
  type PlanStatus,
  type UserRecord,
} from "./lib/auth";
import {
  IcBolt,
  IcCalendar,
  IcCards,
  IcCrown,
  IcFlag,
  IcGear,
  IcGrid,
  IcList,
  IcLogOut,
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

/* ============ selo do modo teste / PRO ============ */

function trialColor(ms: number) {
  return ms > 6 * 3600_000 ? "#00ff68" : ms > 3600_000 ? "#f5b84b" : "#f0655f";
}

function TrialBadge({ status, onUpgrade }: { status: PlanStatus; onUpgrade: () => void }) {
  if (status.kind === "pro") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand2 shadow-[0_0_16px_rgba(0,255,90,0.15)]">
        <IcCrown size={12} /> PRO
      </span>
    );
  }
  const ms = status.kind === "trial" ? status.msLeft : 0;
  const color = trialColor(ms);
  const consumed = Math.min(100, ((TRIAL_MS - ms) / TRIAL_MS) * 100);
  return (
    <div className="group relative">
      <button
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] transition-all hover:-translate-y-0.5"
        style={{ borderColor: `${color}55`, background: `${color}12` }}
      >
        <span className="pulse-g h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="kicker !text-[8.5px]" style={{ color }}>teste</span>
        <span className="num font-semibold" style={{ color }}>{fmtCountdown(ms)}</span>
      </button>
      <div className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-[290px] translate-y-1 rounded-xl border border-[rgba(0,255,104,0.25)] bg-[#061a0f] p-4 opacity-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur transition-all duration-200 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center justify-between">
          <span className="kicker">[ modo teste · 24h ]</span>
          <span className="num text-[11px]" style={{ color }}>{fmtCountdown(ms)}</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-raise">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${consumed}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-mist">
          <span className="num">{Math.round(consumed)}% usado</span>
          <span>depois: painel trava</span>
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-fog">
          Acesso total sem assinatura. Quando o relógio zerar, só o plano mensal reabre o painel.
        </p>
        <button onClick={onUpgrade} className="btn mt-3 w-full !py-2 !text-[9.5px]">
          <IcCrown size={12} /> Assinar PRO — R$ 29,90/mês
        </button>
      </div>
    </div>
  );
}

function AccountBlock({ user, status, onLogout }: { user: UserRecord; status: PlanStatus; onLogout: () => void }) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#061a0f] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(0,255,104,0.3)] bg-[rgba(0,255,104,0.08)] font-display text-[15px] font-semibold text-brand2">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold text-snow">{user.name}</div>
        <div className="truncate text-[9.5px] text-mist">
          {status.kind === "pro" ? "plano PRO ativo" : user.email}
        </div>
      </div>
      <button
        onClick={onLogout}
        title="Sair da conta"
        className="rounded-full border border-transparent p-1.5 text-mist transition-all hover:border-[rgba(240,101,95,0.4)] hover:bg-[rgba(240,101,95,0.08)] hover:text-[#f0655f]"
      >
        <IcLogOut size={14} />
      </button>
    </div>
  );
}

function Sidebar({ user, status, onLogout }: { user: UserRecord; status: PlanStatus; onLogout: () => void }) {
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
        <AccountBlock user={user} status={status} onLogout={onLogout} />
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

function MobileNav({ status, onUpgrade }: { status: PlanStatus; onUpgrade: () => void }) {
  const { tab, setTab, stats } = useStore();
  const ms = status.kind === "trial" ? status.msLeft : 0;
  const color = trialColor(ms);
  return (
    <div className="sticky top-0 z-30 border-b border-[rgba(0,255,104,0.1)] bg-[#020b06]/90 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Brand size={36} />
        <div className="flex items-center gap-2">
          {status.kind === "pro" ? (
            <span className="flex items-center gap-1 rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-2.5 py-1 text-[11px] font-bold text-brand2">
              <IcCrown size={11} /> PRO
            </span>
          ) : (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-transform active:scale-95"
              style={{ borderColor: `${color}55`, background: `${color}12`, color }}
              title="Modo teste — toque para assinar"
            >
              <span className="pulse-g h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="num font-semibold">{fmtCountdown(ms)}</span>
            </button>
          )}
          <div className="num rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-2.5 py-1 text-[13px] font-semibold text-brand2">
            D-{stats.daysLeft}
          </div>
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

function TopBar({ status, onUpgrade }: { status: PlanStatus; onUpgrade: () => void }) {
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
      <span className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-3 py-1.5 text-[11.5px]">
        <Dot color={stats.indexBand.color} size={7} />
        <span className="kicker !text-[9px]">ÍNDICE</span>
        <span className="num font-semibold" style={{ color: stats.indexBand.color }}>{stats.indexScore}/100</span>
      </span>
      <div className="ml-auto">
        <TrialBadge status={status} onUpgrade={onUpgrade} />
      </div>
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

function Shell({
  user,
  status,
  onLogout,
  onUpgrade,
}: {
  user: UserRecord;
  status: PlanStatus;
  onLogout: () => void;
  onUpgrade: () => void;
}) {
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
      <Sidebar user={user} status={status} onLogout={onLogout} />
      <MobileNav status={status} onUpgrade={onUpgrade} />
      <main className="relative z-10 lg:pl-[228px]">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:py-8">
          <div className="hidden lg:block"><TopBar status={status} onUpgrade={onUpgrade} /></div>
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

/* ============ raiz com portão de autenticação ============ */

function BgLayers() {
  return (
    <>
      <div className="bg-scene" />
      <div className="bg-grid" />
      <div className="bg-noise" />
      <div className="glow-drift glow-a" />
      <div className="glow-drift glow-b" />
    </>
  );
}

function AuthedApp({ user, onUserChange }: { user: UserRecord; onUserChange: (u: UserRecord | null) => void }) {
  const status = usePlanClock(user);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleUpgraded = (u: UserRecord) => {
    setUpgradeOpen(false);
    onUserChange(u);
  };

  /* teste expirou → paywall obrigatório (o relógio vivo detecta sozinho) */
  if (status.kind === "expired") {
    return (
      <div className="relative min-h-full">
        <BgLayers />
        <Paywall user={user} status={status} onUpgraded={handleUpgraded} />
      </div>
    );
  }

  return (
    /* key={user.id}: cada conta tem seu próprio banco local */
    <StoreProvider key={user.id} storageKey={dataKeyFor(user.id)}>
      <div className="relative min-h-full">
        <BgLayers />
        <Shell
          user={user}
          status={status}
          onLogout={() => {
            logout();
            onUserChange(null);
          }}
          onUpgrade={() => setUpgradeOpen(true)}
        />
        {upgradeOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#020b06]/80 backdrop-blur-sm">
            <div className="anim-fade min-h-full">
              <Paywall
                user={user}
                status={status}
                onUpgraded={handleUpgraded}
                backLabel="Voltar ao painel"
                onBack={() => setUpgradeOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </StoreProvider>
  );
}

export default function App() {
  const [user, setUser] = useState<UserRecord | null>(() => getSessionUser());

  if (!user) {
    return (
      <div className="relative min-h-full">
        <BgLayers />
        <AuthScreen onAuthed={setUser} />
      </div>
    );
  }

  return <AuthedApp key={user.id} user={user} onUserChange={setUser} />;
}
