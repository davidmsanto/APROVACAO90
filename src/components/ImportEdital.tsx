import { useRef, useState, type DragEvent } from "react";
import { useStore } from "../lib/store";
import type { ImportMode, ImportPlanItem } from "../lib/types";
import { extractPdfText, parseEditalText, SAMPLE_EDITAL, type ParsedDiscipline } from "../lib/editalParser";
import { Btn, Chip, Dot } from "./ui";
import { IcCheck, IcChevron, IcFile, IcUpload, IcX } from "./icons";

type Step = "upload" | "parsing" | "review" | "done";

const STEPS = [
  ["01", "Arquivo"],
  ["02", "Revisão"],
  ["03", "Importado"],
] as const;

export default function ImportEdital({ onClose }: { onClose: () => void }) {
  const { state, applyImportPlan, notify } = useStore();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedDiscipline[]>([]);
  const [mode, setMode] = useState<ImportMode>("add");
  const [imported, setImported] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const subjects = state.subjects.filter((s) => s.id !== "sim");

  const runParse = (text: string, name: string) => {
    setFileName(name);
    if (text.trim().length < 120) {
      setError("O arquivo parece não ter camada de texto (PDF escaneado?). Tente o TXT ou cole o texto do edital.");
      setStep("upload");
      return;
    }
    const res = parseEditalText(text);
    if (res.length === 0) {
      setError("Não encontramos disciplinas numeradas neste arquivo. Tente colar o trecho do conteúdo programático.");
      setStep("upload");
      return;
    }
    setParsed(res);
    setStep("review");
  };

  const handleFile = async (file: File) => {
    setError(null);
    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf");
    const isTxt = lower.endsWith(".txt") || lower.endsWith(".text");
    if (!isPdf && !isTxt) {
      setError("Formato não suportado — envie um .pdf ou .txt do edital.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Arquivo acima de 15 MB. Exporte só o trecho do conteúdo programático.");
      return;
    }
    setFileName(file.name);
    setStep("parsing");
    try {
      const text = isPdf ? await extractPdfText(file) : await file.text();
      runParse(text, file.name);
    } catch {
      setError("Não foi possível ler este arquivo. Se for um PDF protegido ou escaneado, cole o texto manualmente.");
      setStep("upload");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  /* ---------- helpers da revisão ---------- */
  const set = (mut: (list: ParsedDiscipline[]) => ParsedDiscipline[]) => setParsed(mut);
  const includedTopics = parsed
    .filter((d) => d.include)
    .reduce((a, d) => a + d.topics.filter((t) => t.include).length, 0);

  const doImport = () => {
    const plan: ImportPlanItem[] = parsed
      .filter((d) => d.include)
      .map((d) => ({
        subjectId: d.target !== "new" ? d.target : undefined,
        subjectName: d.target === "new" ? d.name : undefined,
        topics: d.topics.filter((t) => t.include).map((t) => ({ name: t.name })),
      }))
      .filter((p) => p.topics.length > 0);
    if (plan.length === 0) {
      setError("Selecione ao menos um tópico para importar.");
      return;
    }
    const count = applyImportPlan(plan, mode);
    setImported(count);
    setStep("done");
    notify(
      mode === "replace"
        ? `Edital substituído: ${count} tópicos no plano.`
        : `${count} tópicos importados para o edital.`,
      "green",
    );
  };

  const stepIdx = step === "upload" || step === "parsing" ? 0 : step === "review" ? 1 : 2;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#020b06]/85 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="anim-rise card relative my-4 w-full max-w-[860px] overflow-hidden"
        style={{ boxShadow: "0 0 60px rgba(0,255,90,0.1), 0 30px 80px -20px rgba(0,0,0,0.8)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <div className="flex items-center justify-between border-b border-[rgba(0,255,104,0.1)] px-6 py-4">
          <div>
            <div className="kicker">[ importar edital · pdf / txt ]</div>
            <div className="font-display mt-0.5 text-[20px] font-light text-snow">Suba o edital, o sistema verticaliza</div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,255,104,0.2)] text-fog transition-all hover:border-[rgba(240,101,95,0.5)] hover:text-danger active:scale-90"
            aria-label="Fechar"
          >
            <IcX size={16} />
          </button>
        </div>

        {/* indicador de etapas */}
        <div className="flex items-center gap-2 border-b border-[rgba(0,255,104,0.08)] px-6 py-3">
          {STEPS.map(([n, label], i) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className="num rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition-all"
                style={{
                  borderColor: i <= stepIdx ? "rgba(0,255,104,0.5)" : "rgba(0,255,104,0.12)",
                  color: i <= stepIdx ? "#00ff68" : "#66716b",
                  background: i <= stepIdx ? "rgba(0,255,104,0.08)" : "transparent",
                  boxShadow: i === stepIdx ? "0 0 14px rgba(0,255,90,0.25)" : "none",
                }}
              >
                {n}
              </span>
              <span className={`text-[11.5px] font-semibold ${i <= stepIdx ? "text-snow" : "text-mist"}`}>{label}</span>
              {i < 2 && <span className="mx-1 h-px w-8 bg-[rgba(0,255,104,0.15)]" />}
            </div>
          ))}
          {fileName && step !== "done" && (
            <span className="num ml-auto hidden max-w-[220px] truncate text-[10.5px] text-mist sm:block">{fileName}</span>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {/* ============ ETAPA 1 · upload ============ */}
          {step === "upload" && (
            <div className="anim-fade">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all"
                style={{
                  borderColor: dragging ? "rgba(0,255,104,0.6)" : "rgba(0,255,104,0.2)",
                  background: dragging ? "rgba(0,255,104,0.06)" : "rgba(4,20,10,0.4)",
                  boxShadow: dragging ? "0 0 40px rgba(0,255,90,0.15)" : "none",
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt,.text"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border transition-all group-hover:scale-105"
                  style={{
                    borderColor: "rgba(0,255,104,0.35)",
                    background: "rgba(0,255,104,0.08)",
                    boxShadow: "0 0 24px rgba(0,255,90,0.18)",
                  }}
                >
                  <IcUpload size={26} className="text-brand2" />
                </div>
                <div className="mt-4 font-display text-[19px] font-light text-snow">
                  {dragging ? "Solte o arquivo aqui" : "Arraste o PDF do edital"}
                </div>
                <div className="mt-1 text-[12.5px] text-fog">
                  ou clique para escolher · <span className="num text-brand2">.pdf</span> ou <span className="num text-brand2">.txt</span> · até 15 MB
                </div>
                <div className="mt-3 text-[10.5px] text-mist">Processado 100% no seu navegador — nada é enviado a servidores.</div>
              </div>

              {error && (
                <div className="anim-rise mt-4 rounded-[10px] border border-[rgba(240,101,95,0.4)] bg-[rgba(240,101,95,0.08)] px-4 py-3 text-[12.5px] font-medium text-[#f0655f]">
                  {error}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setError(null);
                    setStep("parsing");
                    setTimeout(() => runParse(SAMPLE_EDITAL, "edital-exemplo-pcal.txt"), 700);
                  }}
                  className="rounded-xl border border-[rgba(0,255,104,0.2)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.45)] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-brand2">
                    <IcFile size={15} /> Usar edital de exemplo
                  </div>
                  <div className="mt-1 text-[11.5px] text-fog">PC/AL estruturado — para ver o parser em ação agora.</div>
                </button>
                <button
                  onClick={() => setPasteOpen((v) => !v)}
                  className="rounded-xl border border-[rgba(0,255,104,0.2)] bg-[#04140a] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(0,255,104,0.45)] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-brand2">
                    <IcUpload size={15} /> Colar texto do edital
                  </div>
                  <div className="mt-1 text-[11.5px] text-fog">PDF escaneado? Copie o conteúdo programático e cole.</div>
                </button>
              </div>

              {pasteOpen && (
                <div className="anim-rise mt-4">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"Cole aqui o conteúdo programático…\n\nLÍNGUA PORTUGUESA: 1 Compreensão de textos. 2 Ortografia oficial.\nDIREITO PENAL: 1 Aplicação da lei penal. 2 Crime."}
                    className="h-40 w-full resize-y rounded-[10px] border border-[rgba(0,255,104,0.14)] bg-[#04140a]/80 p-3.5 text-[12.5px] leading-relaxed text-snow outline-none transition-all placeholder:text-mist focus:border-[rgba(0,255,104,0.5)] focus:shadow-[0_0_18px_rgba(0,255,90,0.12)]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Btn size="sm" disabled={pasteText.trim().length < 40} onClick={() => runParse(pasteText, "texto colado")}>
                      Analisar texto
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============ ETAPA 2a · lendo ============ */}
          {step === "parsing" && (
            <div className="anim-fade flex flex-col items-center py-14">
              <div className="kicker flex items-center gap-2 !text-[10px]">
                <span className="pulse-g inline-block h-2 w-2 rounded-full bg-brand2" />
                [ lendo arquivo · extraindo disciplinas e tópicos ]
              </div>
              <div className="num mt-3 text-[13px] text-fog">{fileName}</div>
              <div className="mt-5 w-full max-w-md space-y-2.5">
                {[88, 72, 92, 60].map((w, i) => (
                  <div key={i} className="shimmer h-10 rounded-lg" style={{ width: `${w}%`, animationDelay: `${i * 130}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* ============ ETAPA 2b · revisão ============ */}
          {step === "review" && (
            <div className="anim-fade">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="num text-[13px] text-brand2">{parsed.length} disciplinas detectadas</span>
                <span className="num text-[13px] text-fog">{includedTopics} tópicos selecionados</span>
                <div className="ml-auto flex gap-1.5">
                  {(["add", "replace"] as ImportMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95"
                      style={{
                        borderColor: mode === m ? (m === "replace" ? "rgba(240,101,95,0.6)" : "rgba(0,255,104,0.6)") : "rgba(0,255,104,0.15)",
                        color: mode === m ? (m === "replace" ? "#f0655f" : "#00ff68") : "#66716b",
                        background: mode === m ? (m === "replace" ? "rgba(240,101,95,0.1)" : "rgba(0,255,104,0.08)") : "transparent",
                      }}
                    >
                      {m === "add" ? "Adicionar ao edital" : "Substituir disciplinas"}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "replace" && (
                <div className="anim-rise mt-3 rounded-[10px] border border-[rgba(245,184,75,0.4)] bg-[rgba(245,184,75,0.07)] px-3.5 py-2.5 text-[12px] text-amber">
                  Modo substituição: os tópicos atuais das disciplinas mapeadas serão trocados pelos do arquivo. Questões e status antigos dessas disciplinas são descartados.
                </div>
              )}

              {error && (
                <div className="anim-rise mt-3 rounded-[10px] border border-[rgba(240,101,95,0.4)] bg-[rgba(240,101,95,0.08)] px-3.5 py-2.5 text-[12px] text-[#f0655f]">
                  {error}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {parsed.map((d, gi) => {
                  const matched = subjects.find((s) => s.id === d.suggestedSubjectId);
                  const targetSubj = d.target !== "new" ? subjects.find((s) => s.id === d.target) : null;
                  const selCount = d.topics.filter((t) => t.include).length;
                  return (
                    <div
                      key={d.key}
                      className="anim-rise rounded-xl border border-[rgba(0,255,104,0.12)] bg-[#04140a] transition-all hover:border-[rgba(0,255,104,0.25)]"
                      style={{ animationDelay: `${gi * 60}ms`, opacity: d.include ? 1 : 0.5 }}
                    >
                      <div className="flex flex-wrap items-center gap-3 p-4">
                        <button
                          onClick={() => set((l) => l.map((x) => (x.key === d.key ? { ...x, include: !x.include } : x)))}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-all active:scale-90"
                          style={{
                            borderColor: d.include ? "#00ff68" : "rgba(0,255,104,0.2)",
                            background: d.include ? "#00ff68" : "transparent",
                          }}
                          aria-label={`Incluir ${d.name}`}
                        >
                          {d.include && <IcCheck size={12} className="tick-anim text-[#001b09]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[14px] font-semibold text-snow">{d.name}</span>
                            {d.confidence === "auto" && matched ? (
                              <Chip color={matched.color}>→ {matched.short}</Chip>
                            ) : (
                              <Chip color="#f5b84b">nova disciplina</Chip>
                            )}
                          </div>
                          <div className="num mt-0.5 text-[11px] text-mist">
                            {selCount}/{d.topics.length} tópicos ·{" "}
                            <details className="inline cursor-pointer text-brand2">
                              <summary className="inline list-none hover:underline">ver tópicos</summary>
                            </details>
                          </div>
                        </div>
                        <select
                          value={d.target}
                          disabled={!d.include}
                          onChange={(e) => set((l) => l.map((x) => (x.key === d.key ? { ...x, target: e.target.value } : x)))}
                          className="w-[190px] cursor-pointer rounded-full border border-[rgba(0,255,104,0.18)] bg-[#020b06] px-3 py-1.5 text-[11.5px] font-semibold text-fog outline-none transition-all focus:border-[rgba(0,255,104,0.5)] disabled:opacity-40"
                        >
                          <option value="new">＋ Criar como nova disciplina</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <TopicList
                        key={d.key + selCount}
                        topics={d.topics}
                        open={false}
                        color={targetSubj?.color ?? matched?.color ?? "#c9a2ff"}
                        onToggle={(i) =>
                          set((l) =>
                            l.map((x) =>
                              x.key === d.key
                                ? { ...x, topics: x.topics.map((t, ti) => (ti === i ? { ...t, include: !t.include } : t)) }
                                : x,
                            ),
                          )
                        }
                        onAll={(v) =>
                          set((l) => l.map((x) => (x.key === d.key ? { ...x, topics: x.topics.map((t) => ({ ...t, include: v })) } : x)))
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button onClick={() => setStep("upload")} className="text-[12px] font-semibold text-fog transition-colors hover:text-snow">
                  ← Trocar arquivo
                </button>
                <Btn onClick={doImport} disabled={includedTopics === 0}>
                  <IcCheck size={14} /> Importar {includedTopics} tópicos
                </Btn>
              </div>
            </div>
          )}

          {/* ============ ETAPA 3 · concluído ============ */}
          {step === "done" && (
            <div className="anim-rise flex flex-col items-center py-10 text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(0,255,104,0.5)] bg-[rgba(0,255,104,0.1)]"
                style={{ boxShadow: "0 0 50px rgba(0,255,90,0.3)" }}
              >
                <IcCheck size={34} className="tick-anim text-brand2" />
              </div>
              <div className="num mt-5 text-[44px] font-semibold leading-none text-snow" style={{ textShadow: "0 0 30px rgba(0,255,104,0.35)" }}>
                {imported}
              </div>
              <div className="mt-1 text-[13px] uppercase tracking-[0.2em] text-mist">tópicos no plano</div>
              <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-fog">
                O edital entrou no sistema: Dashboard, Planejador, Foco de hoje e o Índice A90 já reconhecem os novos tópicos.
              </p>
              <div className="mt-6 flex gap-2.5">
                <Btn variant="ghost" onClick={onClose}>
                  Ver edital verticalizado
                </Btn>
                <Btn
                  onClick={() => {
                    setParsed([]);
                    setStep("upload");
                    setPasteText("");
                    setError(null);
                  }}
                >
                  Importar outro arquivo
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- lista expansível de tópicos ---------- */
function TopicList({
  topics,
  open: _open,
  color,
  onToggle,
  onAll,
}: {
  topics: { name: string; include: boolean }[];
  open: boolean;
  color: string;
  onToggle: (i: number) => void;
  onAll: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const sel = topics.filter((t) => t.include).length;
  return (
    <div className="border-t border-[rgba(0,255,104,0.07)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-[11.5px] font-semibold text-mist transition-colors hover:text-snow"
      >
        <span className="transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <IcChevron size={13} />
        </span>
        {sel} de {topics.length} tópicos selecionados
        <span
          className="ml-auto cursor-pointer text-[11px] font-semibold text-brand2 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onAll(sel !== topics.length);
          }}
        >
          {sel === topics.length ? "desmarcar todos" : "marcar todos"}
        </span>
      </button>
      {open && (
        <div className="anim-fade max-h-56 overflow-y-auto px-4 pb-3">
          {topics.map((t, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[rgba(0,255,104,0.04)]">
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-all"
                style={{
                  borderColor: t.include ? color : "rgba(0,255,104,0.18)",
                  background: t.include ? color : "transparent",
                }}
              >
                {t.include && <IcCheck size={10} className="tick-anim text-[#001b09]" />}
              </span>
              <input type="checkbox" className="hidden" checked={t.include} onChange={() => onToggle(i)} />
              <span className={`text-[12.5px] leading-snug ${t.include ? "text-snow" : "text-mist line-through"}`}>{t.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
