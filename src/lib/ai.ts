/* ============ camada de IA do APROVAÇÃO 90 ============
   Cadeia de motores (do melhor para o garantido):
   1. Gemini direto  — chave gratuita do Google AI Studio (rápido + confiável)
   2. Gemini grátis  — proxy público sem chave (text.pollinations.ai, CORS ok)
   3. Motor local    — base calibrada embutida (sempre disponível, offline)
   ===================================================== */

import type { AiMode } from "./types";
import { AI_BANK, filterItems } from "./knowledge";

export type Engine = "gemini" | "gemini-free" | "local";

export interface AiOutput {
  flashcards: { q: string; a: string }[];
  quiz: { statement: string; correct: boolean; expl: string }[];
  resumo: { topic: string; inc: number; points: string[]; wrong: string }[];
  engine: Engine;
  ms: number;
}

export interface PingResult {
  ok: boolean;
  ms: number;
  engine: Engine;
}

const SYSTEM_PROMPT =
  'Você é o motor de estudo "APROVAÇÃO 90", especialista em concursos públicos brasileiros estilo Cebraspe (Certo/Errado). Responda SEMPRE apenas com JSON válido, em português, sem markdown.';

const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

const FREE_URL = "https://text.pollinations.ai/openai";

function buildPrompt(subjectName: string, topics: string[], mode: AiMode, base: ReturnType<typeof filterItems>): string {
  const baseTxt = base
    .slice(0, 6)
    .map((i) => `- [incidência ${i.inc}/5] ${i.q} | pegadinha: ${i.wrong}`)
    .join("\n");
  const modeHint =
    mode === "flashcards"
      ? "Priorize os flashcards (memorização ativa)."
      : mode === "quiz"
        ? "Priorize as questões C/E com gabarito comentado."
        : "Priorize o resumo estratégico com pegadinhas.";
  return `Disciplina: ${subjectName}. Recorte: ${topics.length ? topics.join("; ") : "todos os tópicos"}.
Conteúdo calibrado (o que MAIS CAI em prova):
${baseTxt || "use seu conhecimento sobre o que mais cai dessa disciplina em concurso público"}
${modeHint}

Gere APENAS JSON válido com esta estrutura:
{
  "flashcards": [{ "q": "pergunta", "a": "resposta" }] (4 itens),
  "quiz": [{ "statement": "afirmativa estilo Cebraspe", "correct": true|false, "expl": "comentário do gabarito" }] (5 itens),
  "resumo": [{ "topic": "tópico", "inc": 1-5, "points": ["ponto-chave"], "wrong": "pegadinha comum" }] (3 itens)
}
Sem markdown, sem crase, sem texto fora do JSON.`;
}

function parseJsonPayload(text: string): Omit<AiOutput, "engine" | "ms"> {
  let cleaned = (text ?? "").trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON não encontrado");
  const obj = JSON.parse(cleaned.slice(start, end + 1));
  return {
    flashcards: Array.isArray(obj.flashcards) ? obj.flashcards.slice(0, 10) : [],
    quiz: Array.isArray(obj.quiz) ? obj.quiz.slice(0, 12) : [],
    resumo: Array.isArray(obj.resumo) ? obj.resumo.slice(0, 8) : [],
  };
}

const timed = async <T,>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> => {
  const t0 = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - t0) };
};

/* ---------- 1 · Gemini direto (chave AI Studio) ---------- */

async function callGeminiDirect(apiKey: string, prompt: string, jsonOnly: boolean): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.7,
          ...(jsonOnly ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Resposta vazia");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- 2 · Gemini grátis (sem chave) ---------- */

async function callGeminiFree(prompt: string, jsonOnly: boolean): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(FREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gemini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        ...(jsonOnly ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Resposta vazia");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- pings de conectividade ---------- */

export async function pingGeminiDirect(apiKey: string): Promise<PingResult> {
  try {
    const { ms } = await timed(() => callGeminiDirect(apiKey, 'Responda apenas com a palavra "ok".', false));
    return { ok: true, ms, engine: "gemini" };
  } catch {
    return { ok: false, ms: 0, engine: "gemini" };
  }
}

export async function pingGeminiFree(): Promise<PingResult> {
  try {
    const { ms } = await timed(() => callGeminiFree('Responda apenas com a palavra "ok".', false));
    return { ok: true, ms, engine: "gemini-free" };
  } catch {
    return { ok: false, ms: 0, engine: "gemini-free" };
  }
}

/* ---------- 3 · motor local calibrado ---------- */

export function generateLocal(subjectId: string, topicId: string | undefined): AiOutput {
  const items = filterItems(subjectId, topicId);
  const pool = items.length ? items : AI_BANK.filter((i) => i.subjectId === subjectId).slice(0, 4);
  return {
    flashcards: pool.map((i) => ({ q: i.q, a: i.a })),
    quiz: pool.map((i, idx) =>
      idx % 2 === 0
        ? { statement: i.q, correct: true, expl: i.expl }
        : { statement: i.wrong, correct: false, expl: i.expl },
    ),
    resumo: pool.map((i) => ({ topic: i.topicId, inc: i.inc, points: i.points, wrong: i.wrong })),
    engine: "local",
    ms: 0,
  };
}

/* ---------- orquestrador: melhor motor disponível ---------- */

export async function generateAi(opts: {
  apiKey: string;
  subjectId: string;
  subjectName: string;
  topics: string[];
  mode: AiMode;
  topicId?: string;
}): Promise<AiOutput> {
  const base = filterItems(opts.subjectId, opts.topicId);
  const prompt = buildPrompt(opts.subjectName, opts.topics, opts.mode, base);

  if (opts.apiKey.trim()) {
    try {
      const { value, ms } = await timed(() => callGeminiDirect(opts.apiKey.trim(), prompt, true));
      const parsed = parseJsonPayload(value);
      if (parsed.flashcards.length || parsed.quiz.length || parsed.resumo.length) {
        return { ...parsed, engine: "gemini", ms };
      }
    } catch {
      /* cai para o próximo motor */
    }
  }

  try {
    const { value, ms } = await timed(() => callGeminiFree(prompt, true));
    const parsed = parseJsonPayload(value);
    if (parsed.flashcards.length || parsed.quiz.length || parsed.resumo.length) {
      return { ...parsed, engine: "gemini-free", ms };
    }
  } catch {
    /* cai para o motor local */
  }

  await new Promise((r) => setTimeout(r, 650)); // feedback perceptível do motor local
  return generateLocal(opts.subjectId, opts.topicId);
}
