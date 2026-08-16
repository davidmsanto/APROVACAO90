/* ============ provider de IA · Gemini (com fallback local) ============ */

import type { AiMode } from "./types";
import { AI_BANK, filterItems } from "./knowledge";

export interface AiOutput {
  flashcards: { q: string; a: string }[];
  quiz: { statement: string; correct: boolean; expl: string }[];
  resumo: { topic: string; inc: number; points: string[]; wrong: string }[];
  engine: "gemini" | "local";
}

const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;

function buildPrompt(subjectName: string, topics: string[], mode: AiMode, base: ReturnType<typeof filterItems>): string {
  const baseTxt = base
    .slice(0, 6)
    .map((i) => `- [incidência ${i.inc}/5] ${i.q} | pegadinha: ${i.wrong}`)
    .join("\n");
  return `Você é o motor de estudo "APROVAÇÃO 90", especializado em concursos públicos brasileiros estilo Cebraspe (Certo/Errado).
Disciplina: ${subjectName}. Recorte: ${topics.length ? topics.join("; ") : "todos os tópicos"}.
Conteúdo calibrado (o que MAIS CAI):
${baseTxt || "use seu conhecimento sobre o que mais cai dessa disciplina em concurso público"}

Gere APENAS JSON válido, em português, com esta estrutura:
{
  "flashcards": [{ "q": "pergunta", "a": "resposta" }] (4 itens),
  "quiz": [{ "statement": "afirmativa estilo Cebraspe", "correct": true|false, "expl": "comentário do gabarito" }] (5 itens),
  "resumo": [{ "topic": "tópico", "inc": 1-5, "points": ["ponto-chave"], "wrong": "pegadinha comum" }] (3 itens)
}
Sem markdown, sem texto fora do JSON.`;
}

function parseGemini(text: string): Omit<AiOutput, "engine"> {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const obj = JSON.parse(cleaned.slice(start));
  return {
    flashcards: Array.isArray(obj.flashcards) ? obj.flashcards.slice(0, 8) : [],
    quiz: Array.isArray(obj.quiz) ? obj.quiz.slice(0, 10) : [],
    resumo: Array.isArray(obj.resumo) ? obj.resumo.slice(0, 6) : [],
  };
}

export async function generateWithGemini(
  apiKey: string,
  subjectName: string,
  topics: string[],
  mode: AiMode,
): Promise<AiOutput> {
  const base = filterItems(subjectName.toLowerCase());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(subjectName, topics, mode, base) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { ...parseGemini(text), engine: "gemini" };
  } finally {
    clearTimeout(timer);
  }
}

/* fallback: motor local calibrado (mesma interface) */
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
  };
}
