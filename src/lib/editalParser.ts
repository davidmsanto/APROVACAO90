/* ============ importador de edital (PDF / TXT) ============ */

export interface ParsedTopic {
  name: string;
  include: boolean;
}

export interface ParsedDiscipline {
  key: string;
  name: string;
  topics: ParsedTopic[];
  suggestedSubjectId: string | null;
  confidence: "auto" | "manual";
  include: boolean;
  target: string; // subjectId | "new"
}

/* ---------- extração de PDF (100% no navegador) ---------- */

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerMod = await import("pdfjs-dist/build/pdf.worker.min.js?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const parts = (content.items as { str?: string; hasEOL?: boolean }[]).map((it) =>
      it.str !== undefined ? it.str + (it.hasEOL ? "\n" : " ") : "",
    );
    text += parts.join("") + "\n";
  }
  return text;
}

/* ---------- heurísticas de reconhecimento ---------- */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/* frases → subjectId (mais longas primeiro para "processual penal" vencer "penal") */
const KEYWORD_RAW: [string, string][] = [
  ["direito processual penal", "dpp"],
  ["processo penal", "dpp"],
  ["direito penal", "dpe"],
  ["medicina legal", "dpe"],
  ["direito constitucional", "dcn"],
  ["direitos humanos", "dcn"],
  ["direito administrativo", "dad"],
  ["legislacao especial", "lex"],
  ["legislacao pertinente", "lex"],
  ["legislacao", "lex"],
  ["lingua portuguesa", "por"],
  ["redacao oficial", "por"],
  ["portugues", "por"],
  ["raciocinio logico", "rlm"],
  ["logica", "rlm"],
  ["matematica", "rlm"],
  ["tecnologia da informacao", "inf"],
  ["informatica", "inf"],
];
const KEYWORDS: [string, string][] = [...KEYWORD_RAW].sort((a, b) => b[0].length - a[0].length);

const IGNORED = new Set([
  "conhecimentos basicos",
  "conhecimentos especificos",
  "conhecimentos gerais",
  "conteudo programatico",
  "programa",
  "prova objetiva",
  "prova discursiva",
  "das provas",
  "do concurso",
  "edital",
  "anexo",
  "anexo i",
  "anexo ii",
  "anexo iii",
  "quadro de provas",
  "objetivos",
  "introducao",
  "requisitos",
  "cargo",
  "cargos",
  "banca",
  "gabarito",
]);

function matchSubject(raw: string): string | null {
  const n = norm(raw.replace(/\(.*?\)/g, " "));
  for (const [kw, id] of KEYWORDS) {
    if (n.includes(kw)) return id;
  }
  return null;
}

const uid = () => `pd${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* "1 xxx. 2 yyy." → linhas individuais de tópico */
function splitNumberedRuns(line: string): string[] {
  const re = /\b(\d{1,2})\s*[.)\-–—:]\s+/g;
  const marks: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) marks.push(m.index);
  if (marks.length <= 1) return [line];
  const parts: string[] = [];
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1] : line.length;
    parts.push(line.slice(marks[i], end).trim());
  }
  return parts;
}

export function parseEditalText(raw: string): ParsedDiscipline[] {
  const clean = raw
    .replace(/\r\n?/g, "\n")
    .replace(/(\w)-\n(\w)/g, "$1$2") // hifenização de quebra de linha
    .replace(/[ \t]+/g, " ");

  const rawLines = clean.split("\n").map((l) => l.trim()).filter((l) => l.length > 1);

  /* expande "CABEÇALHO: 1 tópico. 2 tópico." em linhas separadas */
  const lines: string[] = [];
  for (const l of rawLines) {
    const headed = /^([^0-9\n]{3,70}?)\s*:\s*(\d.*)$/.exec(l);
    if (headed) {
      lines.push(headed[1]);
      lines.push(...splitNumberedRuns(headed[2]));
    } else {
      lines.push(...splitNumberedRuns(l));
    }
  }

  const out: ParsedDiscipline[] = [];
  let current: ParsedDiscipline | null = null;

  for (const line of lines) {
    const stripped = line.replace(/:+\s*$/, "").replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
    if (!stripped) continue;

    let numbered = /^(\d{1,2})\s*[.)\-–—:]\s+(.+)/.exec(stripped);
    if (!numbered) numbered = /^(\d{1,2})\s+([A-ZÀ-Ú].+)/.exec(stripped); // "1 Aplicação da lei penal"
    const subtopic = /^\d{1,2}\.\d+(\.\d+)?\s*[.)\-–—]?\s*(.*)/.exec(stripped);
    const text = subtopic ? subtopic[2] : numbered ? numbered[2] : stripped;

    /* 1) cabeçalho de disciplina conhecido? */
    const matched = matchSubject(text);
    const isCaps = stripped === stripped.toUpperCase() && /[A-ZÀ-Ú]{3,}/.test(stripped);
    const looksHeading =
      (isCaps || /^[A-ZÀ-Ú][A-Za-zÀ-úç ]{2,44}$/.test(stripped)) &&
      stripped.split(" ").length <= 6 &&
      stripped.length <= 70 &&
      !IGNORED.has(norm(stripped)) &&
      !numbered;

    if (matched || looksHeading) {
      current = {
        key: uid(),
        name: stripped.replace(/:+$/, ""),
        topics: [],
        suggestedSubjectId: matched,
        confidence: matched ? "auto" : "manual",
        include: true,
        target: matched ?? "new",
      };
      out.push(current);
      continue;
    }

    /* 2) tópico numerado */
    if ((numbered || subtopic) && text) {
      if (!current) {
        current = {
          key: uid(),
          name: "Conteúdo geral",
          topics: [],
          suggestedSubjectId: null,
          confidence: "manual",
          include: true,
          target: "new",
        };
        out.push(current);
      }
      if (current.topics.length < 120) current.topics.push({ name: text, include: true });
      continue;
    }

    /* 3) linha de continuação do último tópico */
    if (current && current.topics.length > 0 && !isCaps) {
      const last = current.topics[current.topics.length - 1];
      if (last.name.length < 160) last.name = `${last.name} ${stripped}`.slice(0, 180);
    }
  }

  return out.filter((d) => d.topics.length > 0);
}

/* ---------- edital de exemplo (demo) ---------- */

export const SAMPLE_EDITAL = `CONHECIMENTOS BÁSICOS

LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos de gêneros variados. 2 Reconhecimento de tipos e gêneros textuais. 3 Domínio da ortografia oficial. 4 Domínio dos mecanismos de coesão textual. 5 Concordância verbal e nominal. 6 Regência verbal e nominal. 7 Crase. 8 Pontuação.

RACIOCÍNIO LÓGICO: 1 Estruturas lógicas. 2 Lógica de argumentação: analogias, inferências, deduções e conclusões. 3 Diagramas lógicos. 4 Princípios de contagem e probabilidade. 5 Operações com conjuntos.

NOÇÕES DE INFORMÁTICA: 1 Sistema operacional Windows 10 e 11. 2 Edição de textos, planilhas e apresentações (ambientes Microsoft Office e LibreOffice). 3 Redes de computadores: conceitos básicos, Internet e intranet. 4 Segurança da informação: noções de criptografia, assinatura digital e autenticação.

CONHECIMENTOS ESPECÍFICOS

DIREITO CONSTITUCIONAL: 1 Princípios fundamentais da República. 2 Direitos e garantias fundamentais: direitos e deveres individuais e coletivos. 3 Organização do Estado: União, Estados, Municípios e Distrito Federal. 4 Administração Pública: disposições gerais e servidores públicos. 5 Segurança pública: organização, competência e atribuições.

DIREITO PENAL: 1 Aplicação da lei penal. 2 Crime: conceito, classificação e elementos. 3 Consumação e tentativa. 4 Legítima defesa, estado de necessidade, estrito cumprimento de dever legal e exercício regular de direito. 5 Crimes contra a pessoa. 6 Crimes contra o patrimônio.

DIREITO PROCESSUAL PENAL: 1 Inquérito policial: natureza, instauração e arquivamento. 2 Prisão em flagrante e prisão preventiva. 3 Provas: ônus da prova e meios de prova. 4 Cadeia de custódia.

DIREITO ADMINISTRATIVO: 1 Princípios da Administração Pública. 2 Poderes administrativos: hierárquico, disciplinar e de polícia. 3 Atos administrativos: requisitos, atributos e extinção. 4 Agentes públicos. 5 Improbidade administrativa.

LEGISLAÇÃO PERTINENTE: 1 Lei nº 13.869/2019 (Abuso de Autoridade). 2 Lei nº 9.455/1997 (Tortura). 3 Lei nº 10.826/2003 (Estatuto do Desarmamento). 4 Lei nº 11.343/2006 (Drogas).`;
