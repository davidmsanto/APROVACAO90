/* ============ importador de edital (PDF / TXT) ============
   Parser global por posição: localiza todos os cabeçalhos de disciplina
   (inclusive no meio do texto), fatia o documento e extrai os tópicos
   numerados — incluindo subtópicos (4.1, 1.3.1) e seções em numerais
   romanos (I, II, III) que pertencem à disciplina anterior.
   ============================================================ */

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
  ["cidadania", "dcn"],
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
  "programas",
  "prova objetiva",
  "prova discursiva",
  "das provas",
  "do concurso",
  "do certame",
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
  "atribuicoes",
  "descricao do cargo",
]);

function matchSubject(raw: string): string | null {
  const n = norm(raw.replace(/\(.*?\)/g, " "));
  for (const [kw, id] of KEYWORDS) {
    if (n.includes(kw)) return id;
  }
  return null;
}

const isIgnored = (name: string) => IGNORED.has(norm(name.replace(/\(.*?\)/g, " ")));

const uid = () => `pd${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ---------- detecção de cabeçalhos (global, por posição) ---------- */

interface HeaderHit {
  start: number; // início do nome
  end: number; // logo após os dois-pontos
  name: string;
  isRoman: boolean;
}

/* cabeçalho = frase em CAIXA ALTA (com acentos/números/&/parênteses) seguida de ":"
   precedida por início, quebra de linha, fim de frase (". "/") ") ou ": " (subseção).
   Usa lookbehind (não consome o contexto) para capturar cabeçalhos consecutivos
   como "QUÍMICA: I ESTRUTURA DO ÁTOMO:". */
const HEADER_RE =
  /(?<=^|\n|[.)]\s|:\s)([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ0-9&·,\/()\- ]{2,75}?)\s*:/g;

/* subseção em numeral romano: "I ESTRUTURA…", "VI QUÍMICA DO CARBONO" */
const ROMAN_RE = /^(?:X{0,3})(?:IX|IV|V?I{0,3})\s+\S/;
const isRomanHeader = (name: string) => ROMAN_RE.test(name.trim());

const cleanHeaderName = (n: string) => n.replace(/:+$/, "").replace(/\s+/g, " ").trim();

function findHeaders(text: string): HeaderHit[] {
  HEADER_RE.lastIndex = 0;
  const out: HeaderHit[] = [];
  let m: RegExpExecArray | null;
  while ((m = HEADER_RE.exec(text))) {
    out.push({
      start: m.index, // lookbehind não faz parte do match → começa no nome
      end: m.index + m[0].length, // logo após os dois-pontos
      name: m[1],
      isRoman: isRomanHeader(m[1]),
    });
  }
  return out;
}

/* ---------- extração de tópicos dentro de uma seção ----------
   Captura itens numerados (1, 2, 3…) e subtópicos (4.1, 1.3.1), reunindo
   o texto quebrado em várias linhas. Números "soltos" no meio da frase
   (ex.: "de 1 a 8 carbonos", "Lei nº 5.346/1992") são ignorados. */
function extractTopics(section: string): string[] {
  const flat = section
    .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2") // hifenização de quebra de linha
    .replace(/\s*\n\s*/g, " ") // reúne linhas quebradas
    .replace(/\s+/g, " ")
    .trim();
  if (!flat) return [];

  const re = /(^|\s)(\d{1,2}(?:\.\d{1,2}){0,2})(?=\s)/g;
  const tokens: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat))) {
    const num = m[2];
    const dotted = num.includes(".");
    const preChar = m[1] === "" ? "" : flat[m.index - 1] ?? "";
    const boundaryOk = m[1] === "" || /[.:)]/.test(preChar);
    if (dotted || boundaryOk) {
      tokens.push({ start: m.index + m[1].length, end: m.index + m[0].length });
    }
  }

  const names: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const from = tokens[i].end;
    const to = i + 1 < tokens.length ? tokens[i + 1].start : flat.length;
    let text = flat.slice(from, to).replace(/\s+/g, " ").trim();
    text = text.replace(/[.;]\s*$/, "").trim();
    if (text.length > 1) names.push(text.length > 220 ? text.slice(0, 217) + "…" : text);
  }
  return names;
}

/* ---------- parser principal ---------- */

const makeDiscipline = (
  name: string,
  suggested: string | null,
  confidence: "auto" | "manual",
): ParsedDiscipline => ({
  key: uid(),
  name,
  topics: [],
  suggestedSubjectId: suggested,
  confidence,
  include: true,
  target: suggested ?? "new",
});

export function parseEditalText(raw: string): ParsedDiscipline[] {
  const flat = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const headers = findHeaders(flat);
  if (headers.length === 0) return [];

  const disciplines: ParsedDiscipline[] = [];
  let current: ParsedDiscipline | null = null;

  headers.forEach((h, i) => {
    const segEnd = i + 1 < headers.length ? headers[i + 1].start : flat.length;
    const topics = extractTopics(flat.slice(h.end, segEnd));

    if (h.isRoman) {
      /* subseção (I, II, III…): os tópicos pertencem à disciplina anterior */
      if (!current) {
        current = makeDiscipline(cleanHeaderName(h.name), null, "manual");
        disciplines.push(current);
      }
      const owner = current;
      topics.forEach((t) => {
        if (owner.topics.length < 200) owner.topics.push({ name: t, include: true });
      });
      return;
    }

    const name = cleanHeaderName(h.name);
    if (isIgnored(name)) return; // cabeçalho estrutural — não vira disciplina

    const matched = matchSubject(name);
    current = makeDiscipline(name, matched, matched ? "auto" : "manual");
    disciplines.push(current);
    const owner = current;
    topics.forEach((t) => {
      if (owner.topics.length < 200) owner.topics.push({ name: t, include: true });
    });
  });

  return disciplines.filter((d) => d.topics.length > 0);
}

/* ---------- edital de exemplo (demo — estilo CBM/AL) ---------- */

export const SAMPLE_EDITAL = `CONTEÚDO PROGRAMÁTICO

LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos de gêneros variados. 2 Reconhecimento
de tipos e gêneros textuais. 3 Domínio da ortografia oficial. 4 Domínio dos mecanismos de coesão textual.
4.1 Emprego de elementos de referenciação, substituição e repetição, de conectores e de outros
elementos de sequenciação textual. 4.2 Emprego de tempos e modos verbais. 5 Domínio da estrutura
morfossintática do período. 5.1 Emprego das classes de palavras. 5.2 Relações de coordenação entre
orações e entre termos da oração. 5.3 Relações de subordinação entre orações. 5.4 Emprego dos sinais
de pontuação. 5.5 Concordância verbal e nominal. 5.6 Regência verbal e nominal. 5.7 Emprego do sinal
indicativo de crase. 6 Reescrita de frases e parágrafos do texto.

NOÇÕES DE INFORMÁTICA: 1 Noções de sistema operacional (ambientes Linux e Windows). 2 Edição de
textos, planilhas e apresentações (ambientes Microsoft Office e BrOffice). 3 Redes de computadores. 3.1
Conceitos básicos, ferramentas, aplicativos e procedimentos de Internet e intranet. 3.2 Programas de
navegação (Microsoft Edge, Mozilla Firefox e Google Chrome). 3.3 Programas de correio eletrônico. 3.4
Sítios de busca e pesquisa na Internet. 3.5 Computação na nuvem (cloud computing). 4 Conceitos de
organização e de gerenciamento de informações, arquivos, pastas e programas. 5 Segurança da
informação. 5.1 Procedimentos de segurança. 5.2 Noções de vírus, worms e pragas virtuais. 5.3
Aplicativos para segurança (antivírus, firewall, anti-spyware etc.). 5.4 Procedimentos de backup. 5.5
Armazenamento de dados na nuvem (cloud storage). MATEMÁTICA: 1 Álgebra linear. 1.1 Conjunto
numérico: operações com números inteiros, fracionários e decimais. 2 Proporções e divisão proporcional.
3 Regras de três simples e composta. 4 Porcentagem. 5 Juros simples e compostos; capitalização e
descontos. 6 Taxas de juros: nominal, efetiva, equivalente, proporcional, real e aparente.

RACIOCÍNIO LÓGICO E ANALÍTICO: 1 Lógica sentencial (ou proposicional). 1.1 Proposições simples e
compostas. 1.2 Tabelas verdade. 1.3 Equivalências. 2 Estrutura lógica de relações arbitrárias entre
pessoas, lugares, objetos ou eventos fictícios. 3 Compreensão e análise da lógica de uma situação. 4
Problemas de lógica e raciocínio. 4.1 Problemas de contagem e noções de probabilidade. 5 Falácias. 6
Noções de estatística: média, moda, mediana e desvio-padrão.

LEGISLAÇÃO PERTINENTE AO CBMAL: 1 Lei Estadual nº 5.346/1992 (dispõe sobre o Estatuto dos
Policiais Militares do Estado de Alagoas e dá outras providências) e suas alterações. 2 Decreto estadual
nº 37.042/1996 (Regulamento Disciplinar da Polícia Militar de Alagoas). 3 Lei Estadual nº 6.514/2004 e
suas alterações. 4 Lei Estadual nº 6.544/2004 e suas alterações. 5 Lei Federal nº 14.751/2023.

QUÍMICA: I ESTRUTURA DO ÁTOMO: 1 Estrutura atômica. 1.1 Partículas fundamentais do átomo. 1.2
Número atômico e massa atômica. 1.3 Massa molecular. II CLASSIFICAÇÃO PERIÓDICA DOS ELEMENTOS
QUÍMICOS: 1 Elemento químico. 1.1 Configuração eletrônica. 1.2 Tabela periódica atual e sua estrutura.
III LIGAÇÃO QUÍMICA: 1 Ligação iônica. 2 Ligação covalente. 3 Fórmula eletrônica (estrutural de Lewis).
4 Número de oxidação.

FÍSICA: 1 Vetores. 1.1 Sistema de forças. 1.2 Composição de forças. 2 Mecânica. 2.1 Noções de
Movimento. 2.2 Movimento retilíneo: velocidade, movimento uniformemente variado, aceleração. 2.3 Leis
de Newton. 2.4 Leis da Gravitação Universal. 2.5 Trabalho, potência, rendimento, energia: mecânica,
cinética, energia potencial e energia mecânica. 3 Densidade e pressão. 4 Termodinâmica. 5 Óptica
geométrica. 6 Som. 7 Eletricidade e Magnetismo. 7.1 Lei de Coulomb. 7.2 Corrente elétrica. 7.3
Circuitos elétricos.

BIOLOGIA: 1 Seres vivos: classificação dos seres vivos. 2 Célula. 2.1 Célula procariota e eucariota. 2.2
Componentes morfológicos das células. 3 Anatomia e fisiologia humanas. 3.1 Fisiologia. 3.2 Sistema
respiratório. 3.3 Sistema cardiovascular. 4 Tecidos animais. 5 Evolução dos seres vivos. 6 Ecologia. 6.1
Relações tróficas entre os seres vivos. 6.2 Biomas.

MECÂNICA GERAL: 1 Motor de combustão interna. 1.1 Conceito. 1.2 Ciclo de funcionamento (4 tempos)
1.3 Tipos de motores 1.3.1 Ciclo Otto. 1.3.2 Ciclo Diesel. 2 Sistema de transmissão. 2.1 Função. 2.2
Componentes. 3 Sistema de freios. 3.1 Função. 3.2 Tipos. 4 Sistema de suspensão. 5 Sistema elétrico. 6
Sistema de arrefecimento.`;
