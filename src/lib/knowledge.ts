/* ============ base calibrada A90 · o que MAIS CAI em prova ============ */

export interface AiItem {
  id: string;
  subjectId: string;
  topicId: string;
  inc: number; // incidência 1–5
  q: string; // proposição correta
  a: string; // resposta / explicação
  expl: string;
  points: string[];
  wrong: string; // pegadinha (parece certa, mas é ERRADA)
}

export const AI_SUBJECTS = ["por", "rlm", "inf", "dcn", "dad"];

export const AI_BANK: AiItem[] = [
  /* ---------- Português ---------- */
  {
    id: "por1", subjectId: "por", topicId: "por-8", inc: 5,
    q: "Ocorre crase na fusão da preposição 'a' com o artigo definido feminino 'a'.",
    a: "A crase é a contração de dois 'a': a preposição exigida pelo termo regente + o artigo (ou pronome) feminino. Ex.: 'Fui à escola' (ir a + a escola).",
    expl: "A crase só existe quando há termo regente que peça a preposição 'a' E termo regido feminino que aceite o artigo. Na dúvida, troque por um masculino: se virar 'ao', há crase.",
    points: ["Crase = preposição 'a' + artigo 'a'", "Troque por palavra masculina: se der 'ao', tem crase", "Nunca antes de verbo, palavra masculina ou pronome pessoal"],
    wrong: "Há crase em 'Vou a Brasília amanhã', pois Brasília é cidade.",
  },
  {
    id: "por2", subjectId: "por", topicId: "por-6", inc: 5,
    q: "Na concordância verbal, o verbo concorda com o núcleo do sujeito em número e pessoa.",
    a: "O verbo flexiona para concordar com o sujeito. Sujeito composto antes do verbo → plural. Depois do verbo → plural ou concordância com o mais próximo.",
    expl: "A banca adora sujeito composto posposto e sujeito com núcleo no singular seguido de adjunto no plural (ex.: 'A maioria dos alunos passou').",
    points: ["Verbo concorda com o núcleo do sujeito", "'A maioria de + plural' admite singular ou plural", "Sujeito posposto permite concordância atrativa"],
    wrong: "Em 'Fazem dez anos que não o vejo', o verbo está correto por indicar tempo decorrido.",
  },
  {
    id: "por3", subjectId: "por", topicId: "por-1", inc: 4,
    q: "A coerência diz respeito à relação lógica entre as ideias; a coesão, aos mecanismos linguísticos que conectam o texto.",
    a: "Coerência = sentido, lógica interna. Coesão = recursos gramaticais (conjunções, pronomes, elipses) que costuram o texto.",
    expl: "Questões de reescrita cobram se a troca de um conectivo preserva coerência E coesão. Um texto pode ser coeso e incoerente.",
    points: ["Coerência = lógica das ideias", "Coesão = conectivos, pronomes, elipse", "Reescrita deve preservar sentido e correção"],
    wrong: "Coesão e coerência são sinônimos, pois ambas tratam da conexão entre as partes do texto.",
  },

  /* ---------- RLM ---------- */
  {
    id: "rlm1", subjectId: "rlm", topicId: "rlm-1", inc: 5,
    q: "A condicional 'Se p, então q' só é falsa quando p é verdadeiro e q é falso.",
    a: "Na tabela-verdade do condicional (p → q), a única linha falsa é V → F. Nas demais (V→V, F→V, F→F) o condicional é verdadeiro.",
    expl: "Memorize: condicional só é falso com antecedente verdadeiro e consequente falso. A banca inverte isso em quase toda prova.",
    points: ["p → q é falso apenas em V→F", "Falso antecedente torna o condicional verdadeiro", "Equivalência: p → q ≡ ~q → ~p"],
    wrong: "O condicional 'Se p, então q' é falso sempre que p for falso.",
  },
  {
    id: "rlm2", subjectId: "rlm", topicId: "rlm-3", inc: 5,
    q: "A negação de 'p e q' é '~p ou ~q' (Leis de De Morgan).",
    a: "De Morgan: ~(p ∧ q) ≡ ~p ∨ ~q e ~(p ∨ q) ≡ ~p ∧ ~q. Nega-se cada parte e troca 'e' por 'ou' (e vice-versa).",
    expl: "A pegadinha clássica é negar 'e' mantendo 'e'. Lembre: negação de conjunção vira disjunção de negações.",
    points: ["~(p ∧ q) ≡ ~p ∨ ~q", "~(p ∨ q) ≡ ~p ∧ ~q", "Negar o condicional: p ∧ ~q"],
    wrong: "A negação de 'p e q' é '~p e ~q'.",
  },
  {
    id: "rlm3", subjectId: "rlm", topicId: "rlm-6", inc: 4,
    q: "Combinação não considera a ordem dos elementos; arranjo, sim.",
    a: "C(n,k) = n!/(k!(n−k)!) para grupos sem ordem. A(n,k) = n!/(n−k)! quando a ordem importa.",
    expl: "Se trocar a ordem dos escolhidos gera um resultado diferente, é arranjo; se gera o mesmo grupo, é combinação.",
    points: ["Combinação: ordem não importa", "Arranjo: ordem importa", "C(n,k) divide A(n,k) por k!"],
    wrong: "Para formar uma comissão de 3 pessoas entre 10, usa-se arranjo, pois as pessoas são distintas.",
  },

  /* ---------- Informática ---------- */
  {
    id: "inf1", subjectId: "inf", topicId: "inf-4", inc: 5,
    q: "Phishing é uma técnica de engenharia social que usa mensagens falsas para obter dados da vítima.",
    a: "No phishing, o atacante se passa por instituição confiável (banco, órgão) por e-mail/SMS para roubar credenciais. Não é vírus: depende da ação da vítima.",
    expl: "A banca distingue phishing (fraude por mensagem) de malware (código malicioso). Phishing é golpe, não programa.",
    points: ["Phishing = engenharia social por mensagem", "Depende da ação da vítima, não é vírus", "Sinais: remetente estranho, link suspeito, urgência"],
    wrong: "Phishing é um tipo de vírus que se replica automaticamente e infecta o sistema operacional.",
  },
  {
    id: "inf2", subjectId: "inf", topicId: "inf-5", inc: 4,
    q: "Um firewall filtra o tráfego de rede com base em regras de segurança, podendo bloquear conexões indesejadas.",
    a: "Firewall atua como barreira entre redes (ex.: interna e internet), aplicando regras para permitir ou bloquear pacotes. Não elimina vírus por si só.",
    expl: "Cobra-se a diferença: firewall filtra tráfego; antivírus detecta malware; backup cópia de segurança.",
    points: ["Firewall filtra tráfego por regras", "Atua entre redes (interna/externa)", "Não substitui antivírus nem backup"],
    wrong: "O firewall elimina vírus e malwares já instalados no computador, limpando o sistema.",
  },
  {
    id: "inf3", subjectId: "inf", topicId: "inf-7", inc: 3,
    q: "O sistema operacional gerencia recursos de hardware e fornece uma interface para os programas.",
    a: "SO (Windows, Linux) controla processador, memória, dispositivos e arquivos, permitindo que aplicativos rodem sem gerenciar o hardware diretamente.",
    expl: "Funções cobradas: gerenciamento de processos, memória, arquivos e dispositivos; interface usuário/programa.",
    points: ["SO gerencia hardware e recursos", "Fornece interface para aplicativos", "Exemplos: Windows, Linux, macOS"],
    wrong: "O sistema operacional é um aplicativo de escritório usado para editar textos e planilhas.",
  },

  /* ---------- Direito Constitucional ---------- */
  {
    id: "dcn1", subjectId: "dcn", topicId: "dcn-2", inc: 5,
    q: "Os direitos e garantias fundamentais têm aplicabilidade imediata, nos termos do art. 5º, §1º, da CF/88.",
    a: "O §1º do art. 5º estabelece que as normas definidoras de direitos e garantias fundamentais têm aplicação imediata, embora parte da doutrina pondere a eficácia de cada norma.",
    expl: "Cai sempre a literalidade do §1º. A banca também cobra quais direitos são cláusulas pétreas (art. 60, §4º, IV).",
    points: ["Art. 5º, §1º: aplicabilidade imediata", "Direitos fundamentais são cláusulas pétreas", "Não são absolutos: comportam relativização"],
    wrong: "Os direitos fundamentais são absolutos e não admitem qualquer restrição, nem por lei.",
  },
  {
    id: "dcn2", subjectId: "dcn", topicId: "dcn-5", inc: 5,
    q: "A segurança pública é dever do Estado, direito e responsabilidade de todos, exercida pelas polícias e guardas municipais.",
    a: "Art. 144 da CF/88: a segurança pública é exercida pela PF, PRF, PFF, polícias civis, polícias militares e corpos de bombeiros, além das guardas municipais.",
    expl: "A banca lista os órgãos e pede para marcar o que NÃO integra o rol (ex.: incluir Forças Armadas como órgão de segurança pública).",
    points: ["Art. 144: rol taxativo de órgãos", "Guardas municipais protegem bens, serviços e instalações", "Forças Armadas não são órgão de segurança pública do art. 144"],
    wrong: "As Forças Armadas integram o rol de órgãos responsáveis pela segurança pública previsto no art. 144.",
  },
  {
    id: "dcn3", subjectId: "dcn", topicId: "dcn-1", inc: 4,
    q: "A dignidade da pessoa humana é um dos fundamentos da República Federativa do Brasil.",
    a: "Art. 1º, III, da CF/88: fundamentos — soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, pluralismo político.",
    expl: "Memorize o mnemônico SO-CI-DI-VA-PLU (fundamentos). Objetivos fundamentais (art. 3º) e princípios das relações internacionais (art. 4º) são cobrados em paralelo.",
    points: ["Fundamentos: art. 1º (SO-CI-DI-VA-PLU)", "Objetivos: art. 3º (verbos)", "Princípios internacionais: art. 4º"],
    wrong: "A dignidade da pessoa humana é um objetivo fundamental da República, previsto no art. 3º da CF/88.",
  },

  /* ---------- Direito Administrativo ---------- */
  {
    id: "dad1", subjectId: "dad", topicId: "dad-3", inc: 5,
    q: "O ato administrativo pode ser anulado por ilegalidade ou revogado por conveniência e oportunidade.",
    a: "Anulação = vício de legalidade (efeito ex tunc). Revogação = mérito administrativo, conveniência/oportunidade (efeito ex nunc). Súmula 473 do STF.",
    expl: "A banca inverte os conceitos ou os efeitos. Anulação atinge ato ilegal; revogação, ato válido mas inoportuno.",
    points: ["Anulação: ilegalidade, ex tunc", "Revogação: conveniência/oportunidade, ex nunc", "Súmula 473/STF"],
    wrong: "A revogação do ato administrativo produz efeitos retroativos (ex tunc), alcançando seus efeitos passados.",
  },
  {
    id: "dad2", subjectId: "dad", topicId: "dad-1", inc: 5,
    q: "O princípio da impessoalidade veda a promoção pessoal do agente em atos e publicidades oficiais.",
    a: "A impessoalidade tem dupla face: atuação sem favoritismo/perseguição e vedação à promoção pessoal (art. 37, §1º).",
    expl: "Cobra-se o art. 37, §1º: publicidade de atos não pode ter nomes/símbolos que caracterizem promoção pessoal.",
    points: ["Impessoalidade = sem favoritismo nem promoção pessoal", "Art. 37, §1º: publicidade impessoal", "LIMPE: legalidade, impessoalidade, moralidade, publicidade, eficiência"],
    wrong: "O princípio da moralidade exige que a administração atue de forma impessoal, sem qualquer distinção entre os administrados.",
  },
  {
    id: "dad3", subjectId: "dad", topicId: "dad-5", inc: 4,
    q: "A Lei 14.133/2021 (Nova Lei de Licitações) prevê a dispensa e a inexigibilidade como hipóteses de contratação direta.",
    a: "Contratação direta ocorre por licitação dispensada, dispensável ou inexigível. Inexigibilidade = inviabilidade de competição (art. 74).",
    expl: "A banca distingue dispensa (rol taxativo, competição possível) de inexigibilidade (competição inviável).",
    points: ["Inexigibilidade: inviabilidade de competição", "Dispensa: hipóteses taxativas da lei", "Lei 14.133/2021 substituiu a 8.666/93"],
    wrong: "A inexigibilidade de licitação ocorre quando há possibilidade de competição, mas a lei autoriza a dispensa do certame.",
  },
];

/* ---------- metadados de formato ---------- */
export const MODE_META = {
  flashcards: { label: "Flashcards", desc: "Pergunta/resposta para memorização ativa, com avaliação de domínio." },
  quiz: { label: "Questões C/E", desc: "Itens Certo/Errado no estilo Cebraspe, com gabarito comentado." },
  resumo: { label: "Resumo", desc: "Pontos-chave priorizados por incidência + a pegadinha da banca." },
} as const;

export const topicLabel = (id: string | undefined): string => {
  if (!id) return "Geral";
  const map: Record<string, string> = {};
  const T: Record<string, string[]> = {
    por: ["Compreensão e interpretação", "Coesão e coerência", "Ortografia", "Acentuação", "Classes de palavras", "Concordância", "Regência", "Crase", "Pontuação", "Sintaxe", "Semântica", "Redação oficial"],
    rlm: ["Proposições", "Tabela-verdade", "Equivalências e negações", "Argumentos", "Lógica de 1ª ordem", "Análise combinatória", "Probabilidade", "Sequências"],
    inf: ["Internet e intranet", "Navegadores", "Correio eletrônico", "Segurança da informação", "Malwares", "Backup", "Sistemas operacionais", "Pacote de escritório"],
    dcn: ["Princípios fundamentais", "Direitos fundamentais", "Direitos sociais", "Nacionalidade", "Organização do Estado", "Administração pública", "Poder Legislativo", "Poder Executivo", "Poder Judiciário", "Segurança pública"],
    dad: ["Princípios da administração", "Organização administrativa", "Atos administrativos", "Poderes administrativos", "Licitações", "Servidores públicos", "Responsabilidade do Estado", "Improbidade", "Controle da administração"],
  };
  const [sub, n] = id.split("-");
  const arr = T[sub];
  const idx = parseInt(n, 10) - 1;
  return arr && arr[idx] ? arr[idx] : map[id] ?? id;
};

/* ---------- seletores ---------- */
export const filterItems = (subjectId: string, topic?: string): AiItem[] =>
  AI_BANK.filter((i) => i.subjectId === subjectId && (!topic || i.topicId === topic));

/* ---------- módulo 09 · Materiais ---------- */
export const ytSearch = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const VIDEO_CHANNELS = [
  { subjectId: "por", channel: "Professor Noslen", url: "https://www.youtube.com/results?search_query=professor+noslen" },
  { subjectId: "rlm", channel: "Matemática pra Passar", url: "https://www.youtube.com/results?search_query=raciocinio+logico+concurso" },
  { subjectId: "inf", channel: "Informática p/ Concursos", url: "https://www.youtube.com/results?search_query=informatica+para+concursos" },
  { subjectId: "dcn", channel: "Direito Constitucional", url: "https://www.youtube.com/results?search_query=direito+constitucional+concurso" },
  { subjectId: "dad", channel: "Direito Administrativo", url: "https://www.youtube.com/results?search_query=direito+administrativo+concurso" },
];

export const QUESTION_SITES = [
  { name: "Questionei", url: "https://questionei.com/", tag: "Grátis" },
  { name: "PCI Concursos", url: "https://www.pciconcursos.com.br/provas/", tag: "Provas + Gabaritos" },
  { name: "Estude Grátis", url: "https://www.estudegratis.com.br", tag: "Grátis" },
  { name: "Gran Cursos Questões", url: "https://questoes.grancursosonline.com.br/", tag: "Freemium" },
  { name: "TEC Concursos", url: "https://www.tecconcursos.com.br", tag: "Freemium" },
  { name: "Qconcursos", url: "https://www.qconcursos.com", tag: "Freemium" },
];
