import { useState } from "react";
import { fmtCountdown, logout, readTrialProgress, TRIAL_MS, upgradeToPro, type PlanStatus, type UserRecord } from "../lib/auth";
import { fmtMin } from "../lib/calc";
import { Brand } from "./Brand";
import { IcArrow, IcCardIcon, IcCheck, IcCrown, IcLock, IcLogOut } from "./icons";

const PLAN_FEATURES = [
  "Todos os 11 módulos, sem limite de tempo",
  "Índice APROVAÇÃO 90, radar e alertas inteligentes",
  "IA A90 ilimitada — flashcards, questões C/E e resumos",
  "Simulados ilimitados baseados em provas anteriores",
  "Revisões 24h/7d/30d e planejador semanal",
  "Suporte prioritário e atualizações do produto",
];

export default function Paywall({
  user,
  status,
  onUpgraded,
  backLabel,
  onBack,
}: {
  user: UserRecord;
  status: PlanStatus;
  onUpgraded: (u: UserRecord) => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  const [checkout, setCheckout] = useState<"idle" | "processing" | "done">("idle");
  const [justLoggedOut, setJustLoggedOut] = useState(false);
  const progress = readTrialProgress(user.id);
  const msLeft = status.kind === "trial" ? status.msLeft : 0;
  const consumed = Math.min(100, Math.round(((TRIAL_MS - msLeft) / TRIAL_MS) * 100));

  const subscribe = () => {
    if (checkout !== "idle") return;
    setCheckout("processing");
    setTimeout(() => {
      setCheckout("done");
      setTimeout(() => onUpgraded(upgradeToPro(user)), 1100);
    }, 1900);
  };

  const doLogout = () => {
    setJustLoggedOut(true);
    logout();
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
      {/* ===== estado da conta ===== */}
      <div className="relative flex flex-col justify-between overflow-hidden border-r border-[rgba(0,255,104,0.1)] p-10 lg:p-14">
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle at 55% 40%, rgba(240,101,95,0.45), transparent 62%)" }}
        />
        <Brand />

        <div className="relative max-w-[480px]">
          <div className="kicker mb-4 !text-[#f0655f]">[ modo teste encerrado ]</div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(240,101,95,0.4)] bg-[rgba(240,101,95,0.08)]">
              <IcLock size={24} className="text-[#f0655f]" />
            </div>
            <div className="num text-[56px] font-medium leading-none tracking-tight text-[#66716b] line-through decoration-[#f0655f]/70 decoration-4">
              {fmtCountdown(msLeft)}
            </div>
          </div>
          <h1 className="mt-6 font-display text-[34px] font-light leading-[1.05] text-snow lg:text-[42px]">
            {backLabel ? "Seu relógio está correndo." : "Suas 24 horas terminaram."}
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-[#a5b0aa]">
            {backLabel
              ? `Restam ${fmtCountdown(msLeft)} de acesso total. Depois disso o painel trava — a não ser que você vire PRO.`
              : "O painel foi bloqueado, mas nada foi perdido: seu edital, questões, revisões e o Índice continuam salvos na sua conta."}
          </p>

          {/* o que o usuário construiu no teste */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { k: "dias estudados", v: String(progress.days) },
              { k: "questões feitas", v: progress.questions.toLocaleString("pt-BR") },
              { k: "horas de estudo", v: fmtMin(progress.minutes) },
            ].map((x, i) => (
              <div key={x.k} className="anim-rise card p-4 text-center" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="num text-[24px] font-semibold text-brand2">{x.v}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#66716b]">{x.k}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-[#66716b]">
            É isso que o sistema construiu com você em um dia. Imagine em {status.kind === "trial" ? "30" : "90"}.
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            onClick={doLogout}
            className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.2)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a5b0aa] transition-all hover:border-[rgba(240,101,95,0.5)] hover:text-[#f0655f]"
          >
            <IcLogOut size={14} /> {justLoggedOut ? "Saindo…" : "Sair da conta"}
          </button>
          {backLabel && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.35)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand2 transition-all hover:bg-[rgba(0,255,104,0.08)]"
            >
              <IcArrow size={13} style={{ transform: "rotate(180deg)" }} /> {backLabel}
            </button>
          )}
        </div>
      </div>

      {/* ===== plano mensal ===== */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="anim-rise w-full max-w-[440px]" style={{ animationDelay: "120ms" }}>
          <div
            className="card relative overflow-hidden p-8"
            style={{
              borderColor: "rgba(0,255,104,0.35)",
              boxShadow: "0 0 40px rgba(0,255,90,0.12), inset 0 0 40px rgba(0,255,90,0.04)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(0,255,104,0.35), transparent 65%)" }}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="kicker !text-brand2">[ plano mensal ]</div>
                <span className="flex items-center gap-1.5 rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-brand2">
                  <IcCrown size={12} /> PRO
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="num text-[46px] font-semibold leading-none text-snow">R$ 29,90</span>
                <span className="text-[13px] text-[#66716b]">/mês</span>
              </div>
              <p className="mt-1.5 text-[12px] text-[#a5b0aa]">Menos que uma questão de prova comentada por dia. Cancele quando quiser.</p>

              <ul className="mt-6 space-y-2.5">
                {PLAN_FEATURES.map((f, i) => (
                  <li key={f} className="anim-rise flex items-start gap-2.5 text-[12.5px] leading-snug text-[#a5b0aa]" style={{ animationDelay: `${200 + i * 70}ms` }}>
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(0,255,104,0.15)]">
                      <IcCheck size={9} className="text-brand2" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={subscribe}
                disabled={checkout !== "idle"}
                className="btn mt-7 w-full !py-3.5"
                style={checkout === "done" ? { background: "linear-gradient(135deg, #00b947, #00e85d)" } : undefined}
              >
                {checkout === "idle" && (
                  <>
                    <IcCardIcon size={15} /> Assinar agora — acesso imediato
                  </>
                )}
                {checkout === "processing" && (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#001b09]/30 border-t-[#001b09]" />
                    Processando pagamento seguro…
                  </>
                )}
                {checkout === "done" && (
                  <>
                    <IcCheck size={15} /> Assinatura confirmada — bem-vindo ao PRO
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[#66716b]">
                <span className="flex items-center gap-1.5"><IcLock size={11} /> pagamento simulado no MVP</span>
                <span>·</span>
                <span>sem fidelidade</span>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-[#66716b]">
            {user.name.split(" ")[0]}, sua conta <b className="text-[#a5b0aa]">{user.email}</b> mantém todo o progresso
            {backLabel ? " e volta ao normal se você continuar no teste." : " — ele reabre no segundo em que a assinatura for ativa."}
          </p>
        </div>
      </div>
    </div>
  );
}
