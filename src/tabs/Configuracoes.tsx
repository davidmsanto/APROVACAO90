import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import type { Settings } from "../lib/types";
import { DIFFICULTY_LIST, ERROR_LIST, IMPORTANCE_LIST, LEVEL_LIST, PHASES, STATUS_LIST } from "../lib/types";
import { Btn, Card, Chip, Dot, Field, SectionTitle, TabHeader, TextInput } from "../components/ui";
import { IcDownload, IcLock, IcPencil, IcRefresh } from "../components/icons";

const RANGES = ["acima de 120 dias", "61 a 120 dias", "22 a 60 dias", "21 dias ou menos"];

const LOCKED = [
  "Fórmulas de progresso e aproveitamento",
  "Cálculo do Índice APROVAÇÃO 90",
  "Indicadores do Dashboard",
  "Geração automática de revisões",
  "Priorização do Foco de hoje",
];
const EDITABLE = [
  "Concurso, cargo, banca e data da prova",
  "Metas de horas (ciclo e semana)",
  "Tópicos do edital e seus status",
  "Registros de questões e sessões",
  "Intervalos de revisão e limiares",
  "Pesos do Índice e observações",
];
const COLORS = [
  { c: "#00ff68", label: "Verde-neon", use: "Ação / atenção / resultado positivo" },
  { c: "#f5b84b", label: "Amarelo", use: "Atenção / em revisão" },
  { c: "#f0655f", label: "Vermelho", use: "Prioridade / dificuldade" },
  { c: "#5cb3ff", label: "Azul", use: "Informação / em estudo" },
  { c: "#a5b0aa", label: "Cinza", use: "Elementos neutros" },
];

export default function Configuracoes() {
  const { state, stats, updateSettings, resetAll, notify } = useStore();
  const [draft, setDraft] = useState<Settings>(state.settings);
  const [confirmReset, setConfirmReset] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(state.settings), [draft, state.settings]);
  const weightSum = Object.values(draft.weights).reduce((a, b) => a + b, 0);

  const set = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));
  const num = (v: string) => (isNaN(parseInt(v, 10)) ? 0 : parseInt(v, 10));

  const save = () => {
    if (weightSum !== 100) {
      notify(`Os pesos do Índice somam ${weightSum}% — ajuste para 100%.`, "red");
      return;
    }
    if (draft.thresholds.yellow >= draft.thresholds.green) {
      notify("O limiar crítico deve ser menor que o de consolidação.", "red");
      return;
    }
    updateSettings(draft);
    notify("Configurações salvas — indicadores recalculados.", "green");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aprovacao90-${stats.todayISO}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Backup exportado em JSON.", "blue");
  };

  const WEIGHT_ROWS: [keyof Settings["weights"], string][] = [
    ["edital", "Progresso do edital"],
    ["questoes", "Questões (aproveitamento)"],
    ["consistencia", "Consistência"],
    ["revisoes", "Revisões"],
    ["metas", "Metas"],
  ];

  return (
    <div>
      <TabHeader
        index="08"
        kicker="Painel de controle"
        title="Configurações"
        desc="Quase invisível no dia a dia — mas é aqui que o sistema vira produto: listas, parâmetros, pesos e proteções."
        right={
          dirty ? (
            <div className="flex gap-2">
              <Btn variant="ghost" size="sm" onClick={() => setDraft(state.settings)}>Descartar</Btn>
              <Btn size="sm" onClick={save}>Salvar alterações</Btn>
            </div>
          ) : (
            <Chip color="#00ff68">TUDO SALVO</Chip>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6" delay={0}>
          <SectionTitle kicker="01 · Universal" title="Dados do concurso" />
          <p className="mt-2 text-[12.5px] text-fog">A estrutura é a mesma para qualquer concurso — PC/AL é só o caso de teste.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Concurso"><TextInput value={draft.concurso} onChange={(e) => set({ concurso: e.target.value })} /></Field>
            <Field label="Cargo"><TextInput value={draft.cargo} onChange={(e) => set({ cargo: e.target.value })} /></Field>
            <Field label="Banca"><TextInput value={draft.banca} onChange={(e) => set({ banca: e.target.value })} /></Field>
            <Field label="Data da prova"><TextInput type="date" value={draft.examDate} onChange={(e) => set({ examDate: e.target.value })} /></Field>
            <Field label="Meta de horas do ciclo"><TextInput type="number" value={draft.courseGoalHours} onChange={(e) => set({ courseGoalHours: num(e.target.value) })} /></Field>
            <Field label="Meta semanal (horas)"><TextInput type="number" value={draft.weeklyGoalHours} onChange={(e) => set({ weeklyGoalHours: num(e.target.value) })} /></Field>
          </div>
        </Card>

        <Card className="p-6" delay={60}>
          <SectionTitle kicker="02 · Listas do sistema" title="Opções das listas suspensas" />
          <div className="mt-5 space-y-4">
            <div>
              <div className="kicker mb-2">Status de tópico</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_LIST.map((s) => (
                  <span key={s.value} className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-2.5 py-1.5 text-[12px] font-semibold text-fog">
                    <Dot color={s.color} size={7} /> {s.label}
                    <span className="num text-[10px] text-mist">{s.pct}%</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="kicker mb-2">Nível</div>
                <div className="flex flex-wrap gap-1.5">{LEVEL_LIST.map((l) => <Chip key={l} color="#5cb3ff">{l}</Chip>)}</div>
              </div>
              <div>
                <div className="kicker mb-2">Importância</div>
                <div className="flex flex-wrap gap-1.5">{IMPORTANCE_LIST.map((l) => <Chip key={l.value} color="#f5b84b">{l.label}</Chip>)}</div>
              </div>
            </div>
            <div>
              <div className="kicker mb-2">Dificuldade (1–5)</div>
              <div className="flex flex-wrap gap-1.5">{DIFFICULTY_LIST.map((l, i) => <Chip key={l} color={i >= 3 ? "#f0655f" : "#00ff68"}>{l}</Chip>)}</div>
            </div>
            <div>
              <div className="kicker mb-2">Tipos de erro</div>
              <div className="flex flex-wrap gap-1.5">{ERROR_LIST.map((l) => <Chip key={l.value} color="#f5b84b">{l.label}</Chip>)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6" delay={100}>
          <SectionTitle kicker="03 · Repetição espaçada" title="Parâmetros de revisão" />
          <p className="mt-2 text-[12.5px] text-fog">Hoje 24h/7d/30d — amanhã outro método, sem reconstruir nada.</p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {(["R1", "R2", "R3"] as const).map((label, i) => (
              <Field key={label} label={`Intervalo ${label}`}>
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    min={1}
                    value={draft.intervals[i]}
                    onChange={(e) => {
                      const nx = [...draft.intervals] as [number, number, number];
                      nx[i] = Math.max(1, num(e.target.value));
                      set({ intervals: nx });
                    }}
                  />
                  <span className="text-[12px] text-mist">{draft.intervals[i] === 1 ? "dia" : "dias"}</span>
                </div>
              </Field>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label="Consolidado (≥ %)">
              <TextInput type="number" value={draft.thresholds.green} onChange={(e) => set({ thresholds: { ...draft.thresholds, green: num(e.target.value) } })} />
            </Field>
            <Field label="Crítico (< %)">
              <TextInput type="number" value={draft.thresholds.yellow} onChange={(e) => set({ thresholds: { ...draft.thresholds, yellow: num(e.target.value) } })} />
            </Field>
          </div>
        </Card>

        <Card className="p-6" delay={140}>
          <div className="flex items-start justify-between">
            <SectionTitle kicker="04 · Métrica proprietária" title="Pesos do Índice A90" />
            <span
              className="num rounded-full border px-2.5 py-1 text-[12px] font-semibold"
              style={{
                color: weightSum === 100 ? "#00ff68" : "#f0655f",
                borderColor: weightSum === 100 ? "rgba(0,255,104,0.4)" : "rgba(240,101,95,0.4)",
                background: weightSum === 100 ? "rgba(0,255,104,0.08)" : "rgba(240,101,95,0.08)",
              }}
            >
              Σ {weightSum}%
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {WEIGHT_ROWS.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[1fr_90px] items-center gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-fog">{label}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raise">
                    <div className="bar-grow h-full rounded-full bg-brand2" style={{ width: `${draft.weights[key]}%` }} />
                  </div>
                </div>
                <TextInput
                  type="number"
                  value={draft.weights[key]}
                  onChange={(e) => set({ weights: { ...draft.weights, [key]: num(e.target.value) } })}
                  className="!text-center num"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" delay={180}>
          <SectionTitle kicker="05 · Linha do tempo" title="Fases da preparação" />
          <div className="mt-5 space-y-2.5">
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

        <Card className="p-6" delay={220}>
          <SectionTitle kicker="06 · Integridade" title="Proteção do sistema" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-danger"><IcLock size={14} /> CÉLULAS PROTEGIDAS</div>
              <div className="space-y-1.5">
                {LOCKED.map((l) => (
                  <div key={l} className="flex items-start gap-2 rounded-lg border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-3 py-2 text-[12px] text-fog">
                    <IcLock size={12} className="mt-0.5 shrink-0 text-danger/70" /> {l}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-brand2"><IcPencil size={14} /> CÉLULAS EDITÁVEIS</div>
              <div className="space-y-1.5">
                {EDITABLE.map((l) => (
                  <div key={l} className="flex items-start gap-2 rounded-lg border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-3 py-2 text-[12px] text-fog">
                    <IcPencil size={12} className="mt-0.5 shrink-0 text-brand2/70" /> {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6" delay={260}>
            <SectionTitle kicker="07 · Identidade" title="Sistema de cores" />
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {COLORS.map((c) => (
                <div key={c.label} className="flex items-center gap-3 rounded-xl border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-3.5 py-2.5">
                  <span className="h-8 w-8 shrink-0 rounded-lg border border-white/10" style={{ background: c.c, boxShadow: `0 0 12px ${c.c}44` }} />
                  <div>
                    <div className="text-[12.5px] font-semibold text-snow">{c.label}</div>
                    <div className="text-[11px] text-mist">{c.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" delay={300}>
            <SectionTitle kicker="Dados" title="Backup & demonstração" />
            <p className="mt-2 text-[12.5px] text-fog">Tudo salvo no navegador (localStorage), espelhando o futuro banco do PWA.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Btn variant="ghost" onClick={exportData}><IcDownload size={15} /> Exportar JSON</Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  if (!confirmReset) {
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 3500);
                    return;
                  }
                  resetAll();
                  setConfirmReset(false);
                  notify("Dados de demonstração restaurados.", "amber");
                }}
              >
                <IcRefresh size={15} />
                {confirmReset ? "Clique de novo para confirmar" : "Restaurar demonstração"}
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {dirty && (
        <div className="anim-rise sticky bottom-4 mt-6 flex justify-end">
          <div className="flex items-center gap-3 rounded-full border border-[rgba(0,255,104,0.4)] bg-[#061a0f] px-4 py-2.5 shadow-[0_16px_44px_-12px_rgba(0,0,0,0.9)]">
            <span className="text-[12.5px] text-fog">Alterações pendentes</span>
            <Btn size="sm" onClick={save}>Salvar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
