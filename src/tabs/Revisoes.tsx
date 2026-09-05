import { useMemo } from "react";
import { useStore } from "../lib/store";
import type { Review } from "../lib/types";
import { fmtFull, fmtPct } from "../lib/calc";
import { Btn, Card, Chip, Dot, TabHeader } from "../components/ui";
import { IcCheck, IcInfo } from "../components/icons";

const STAGE_META = {
  1: { label: "R1", color: "#5cb3ff" },
  2: { label: "R2", color: "#f5b84b" },
  3: { label: "R3", color: "#00ff68" },
} as const;

export default function Revisoes() {
  const { state, stats, completeReview, notify } = useStore();
  const today = stats.todayISO;
  const [r1, r2, r3] = state.settings.intervals;

  const groups = useMemo(() => {
    const pending = state.reviews.filter((x) => !x.done);
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const in7iso = `${in7.getFullYear()}-${String(in7.getMonth() + 1).padStart(2, "0")}-${String(in7.getDate()).padStart(2, "0")}`;
    return {
      late: pending.filter((x) => x.due < today).sort((a, b) => (a.due < b.due ? -1 : 1)),
      today: pending.filter((x) => x.due === today),
      soon: pending.filter((x) => x.due > today && x.due <= in7iso).sort((a, b) => (a.due < b.due ? -1 : 1)),
      done: state.reviews.filter((x) => x.done).sort((a, b) => ((a.doneOn ?? "") < (b.doneOn ?? "") ? 1 : -1)).slice(0, 6),
    };
  }, [state.reviews, today]);

  const topicOf = (id: string) => state.topics.find((t) => t.id === id);
  const subjOf = (id: string) => state.subjects.find((s) => s.id === id);

  const finish = (rev: Review) => {
    completeReview(rev.id);
    const t = topicOf(rev.topicId);
    if (rev.stage < 3) {
      const gap = rev.stage === 1 ? r2 : r3;
      notify(`R${rev.stage} concluída (${t?.name ?? ""}) — R${rev.stage + 1} em ${gap} dias`, "green");
    } else {
      notify(`Ciclo completo: ${t?.name ?? ""} consolidado 🏆`, "green");
    }
  };

  const Item = ({ rev, urgent = false }: { rev: Review; urgent?: boolean }) => {
    const t = topicOf(rev.topicId);
    const s = subjOf(rev.subjectId);
    const st = STAGE_META[rev.stage];
    return (
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(0,255,104,0.1)] bg-[#04140a] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.3)]"
        style={{ borderLeft: `3px solid ${st.color}` }}
      >
        <span
          className="num flex h-8 w-10 items-center justify-center rounded-lg border text-[12px] font-semibold"
          style={{ borderColor: `${st.color}55`, color: st.color, background: `${st.color}12` }}
        >
          {st.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-snow">{t?.name ?? "Tópico"}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mist">
            <Dot color={s?.color ?? "#a5b0aa"} size={6} />
            {s?.name}
            {urgent && <span className="font-semibold text-danger">· atrasada desde {fmtFull(rev.due)}</span>}
            {!urgent && !rev.done && <span>· vence {fmtFull(rev.due)}</span>}
            {rev.done && <span>· feita em {fmtFull(rev.doneOn ?? rev.due)}</span>}
          </div>
        </div>
        {!rev.done ? (
          <Btn size="sm" onClick={() => finish(rev)}>
            <IcCheck size={13} /> Concluir
          </Btn>
        ) : (
          <Chip color="#00ff68">CONCLUÍDA</Chip>
        )}
      </div>
    );
  };

  const Section = ({ title, items, color, urgent = false, empty }: { title: string; items: Review[]; color: string; urgent?: boolean; empty: string }) => (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <Dot color={color} pulse={urgent && items.length > 0} size={9} />
        <h3 className="font-display text-[15px] font-semibold text-snow">{title}</h3>
        <span className="num rounded-full border border-[rgba(0,255,104,0.15)] bg-[#04140a] px-2 py-0.5 text-[11px] font-semibold text-fog">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(0,255,104,0.15)] px-4 py-5 text-center text-[12.5px] text-mist">{empty}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((r) => (
            <Item key={r.id} rev={r} urgent={urgent} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <TabHeader
        index="06"
        kicker="Memória de longo prazo"
        title="Revisões"
        desc="Repetição espaçada automática: cada tema gera R1, R2 e R3. Revisão em dia é ponto direto no Índice."
        right={
          <div className="flex gap-2">
            <Chip color={stats.reviewsPct >= 80 ? "#00ff68" : "#f5b84b"}>{stats.reviewsPct}% concluídas</Chip>
            <Chip color="#5cb3ff">{stats.dueToday + stats.overdue} pendentes hoje</Chip>
          </div>
        }
      />

      <Card className="mb-6 p-5" delay={30}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="kicker flex items-center gap-2"><IcInfo size={14} /> Método ativo</span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { l: "R1", d: `+${r1} dia`, c: "#5cb3ff" },
              { l: "R2", d: `+${r2} dias`, c: "#f5b84b" },
              { l: "R3", d: `+${r3} dias`, c: "#00ff68" },
            ].map((x, i) => (
              <div key={x.l} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-[rgba(0,255,104,0.12)] bg-[#04140a] px-3 py-1.5">
                  <span className="num text-[12px] font-semibold" style={{ color: x.c }}>{x.l}</span>
                  <span className="num text-[11.5px] text-fog">{x.d}</span>
                </span>
                {i < 2 && <span className="text-[rgba(0,255,104,0.25)]">→</span>}
              </div>
            ))}
          </div>
          <span className="text-[11.5px] text-mist">intervalos editáveis em Configurações</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6 p-6" delay={80}>
          <Section title="🔴 Atrasadas" items={groups.late} color="#f0655f" urgent empty="Nenhuma revisão atrasada. Excelente gestão." />
          <Section title="🔵 Para hoje" items={groups.today} color="#5cb3ff" empty="Nada programado para hoje." />
        </Card>
        <Card className="space-y-6 p-6" delay={140}>
          <Section title="Próximos 7 dias" items={groups.soon} color="#f5b84b" empty="Agenda livre na próxima semana." />
          <Section title="Concluídas recentemente" items={groups.done} color="#00ff68" empty="Nenhuma revisão concluída ainda." />
        </Card>
      </div>

      <p className="mt-5 text-center text-[12px] text-mist">
        Concluir uma revisão agenda automaticamente a próxima etapa — {fmtPct(stats.reviewsPct, 0)} de tudo que o sistema gerou já foi revisado.
      </p>
    </div>
  );
}
