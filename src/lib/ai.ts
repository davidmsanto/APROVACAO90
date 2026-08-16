/* ============================================================
   Adaptador de provedor de IA — APROVAÇÃO 90
   Hoje: Google Gemini (REST, CORS habilitado, JSON estruturado).
   A interface `AiProvider` permite trocar por OpenAI/DeepSeek/
   Qwen via OpenRouter sem tocar na UI.

   ⚠ Arquitetura de segurança: a chave vive apenas no navegador
   do próprio usuário (ferramenta pessoal). Na fase PWA
   multiusuário, este chamador deve migrar para um proxy de
   backend — nunca distribuir chave em app público.
   ============================================================ */

import type { AiItem, AiMode } from "./knowledge";

export interface DeckCard { q: string; a: string; topic: string; inc: number }
export interface QuizQ { statement: string; correct: boolean; expl: string; topic: string }
export interface ResumoBlock { topic: string; inc: number; points: string[]; wrong: string }
export type AiPayload =
  | { mode: "flashcards"; deck: DeckCard[] }
  | { mode: "quiz"; quiz: QuizQ[] }
  | { mode: "resumo"; resumo: ResumoBlock[] };

const MODEL_PRIMARY = "gemini-2.5-flash";
const MODEL_FALLBACK = "gemini-2.0-flash";

const SYSTEM = `Você é o motor pedagógico do APROVAÇÃO 90, sistema de preparação para concursos públicos brasileiros estilo Cebraspe (Certo/Errado).
Regras rígidas:
- Responda SOMENTE com JSON válido, sem markdown, sem comentários.
- Português do Brasil, nível de candidato de carreira policial.
- Conteúdo juridicamente e tecnicamente preciso — nunca invente dispositivo legal.
- Use APENAS os rótulos de tópico fornecidos no contexto.`;

function promptFor(mode: AiMode, ground: AiItem[], topic?: string): string {
  const ctx = ground.map((i) => ({
    topico: i.topic, incidencia: i.inc, resumo: i.points, pegadinha: i.wrong,
  }));
  const base = `Contexto calibrado (ground truth do edital):\n${JSON.stringify(ctx, null, 1)}${
    topic ? `\nRecorte obrigatório: tópico "${topic}".` : "\nUse todos os tópicos do contexto."
  }`;

  if (mode === "flashcards") {
    return `${base}
Gere 10 flashcards de memorização ativa com base no contexto, priorizando maior incidência.
Formato EXATO:
{"flashcards":[{"q":"pergunta curta","a":"resposta precisa (máx. 220 caracteres)","topic":"rótulo do tópico","inc":1a5}]}`;
  }
  if (mode === "quiz") {
    return `${base}
Gere 8 assertivas estilo Cebraspe (Certo/Errado) com base no contexto. Misture ~4 certas e ~4 erradas. As erradas devem ser pegadinhas plausíveis, não absurdos.
Formato EXATO:
{"questoes":[{"statement":"assertiva declarativa","correct":true|false,"expl":"comentário do gabarito (máx. 200 caracteres)","topic":"rótulo do tópico"}]}`;
  }
  return `${base}
Gere um resumo estratégico agrupado por tópico (4 a 6 blocos), com 3 bullets cada e a pegadinha clássica da banca.
Formato EXATO:
{"resumo":[{"topic":"rótulo do tópico","inc":1a5,"points":["bullet 1","bullet 2","bullet 3"],"wrong":"pegadinha clássica da banca"}]}`;
}

function stripFences(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("```")) {
    const inner = t.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "");
    return inner.trim();
  }
  return t;
}

async function callGemini(key: string, model: string, system: string, user: string, signal: AbortSignal): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message ?? msg;
    } catch { /* ignora */ }
    throw new Error(msg);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Resposta vazia do modelo.");
  return text;
}

export async function pingGemini(key: string): Promise<{ ok: boolean; msg: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    await callGemini(key, MODEL_PRIMARY, "Responda apenas com JSON.", '{"ping":"ok"}', ctrl.signal);
    return { ok: true, msg: "Conexão OK — chave válida." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha de rede.";
    if (/API key|PERMISSION_DENIED|API_KEY/i.test(msg)) {
      return { ok: false, msg: "Chave inválida ou sem permissão (verifique no Google AI Studio)." };
    }
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, msg: "Tempo esgotado (15s) — verifique a conexão." };
    }
    return { ok: false, msg };
  } finally {
    clearTimeout(t);
  }
}

export async function generateWithGemini(
  key: string,
  mode: AiMode,
  ground: AiItem[],
  topic?: string,
): Promise<AiPayload> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45_000);
  const user = promptFor(mode, ground, topic);
  try {
    let raw: string;
    try {
      raw = await callGemini(key, MODEL_PRIMARY, SYSTEM, user, ctrl.signal);
    } catch (e) {
      // fallback de modelo (ex.: 2.5 sem cota no free tier)
      if (/model|not found|quota/i.test(e instanceof Error ? e.message : "")) {
        raw = await callGemini(key, MODEL_FALLBACK, SYSTEM, user, ctrl.signal);
      } else throw e;
    }
    const parsed = JSON.parse(stripFences(raw));

    if (mode === "flashcards") {
      const deck: DeckCard[] = (parsed.flashcards ?? parsed.flashcard ?? [])
        .slice(0, 12)
        .map((c: Partial<DeckCard>) => ({
          q: String(c.q ?? ""), a: String(c.a ?? ""), topic: String(c.topic ?? topic ?? "Geral"),
          inc: Math.min(5, Math.max(1, Number(c.inc) || 3)),
        }))
        .filter((c: DeckCard) => c.q && c.a);
      if (deck.length < 3) throw new Error("JSON sem flashcards suficientes.");
      return { mode, deck };
    }
    if (mode === "quiz") {
      const quiz: QuizQ[] = (parsed.questoes ?? parsed.questions ?? parsed.quiz ?? [])
        .slice(0, 10)
        .map((q: Partial<QuizQ> & { correct?: boolean | string }) => ({
          statement: String(q.statement ?? ""),
          correct: q.correct === true || String(q.correct).toLowerCase() === "true",
          expl: String(q.expl ?? ""),
          topic: String(q.topic ?? topic ?? "Geral"),
        }))
        .filter((q: QuizQ) => q.statement);
      if (quiz.length < 3) throw new Error("JSON sem assertivas suficientes.");
      return { mode, quiz };
    }
    const resumo: ResumoBlock[] = (parsed.resumo ?? parsed.blocos ?? [])
      .slice(0, 8)
      .map((b: Partial<ResumoBlock>) => ({
        topic: String(b.topic ?? topic ?? "Geral"),
        inc: Math.min(5, Math.max(1, Number(b.inc) || 3)),
        points: Array.isArray(b.points) ? b.points.map(String).slice(0, 5) : [],
        wrong: String(b.wrong ?? ""),
      }))
      .filter((b: ResumoBlock) => b.points.length > 0);
    if (resumo.length < 1) throw new Error("JSON sem blocos de resumo.");
    return { mode, resumo };
  } finally {
    clearTimeout(t);
  }
}
