/* ============================================================
   Base calibrada A90 — conteúdo autoral com incidência (1–5)
   em provas estilo Cebraspe. Alimenta o motor local e serve de
   "ground truth" nos prompts enviados ao provedor de IA.
   ============================================================ */

export type AiMode = "flashcards" | "quiz" | "resumo";

export interface Subject {
  id: string;
  name: string;
  short: string;
  color: string;
}

export interface AiItem {
  id: string;
  subjectId: string;
  topic: string;
  q: string; // pergunta do flashcard
  a: string; // resposta do flashcard
  ce: string; // assertiva Certo/Errado
  ceTrue: boolean; // gabarito da assertiva
  expl: string; // explicação
  wrong: string; // pegadinha clássica
  points: string[]; // bullets do resumo
  inc: number; // incidência 1–5
}

export const SUBJECTS: Subject[] = [
  { id: "por", name: "Português", short: "PT", color: "#5cb3ff" },
  { id: "rlm", name: "Raciocínio Lógico", short: "RLM", color: "#f5b84b" },
  { id: "inf", name: "Informática", short: "INFO", color: "#c9a2ff" },
  { id: "dcn", name: "Direito Constitucional", short: "DC", color: "#38ff8a" },
  { id: "dad", name: "Direito Administrativo", short: "DA", color: "#f0655f" },
];

export const AI_BANK: AiItem[] = [
  /* ---------- PORTUGUÊS ---------- */
  {
    id: "por-1", subjectId: "por", topic: "Crase", inc: 5,
    q: "Quando a crase é obrigatória e quando é proibida?",
    a: "Obrigatória antes de palavra feminina que admita artigo, quando o termo regente exige a preposição 'a' (ex.: 'fui à delegacia'). Proibida antes de palavra masculina ('a pé', 'a prazo') e antes de verbo.",
    ce: "Em 'O candidato foi a pé até o local de prova', o acento grave é obrigatório.",
    ceTrue: false,
    expl: "'Pé' é palavra masculina — antes de masculino não há crase. O 'a' é apenas preposição.",
    wrong: "A banca troca o contexto e coloca 'à pé' ou 'à prazo' para você marcar certo pela sonoridade.",
    points: [
      "Crase = fusão da preposição 'a' + artigo 'a'.",
      "Obrigatória: 'à + substantivo feminino determinado' (à prova, à noite, à delegacia).",
      "Proibida: antes de masculino, verbo, pronome indefinido e 'a' no singular + palavra no plural.",
    ],
  },
  {
    id: "por-2", subjectId: "por", topic: "Pontuação", inc: 5,
    q: "Pode-se usar vírgula entre sujeito e verbo?",
    a: "Não. É vedado separar com vírgula o sujeito do predicado, o verbo de seus complementos e o nome de seus complementos — mesmo que a ordem direta seja alterada por adjuntos longos.",
    ce: "Na frase 'Os candidatos que estudaram com constância, foram aprovados', a vírgula está empregada corretamente.",
    ceTrue: false,
    expl: "A vírgula separa o sujeito ('Os candidatos que estudaram com constância') do verbo ('foram') — uso incorreto.",
    wrong: "Inserir adjunto longo no meio para camuflar a separação entre sujeito e verbo.",
    points: [
      "Ordem direta: sujeito + verbo + complementos — sem vírgulas entre eles.",
      "Adjunto adverbial deslocado: vírgula facultativa se curto, recomendada se longo.",
      "Oração subordinada adjetiva explicativa sempre vem entre vírgulas; a restritiva, nunca.",
    ],
  },
  {
    id: "por-3", subjectId: "por", topic: "Concordância verbal", inc: 4,
    q: "Como concordam os verbos 'haver' e 'fazer' impessoais?",
    a: "'Haver' no sentido de existir e 'fazer' indicando tempo ficam na 3ª pessoa do singular: 'Havia muitos candidatos' (nunca 'haviam'), 'Faz dez anos' (nunca 'fazem').",
    ce: "A forma 'Haviam muitas questões de lógica na prova' está correta segundo a norma-padrão.",
    ceTrue: false,
    expl: "'Haver' = existir é impessoal: sempre 3ª pessoa do singular → 'Havia muitas questões'.",
    wrong: "Usar 'haviam' quando o substantivo seguinte está no plural, por atração.",
    points: [
      "'Haver' (existir/ocorrer) e 'fazer' (tempo) = impessoais, 3ª pessoa do singular.",
      "O auxiliar herda a impessoalidade: 'deve haver', 'vai fazer dois anos'.",
      "'Existir' NÃO é impessoal: 'Existiam muitas questões' — concorda normalmente.",
    ],
  },
  {
    id: "por-4", subjectId: "por", topic: "Regência e pronomes", inc: 3,
    q: "Qual a regência de 'assistir' no sentido de ver?",
    a: "'Assistir' (ver/presenciar) é transitivo indireto: 'assistir AO filme'. Já 'visar' (objetivar) rege 'a': 'visar AO cargo'. 'Implicar' (acarretar) é direto: 'implicou mudanças'.",
    ce: "Em 'O candidato assistiu ao vídeo da aula inaugural', a regência está correta.",
    ceTrue: true,
    expl: "'Assistir' no sentido de ver exige preposição 'a': assistir AO vídeo.",
    wrong: "Marcar errado por hipercorreção — muita gente acredita que 'assistir o vídeo' é o certo.",
    points: [
      "Assistir (ver) → VTI: assistir a algo. Assistir (ajudar) → VTD.",
      "Visar (objetivar) → VTI: visar a algo. Visar (assinar) → VTD.",
      "Implicar (acarretar) → VTD, sem preposição: 'implicou cortes'.",
    ],
  },

  /* ---------- RACIOCÍNIO LÓGICO ---------- */
  {
    id: "rlm-1", subjectId: "rlm", topic: "Proposições e conectivos", inc: 5,
    q: "Quando a conjunção 'e' é verdadeira? E a disjunção 'ou'?",
    a: "'A ∧ B' só é verdadeira quando ambas são verdadeiras. 'A ∨ B' só é falsa quando ambas são falsas. Na condicional 'A → B', só há falsidade quando A é V e B é F (V→F = F).",
    ce: "A proposição composta '2 é par e 3 é ímpar' é verdadeira.",
    ceTrue: true,
    expl: "Ambas as componentes são verdadeiras, logo a conjunção é verdadeira.",
    wrong: "Confundir com a condicional: muitos acham que 'e' se comporta como 'se... então'.",
    points: [
      "∧ (e): V apenas se tudo V. ∨ (ou): F apenas se tudo F.",
      "→ (se...então): F apenas no caso V→F. ↔ : V quando valores iguais.",
      "A única linha falsa da condicional é antecedente V e consequente F.",
    ],
  },
  {
    id: "rlm-2", subjectId: "rlm", topic: "Equivalências e negações", inc: 5,
    q: "Qual a negação de 'Se chove, então levo o guarda-chuva'?",
    a: "A negação de A → B é 'A ∧ ¬B': 'Chove e não levo o guarda-chuva'. Nunca se nega condicional com outra condicional.",
    ce: "A negação de 'Se estudo, então passo' é 'Se não estudo, então não passo'.",
    ceTrue: false,
    expl: "Isso é a inversão (¬A → ¬B), que NÃO é a negação. A negação correta é 'Estudo e não passo'.",
    wrong: "Apresentar a contrapositiva ou a inversão como se fossem a negação — pegadinha clássica Cebraspe.",
    points: [
      "Negação de A → B = A ∧ ¬B.",
      "Equivalência de A → B = ¬A ∨ B = ¬B → ¬A (contrapositiva).",
      "Negação de ∀x P(x) = ∃x ¬P(x) — e vice-versa.",
    ],
  },
  {
    id: "rlm-3", subjectId: "rlm", topic: "Lógica de argumentação", inc: 4,
    q: "O que torna um argumento dedutivo válido?",
    a: "Validade: se as premissas são verdadeiras, a conclusão necessariamente também é. Não depende do conteúdo, mas da forma. Argumento com premissas verdadeiras e conclusão verdadeira ainda pode ser INVÁLIDO se a forma falhar.",
    ce: "Um argumento válido cujas premissas são verdadeiras pode ter conclusão falsa.",
    ceTrue: false,
    expl: "Essa é exatamente a definição de validade: premissas V + forma válida ⇒ conclusão necessariamente V.",
    wrong: "Confundir validade (forma) com verdade (conteúdo) — a banca mistura os conceitos.",
    points: [
      "Válido = impossível premissas V e conclusão F.",
      "Sólido = válido + premissas de fato verdadeiras.",
      "Falácia formal comum: afirmar o consequente (A→B, B ∴ A) — inválido.",
    ],
  },
  {
    id: "rlm-4", subjectId: "rlm", topic: "Análise combinatória", inc: 4,
    q: "Quando usar arranjo e quando usar combinação?",
    a: "A ordem dos elementos importa → arranjo: A(n,p) = n!/(n−p)!. A ordem não importa → combinação: C(n,p) = n!/[p!(n−p)!].",
    ce: "O número de comissões de 3 pessoas escolhidas entre 10 é calculado por combinação, pois a ordem de escolha não importa.",
    ceTrue: true,
    expl: "Comissão {A,B,C} é a mesma que {C,B,A} — ordem irrelevante ⇒ C(10,3) = 120.",
    wrong: "Usar arranjo em comissões/equipes, multiplicando o resultado por 3!.",
    points: [
      "Ordem importa (funções, pódios, senhas) → arranjo.",
      "Ordem não importa (comissões, grupos, sorteios) → combinação.",
      "C(n,p) = A(n,p) ÷ p! — a diferença é exatamente a permutação interna.",
    ],
  },

  /* ---------- INFORMÁTICA ---------- */
  {
    id: "inf-1", subjectId: "inf", topic: "Segurança: malware e phishing", inc: 5,
    q: "Qual a diferença entre vírus, worm e cavalo de Troia?",
    a: "Vírus precisa de um arquivo hospedeiro e da ação do usuário para se propagar. Worm se replica sozinho pela rede, sem hospedeiro. Cavalo de Troia (trojan) se disfarça de programa legítimo e não se replica.",
    ce: "Um worm necessita de um arquivo executável hospedeiro para se propagar entre computadores.",
    ceTrue: false,
    expl: "Quem precisa de hospedeiro é o vírus. O worm se propaga autonomamente explorando a rede.",
    wrong: "Inverter os conceitos de vírus e worm — a banca ama essa troca.",
    points: [
      "Vírus: parasita de arquivo, depende de execução. Worm: autônomo, rede.",
      "Trojan: disfarce, não se replica; abre portas (backdoor).",
      "Phishing: engenharia social por e-mail/site falso para roubar credenciais.",
    ],
  },
  {
    id: "inf-2", subjectId: "inf", topic: "Planilhas (fórmulas)", inc: 4,
    q: "O que fazem SOMA, MÉDIA, SE e PROCV no Excel/Calc?",
    a: "SOMA(A1:A10) totaliza o intervalo. MÉDIA calcula a média aritmética. SE(condição; valor_V; valor_F) testa uma condição. PROCV(valor; matriz; nº_coluna; 0) busca um valor na primeira coluna e retorna dado de outra coluna (0 = exato).",
    ce: "A função PROCV permite localizar um valor na primeira coluna de uma tabela e retornar um dado correspondente de outra coluna.",
    ceTrue: true,
    expl: "Essa é a definição exata da busca vertical (PROCV/VLOOKUP).",
    wrong: "Dizer que PROCV busca em qualquer coluna — ela só busca na primeira coluna da matriz.",
    points: [
      "Intervalos com ':' (A1:A10); argumentos separados por ';' no Excel pt-BR.",
      "SE aninhado permite múltiplas condições; hoje prefere-se SES (IFS).",
      "Referência absoluta com '$' (trava linha/coluna ao arrastar).",
    ],
  },
  {
    id: "inf-3", subjectId: "inf", topic: "Nuvem e backup", inc: 3,
    q: "O que diferencia SaaS, PaaS e IaaS?",
    a: "IaaS: infraestrutura (servidores, rede) — ex.: AWS EC2. PaaS: plataforma para desenvolver — ex.: App Engine. SaaS: software pronto para uso — ex.: Gmail, Office 365. Quanto mais alto na pilha, menos o usuário gerencia.",
    ce: "No modelo SaaS, o usuário final gerencia o sistema operacional e a infraestrutura subjacente da aplicação.",
    ceTrue: false,
    expl: "No SaaS o provedor gerencia tudo; o usuário apenas consome o software. Gerenciar infra é papel do modelo IaaS.",
    wrong: "Afirmar que 'na nuvem o usuário sempre controla o SO' — só vale para IaaS.",
    points: [
      "IaaS → você gerencia SO e apps. PaaS → você gerencia só apps. SaaS → nada.",
      "Backup 3-2-1: 3 cópias, 2 mídias diferentes, 1 fora do local.",
      "Nuvem pública × privada × híbrida refere-se a quem opera a infraestrutura.",
    ],
  },
  {
    id: "inf-4", subjectId: "inf", topic: "Atalhos e sistemas", inc: 3,
    q: "Quais atalhos de teclado são mais cobrados em prova?",
    a: "Ctrl+C/V/X (copiar/colar/recortar), Ctrl+Z (desfazer), Ctrl+A (selecionar tudo), Ctrl+F (localizar), Alt+Tab (alternar janelas), Win+L (bloquear), Ctrl+Shift+Esc (Gerenciador de Tarefas direto).",
    ce: "No Windows, o atalho Win+L bloqueia a estação de trabalho imediatamente.",
    ceTrue: true,
    expl: "Win+L = lock (bloquear sessão). Muito cobrado em questões de segurança do usuário.",
    wrong: "Confundir Win+L com Ctrl+Alt+Del (que abre a tela de segurança, não bloqueia direto).",
    points: [
      "Win+L bloqueia; Ctrl+Alt+Del abre opções de segurança.",
      "Ctrl+Shift+Esc abre o Gerenciador de Tarefas sem tela intermediária.",
      "Navegadores: Ctrl+T (nova aba), Ctrl+W (fechar aba), Ctrl+Shift+T (reabrir).",
    ],
  },

  /* ---------- DIREITO CONSTITUCIONAL ---------- */
  {
    id: "dcn-1", subjectId: "dcn", topic: "Direitos fundamentais (art. 5º)", inc: 5,
    q: "Quais são as características dos direitos e garantias fundamentais?",
    a: "São universais, irrenunciáveis, inalienáveis, imprescritíveis, relativos (não absolutos) e de aplicabilidade imediata (§1º do art. 5º). Podem colidir entre si, resolvida por ponderação.",
    ce: "Os direitos e garantias fundamentais previstos na CF/88 têm aplicabilidade imediata.",
    ceTrue: true,
    expl: "Art. 5º, §1º, CF/88: 'As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata'.",
    wrong: "Afirmar que dependem todos de regulamentação para valer — o §1º diz o contrário (embora haja normas de eficácia limitada).",
    points: [
      "Art. 5º, §1º: aplicação imediata das normas de direitos fundamentais.",
      "Relatividade: nenhum direito é absoluto (nem a vida, ex.: guerra declarada).",
      "Habeas corpus e habeas data são gratuitos; mandado de segurança protege direito líquido e certo.",
    ],
  },
  {
    id: "dcn-2", subjectId: "dcn", topic: "Separação de Poderes", inc: 5,
    q: "A separação de Poderes pode ser abolida por emenda?",
    a: "Não. É cláusula pétrea (art. 60, §4º, III). O sistema adota freios e contrapesos: o Legislativo julga o Presidente por crime de responsabilidade, o Judiciário controla a constitucionalidade, o Executivo veta e nomeia ministros.",
    ce: "Proposta de emenda tendente a abolir a separação dos Poderes não pode ser objeto de deliberação.",
    ceTrue: true,
    expl: "Art. 60, §4º, III, CF/88 — cláusula pétrea. A PEC seria rejeitada liminarmente.",
    wrong: "Dizer que cláusulas pétreas não podem ser 'modificadas' — podem ser aprimoradas, desde que não tendam a abolir.",
    points: [
      "Cláusulas pétreas: forma federativa, voto direto/secreto/universal/periódico, separação de Poderes, direitos e garantias individuais.",
      "Sistema de freios e contrapesos (checks and balances).",
      "Judiciário: função atípica de administrar e legislar (regimentos internos).",
    ],
  },
  {
    id: "dcn-3", subjectId: "dcn", topic: "Remédios constitucionais", inc: 4,
    q: "Para que serve cada remédio constitucional?",
    a: "Habeas corpus: liberdade de locomoção. Habeas data: acesso/retificação de dados pessoais. Mandado de segurança: direito líquido e certo. Mandado de injunção: norma regulamentadora faltante. Ação popular: moralidade administrativa (qualquer cidadão).",
    ce: "O habeas data é o remédio adequado para proteger a liberdade de locomoção ameaçada por ilegalidade.",
    ceTrue: false,
    expl: "Liberdade de locomoção é protegida por habeas corpus. Habeas data trata de dados pessoais em registros públicos.",
    wrong: "Trocar os objetos dos remédios — a banca embaralha HC, HD e MS na mesma questão.",
    points: [
      "HC (locomoção) e HD (dados) são gratuitos e podem ser impetrados por qualquer pessoa.",
      "MS exige direito líquido e certo, não amparado por HC nem HD.",
      "Ação popular: legitimidade de qualquer CIDADÃO (não de pessoa jurídica).",
    ],
  },

  /* ---------- DIREITO ADMINISTRATIVO ---------- */
  {
    id: "dad-1", subjectId: "dad", topic: "Atos administrativos", inc: 5,
    q: "Quais são os atributos e elementos do ato administrativo?",
    a: "Atributos (PAT): presunção de legitimidade/veracidade, autoexecutoriedade e tipicidade — mais a imperatividade. Elementos/requisitos (COMIFIFO): competência, finalidade, forma, motivo e objeto.",
    ce: "A presunção de legitimidade é atributo que inverte o ônus da prova, cabendo ao particular demonstrar a ilegitimidade do ato.",
    ceTrue: true,
    expl: "O ato presume-se legítimo até prova em contrário — presunção relativa (juris tantum).",
    wrong: "Tratar a presunção como absoluta (jure et de jure) — ela admite prova em contrário.",
    points: [
      "Atributos: presunção de legitimidade, imperatividade, autoexecutoriedade, tipicidade.",
      "Anulação = vício de legalidade (efeito ex tunc); revogação = mérito/conveniência (efeito ex nunc).",
      "Atributos não se confundem com elementos (competência, finalidade, forma, motivo, objeto).",
    ],
  },
  {
    id: "dad-2", subjectId: "dad", topic: "Licitações (Lei 14.133/21)", inc: 5,
    q: "Quais são as modalidades de licitação na Lei 14.133/2021?",
    a: "Pregão, concorrência, concurso, leilão e diálogo competitivo. A lei extinguiu tomada de preços e convite (da antiga 8.666/93) e o RDC. Pregão é obrigatório para bens e serviços comuns.",
    ce: "A Lei 14.133/2021 prevê como modalidades de licitação o pregão, a concorrência, o concurso, o leilão e o diálogo competitivo.",
    ceTrue: true,
    expl: "Art. 28 da Lei 14.133/21 — são exatamente essas cinco modalidades.",
    wrong: "Incluir 'tomada de preços' ou 'convite' na lista — modalidades extintas.",
    points: [
      "5 modalidades: pregão, concorrência, concurso, leilão, diálogo competitivo.",
      "Pregão: bens/serviços comuns, sempre menor preço ou maior desconto.",
      "Extintas: convite, tomada de preços, RDC.",
    ],
  },
  {
    id: "dad-3", subjectId: "dad", topic: "Improbidade (Lei 8.429/92)", inc: 4,
    q: "A improbidade administrativa admite modalidade culposa?",
    a: "Não. Após a Lei 14.230/2021, exige-se DOLO específico para todas as condutas de improbidade (arts. 9, 10 e 11). A mera culpa não configura improbidade, sem prejuízo de outras responsabilidades.",
    ce: "Após a Lei 14.230/2021, a improbidade por dano ao erário (art. 10) admite punição na modalidade culposa.",
    ceTrue: false,
    expl: "A reforma de 2021 eliminou a modalidade culposa: todas as hipóteses exigem dolo específico.",
    wrong: "Aplicar a redação antiga da lei, que previa culpa no art. 10 — pegadinha temporal clássica.",
    points: [
      "Lei 14.230/21: apenas DOLO específico; culpa não basta.",
      "Retroatividade da lei mais benéfica alcança atos anteriores (STF, Tema 1.199).",
      "Sanções: perda da função, suspensão de direitos políticos, multa, proibição de contratar.",
    ],
  },
];

/* ---------- seletores da base calibrada ---------- */

export const filterItems = (subjectId: string, topic?: string): AiItem[] =>
  AI_BANK.filter((i) => i.subjectId === subjectId && (!topic || i.topic === topic))
    .sort((a, b) => b.inc - a.inc);

export const topicsOf = (subjectId: string): string[] =>
  [...new Set(AI_BANK.filter((i) => i.subjectId === subjectId).map((i) => i.topic))];

export const MODE_META: Record<AiMode, { label: string; desc: string }> = {
  flashcards: { label: "Flashcards", desc: "10 cards de memorização ativa, priorizados por incidência." },
  quiz: { label: "Questões C/E", desc: "8 assertivas estilo Cebraspe com gabarito comentado." },
  resumo: { label: "Resumo estratégico", desc: "Síntese por tópico com pegadinhas sinalizadas." },
};
