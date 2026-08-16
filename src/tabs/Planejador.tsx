import { useState } from "react";
import { useStore } from "../lib/store";
import { KIND_LABEL } from "../lib/types";
import { addDaysD, fmtMin, isoOf, mondayOf } from "../lib/calc";
import { Bar, Card, Chip, TabHeader } from "../components/ui";
import { IcArrow, IcCheck } from "../components/icons";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export default function Planejador() {
  const { state, stats, togglePlanner, notify } = useStore();
  const [weekShift, setWeekShift] = useState(0);
  const monday = addDaysD(mondayOf(new Date()), weekShift * 7);
  const todayISO = stats.todayISO;
  const goalMin = state.settings.weeklyGoalHours * 60;

  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysD(monday, i));
  const weekKeys = weekDates.map((d) => isoOf(d));

  const doneInWeek = (dayIdx: number) =>
    state.planner
      .filter((s) => s.day === dayIdx)
      .filter((s) => state.plannerDone.includes(`${weekKeys[dayIdx]}:${s.id}`))
      .reduce((a, s) => a + s.minutes, 0);

  const plannedTotal = state.planner.reduce((a, s) => a + s.minutes, 0);
  const doneTotal = weekKeys.reduce((acc, _, i) => acc + doneInWeek(i), 0);

  return (
    <div>
      <TabHeader
        index="04"
        kicker="Ciclo semanal"
        title="Planejador"
        desc="O plano nasce das prioridades do edital. Concluir um bloco registra a sessão de estudo automaticamente."
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekShift((w) => w - 1)} className="rounded-full border border-[rgba(0,255,104,0.2)] p-2 text-fog transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2 active:scale-95">
              <IcArrow size={15} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button onClick={() => setWeekShift(0)} className="rounded-full border border-[rgba(0,255,104,0.2)] px-3 py-2 text-[12.5px] font-semibold text-fog transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2">
              {weekShift === 0 ? "semana atual" : "voltar ao hoje"}
            </button>
            <button onClick={() => setWeekShift((w) => w + 1)} className="rounded-full border border-[rgba(0,255,104,0.2)] p-2 text-fog transition-all hover:border-[rgba(0,255,104,0.5)] hover:text-brand2 active:scale-95">
              <IcArrow size={15} />
            </button>
          </div>
        }
      />

      <Card className="mb-5 p-5" delay={40}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <div className="kicker">Semana de</div>
            <div className="num mt-1 text-[18px] font-semibold text-snow">
              {weekDates[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} –{" "}
              {weekDates[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </div>
          </div>
          <div>
            <div className="kicker">Planejado</div>
            <div className="num mt-1 text-[18px] font-semibold text-info">{fmtMin(plannedTotal)}</div>
          </div>
          <div>
            <div className="kicker">Executado</div>
            <div className="num mt-1 text-[18px] font-semibold text-brand2">{fmtMin(doneTotal)}</div>
          </div>
          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex justify-between text-[11.5px] text-mist">
              <span>Meta semanal: {state.settings.weeklyGoalHours}h</span>
              <span className="num">{Math.min(100, Math.round((doneTotal / goalMin) * 100))}%</span>
            </div>
            <Bar pct={(doneTotal / goalMin) * 100} color={doneTotal >= goalMin ? "#00ff68" : "#5cb3ff"} h={8} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {weekDates.map((date, di) => {
          const dateISO = isoOf(date);
          const isToday = dateISO === todayISO;
          const slots = state.planner.filter((s) => s.day === di);
          const done = doneInWeek(di);
          const planned = slots.reduce((a, s) => a + s.minutes, 0);
          return (
            <Card
              key={dateISO}
              delay={di * 60}
              className={`flex flex-col p-3.5 ${isToday ? "border-[rgba(0,255,104,0.5)] shadow-[0_0_28px_-8px_rgba(0,255,104,0.4)]" : ""}`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <div className={`text-[12.5px] font-semibold ${isToday ? "text-brand2" : "text-snow"}`}>{DAYS[di]}</div>
                  <div className="num text-[11px] text-mist">{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
                </div>
                {isToday && <Chip color="#00ff68">HOJE</Chip>}
              </div>
              <div className="flex-1 space-y-2.5">
                {slots.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[rgba(0,255,104,0.15)] px-3 py-4 text-center text-[11.5px] text-mist">
                    Dia livre — descanso também é estratégia.
                  </div>
                )}
                {slots.map((slot) => {
                  const key = `${dateISO}:${slot.id}`;
                  const doneSlot = state.plannerDone.includes(key);
                  const subj = state.subjects.find((s) => s.id === slot.subjectId);
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        togglePlanner(dateISO, slot);
                        notify(doneSlot ? "Bloco desmarcado." : `Bloco concluído: +${slot.minutes} min (${subj?.short})`, doneSlot ? "amber" : "green");
                      }}
                      className="group block w-full rounded-lg border bg-[#04140a] p-2.5 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                      style={{
                        borderColor: doneSlot ? "rgba(0,255,104,0.35)" : "rgba(0,255,104,0.1)",
                        borderLeft: `3px solid ${subj?.color ?? "#a5b0aa"}`,
                        opacity: doneSlot ? 0.75 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[12px] font-semibold leading-tight ${doneSlot ? "text-mist line-through" : "text-snow"}`}>
                          {slot.label}
                        </span>
                        <span
                          className="mt-0.5 flex shrink-0 items-center justify-center rounded-[5px] border transition-all"
                          style={{
                            width: 18,
                            height: 18,
                            borderColor: doneSlot ? "#00ff68" : "rgba(0,255,104,0.2)",
                            background: doneSlot ? "#00ff68" : "transparent",
                          }}
                        >
                          {doneSlot && <IcCheck size={11} className="tick-anim text-[#001b09]" />}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Chip color={subj?.color ?? "#a5b0aa"} className="!px-1.5 !text-[9.5px]">{KIND_LABEL[slot.kind]}</Chip>
                        <span className="num text-[10.5px] text-mist">{slot.minutes} min</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-[rgba(0,255,104,0.06)] pt-2 text-[10.5px] text-mist">
                <span className="num font-semibold text-fog">{fmtMin(done)}</span> de <span className="num">{fmtMin(planned)}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[12px] text-mist">
        O plano é replicado para cada semana — o que muda é a sua execução. Blocos concluídos viram horas no Dashboard e na Meta semanal.
      </p>
    </div>
  );
}
