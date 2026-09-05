import { useEffect, useState, type FormEvent } from "react";
import {
  enterDemo,
  fmtCountdown,
  login,
  signup,
  TRIAL_MS,
  type UserRecord,
} from "../lib/auth";
import { Brand } from "./Brand";
import { IcArrow, IcBolt, IcCheck, IcClock, IcLock, IcUser } from "./icons";

/* contagem viva do painel esquerdo (mostra o relógio do modo teste) */
function DemoClock() {
  const [left, setLeft] = useState(TRIAL_MS);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1000 : TRIAL_MS)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="num text-[64px] font-medium leading-none tracking-tight text-snow xl:text-[84px]" style={{ textShadow: "0 0 60px rgba(0,255,104,0.35)" }}>
      {fmtCountdown(left)}
    </div>
  );
}

const PHASES_MINI = [
  { label: "Construção", desc: "Teoria + questões", color: "#00ff68", active: true },
  { label: "Consolidação", desc: "Questões + revisões", color: "#f5b84b", active: false },
  { label: "Aperfeiçoamento", desc: "Simulados + pontos fracos", color: "#f0904b", active: false },
  { label: "Reta final", desc: "Revisão total", color: "#f0655f", active: false },
];

const PERKS = [
  "Todos os 11 módulos liberados",
  "Índice APROVAÇÃO 90 e alertas inteligentes",
  "IA de flashcards, questões C/E e resumos",
  "Gerador de simulados por provas anteriores",
];

export default function AuthScreen({ onAuthed }: { onAuthed: (u: UserRecord) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = mode === "signup" ? await signup(name, email, pw) : await login(email, pw);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onAuthed(res.user);
  };

  const demo = async () => {
    setDemoBusy(true);
    const u = await enterDemo();
    setDemoBusy(false);
    onAuthed(u);
  };

  const field =
    "w-full rounded-[10px] border border-[rgba(0,255,104,0.14)] bg-[#04140a]/80 py-2.5 pl-10 pr-3.5 text-[13.5px] text-snow outline-none transition-all placeholder:text-[#66716b] focus:border-[rgba(0,255,104,0.5)] focus:shadow-[0_0_18px_rgba(0,255,90,0.12)]";

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* ===== painel da marca: o relógio do modo teste é a abertura ===== */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[rgba(0,255,104,0.1)] p-12 lg:flex xl:p-16">
        <div
          className="pointer-events-none absolute -left-32 top-1/3 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle at 40% 35%, rgba(0,255,104,0.5), transparent 65%)" }}
        />
        <Brand />

        <div className="relative max-w-[520px]">
          <div className="kicker mb-4 flex items-center gap-2 !text-[10px]">
            <span className="pulse-g inline-block h-2 w-2 rounded-full bg-brand2" />
            [ modo teste ativo · sem cartão · sem assinatura ]
          </div>
          <h1 className="font-display text-[40px] font-light leading-[1.02] text-snow xl:text-[52px]">
            Você tem <span className="text-brand2">24 horas</span>
            <br />
            para provar que o sistema funciona.
          </h1>
          <div className="mt-8">
            <DemoClock />
            <div className="num mt-2 text-[11px] tracking-[0.3em] text-[#66716b] uppercase">horas : minutos : segundos de acesso total</div>
          </div>

          <ul className="mt-9 grid gap-2.5 sm:grid-cols-2">
            {PERKS.map((p, i) => (
              <li key={p} className="anim-rise flex items-start gap-2.5 text-[12.5px] leading-snug text-[#a5b0aa]" style={{ animationDelay: `${200 + i * 90}ms` }}>
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[rgba(0,255,104,0.4)] bg-[rgba(0,255,104,0.1)]">
                  <IcCheck size={9} className="text-brand2" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* fases — a linha do tempo do produto */}
        <div className="relative mt-10 flex items-center gap-0">
          {PHASES_MINI.map((ph, i) => (
            <div key={ph.label} className="flex items-center" style={{ flex: i < PHASES_MINI.length - 1 ? 1 : "none" }}>
              <div className="anim-rise flex items-center gap-2.5" style={{ animationDelay: `${300 + i * 120}ms` }}>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${ph.active ? "pulse-g" : ""}`}
                  style={{ background: ph.active ? ph.color : "#22352c", boxShadow: ph.active ? `0 0 12px ${ph.color}` : "none" }}
                />
                <span>
                  <span className={`block text-[11.5px] font-semibold ${ph.active ? "text-snow" : "text-[#66716b]"}`}>{ph.label}</span>
                  <span className="block text-[9.5px] text-[#66716b]">{ph.desc}</span>
                </span>
              </div>
              {i < PHASES_MINI.length - 1 && <div className="mx-3 h-px flex-1 bg-[rgba(0,255,104,0.12)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* ===== formulário ===== */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="anim-rise w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="card p-7 sm:p-8">
            <div className="kicker mb-1.5">[ acesso ]</div>
            <h2 className="font-display text-[26px] font-light text-snow">
              {mode === "signup" ? "Comece seu modo teste" : "Bem-vindo de volta"}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#a5b0aa]">
              {mode === "signup"
                ? "Crie a conta e o relógio de 24h começa a rodar na hora — acesso completo, sem cartão."
                : "Entre para continuar sua preparação de onde parou."}
            </p>

            {/* abas */}
            <div className="mt-5 flex rounded-full border border-[rgba(0,255,104,0.15)] bg-[#04140a] p-1">
              {(["signup", "login"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className="flex-1 rounded-full py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200"
                  style={{
                    background: mode === m ? "linear-gradient(135deg, #00b947, #00e85d)" : "transparent",
                    color: mode === m ? "#001b09" : "#66716b",
                    boxShadow: mode === m ? "0 0 18px rgba(0,255,90,0.3)" : "none",
                  }}
                >
                  {m === "signup" ? "Criar conta" : "Entrar"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3.5">
              {mode === "signup" && (
                <div className="anim-fade relative">
                  <IcUser size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66716b]" />
                  <input className={field} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
              )}
              <div className="relative">
                <IcBolt size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66716b]" />
                <input className={field} placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="relative">
                <IcLock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66716b]" />
                <input className={field} placeholder="Senha (mín. 6 caracteres)" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </div>

              {error && (
                <div className="anim-rise rounded-[10px] border border-[rgba(240,101,95,0.4)] bg-[rgba(240,101,95,0.08)] px-3.5 py-2.5 text-[12px] font-medium text-[#f0655f]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn w-full disabled:opacity-50"
              >
                {busy ? "Verificando…" : mode === "signup" ? "Ativar 24h grátis" : "Entrar no painel"}
                {!busy && <IcArrow size={13} />}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[rgba(0,255,104,0.12)]" />
              <span className="kicker !text-[8.5px]">ou</span>
              <span className="h-px flex-1 bg-[rgba(0,255,104,0.12)]" />
            </div>

            <button
              onClick={demo}
              disabled={demoBusy}
              className="group flex w-full items-center justify-between rounded-[10px] border border-[rgba(0,255,104,0.25)] bg-[rgba(0,255,104,0.05)] px-4 py-3 text-left transition-all hover:border-[rgba(0,255,104,0.5)] hover:bg-[rgba(0,255,104,0.1)] disabled:opacity-50"
            >
              <span>
                <span className="block text-[13px] font-semibold text-brand2">{demoBusy ? "Preparando demo…" : "Explorar com a conta demo"}</span>
                <span className="block text-[11px] text-[#a5b0aa]">Sem cadastro — modo teste renovado na hora.</span>
              </span>
              <IcArrow size={16} className="shrink-0 text-brand2 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="mt-5 flex items-start gap-2 text-[10.5px] leading-relaxed text-[#66716b]">
              <IcClock size={12} className="mt-0.5 shrink-0 text-brand2" />
              Quando as 24h terminarem, o painel trava e você escolhe: assinar o plano mensal ou sair. Seus dados ficam guardados.
            </p>
          </div>

          <p className="mt-5 text-center text-[10px] text-[#66716b]">
            APROVAÇÃO 90 · MVP — contas e dados ficam no seu navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
