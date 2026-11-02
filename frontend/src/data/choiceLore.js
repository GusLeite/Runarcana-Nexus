// Textos e símbolos de apoio das Escolhas: gemas do Pulso Rúnico, silhuetas de tamanho e resumos dos ofícios.

// Pulso Rúnico (Natureza Rúnica): cor, símbolo (viewBox 100×100), papel e efeito de cada gema.
export const GEMS = {
  Esmeralda: {
    color: '#3fcf8e', role: 'Sentinela', blurb: 'Escolha um dano físico e um elemental: o resultado do Dado de Pulso reduz o dano desses tipos. A partir do 11º nível vale também contra dano mágico.', effect: 'Redução de dano',
    sigil: ['M32 12H68L88 32V68L68 88H32L12 68V32Z','M38 26H62L74 38V62L62 74H38L26 62V38Z']
  },
  Rubi: {
    color: '#ee5a70', role: 'Conquistador', blurb: 'Escolha um tipo de dano: uma vez por turno, some o Dado de Pulso a esse dano (o crítico multiplica). A partir do 11º nível vale também para dano mágico.', effect: 'Amplificação de dano',
    sigil: ['M30 14H70Q86 14 86 30V70Q86 86 70 86H30Q14 86 14 70V30Q14 14 30 14Z','M50 28 72 50 50 72 28 50Z','M50 28V14M50 72V86M28 50H14M72 50H86']
  },
  Diamante: {
    color: '#9ad8ff', role: 'Protetor', blurb: 'Some o Dado de Pulso às curas que fizer em outros ou, uma vez por turno, a uma cura que receber. Não vale para PV temporários.', effect: 'Amplificação de cura',
    sigil: ['M26 16H74L94 40 50 90 6 40Z','M6 40H94','M26 16 36 40 50 16 64 40 74 16','M36 40 50 90 64 40']
  },
  Ametista: {
    color: '#b184ee', role: 'Vampírico', blurb: 'Ao abater um alvo ferido por você, recupera Vida, Mana ou Ki (à sua escolha) com base no Dado de Pulso.', effect: 'Recuperação',
    sigil: ['M50 8 74 28V72L50 92 26 72V28Z','M26 28 50 44 74 28','M50 44V92']
  },
  Safira: {
    color: '#5b97f5', role: 'Crepuscular', blurb: 'O resultado vira pontos de Pulso: gaste para somar a uma rolagem sua, ou reduzir a de um inimigo ou somar à de um aliado.', effect: 'Versatilidade',
    sigil: ['M50 8C72 8 82 28 82 50S72 92 50 92 18 72 18 50 28 8 50 8Z','M50 28C60 28 66 38 66 50S60 72 50 72 34 62 34 50 40 28 50 28Z','M50 8V28M50 72V92']
  }
}

export const gemOf = name => GEMS[name] ?? null

// Silhuetas para a escolha de tamanho: `h` é a altura relativa (Yordle ~80 cm, pessoa ~1,7 m).
export const SIZE_FIGURES = {
  SMALL: {
    title: 'Yordle', hint: 'Até cerca de 1 m', h: 0.62,
    // cabeça grande, orelhas pontudas, corpo curto
    sigil: ['M50 44a18 18 0 1 0 .01 0', 'M34 34 22 12 40 24M66 34 78 12 60 24', 'M34 68H66L72 90H28Z', 'M28 70 18 82M72 70 82 82']
  },
  MEDIUM: {
    title: 'Humanoide', hint: 'Cerca de 1,5 a 2 m', h: 1,
    sigil: ['M50 12a11 11 0 1 0 .01 0', 'M34 46C34 36 66 36 66 46V70H34Z', 'M34 70 30 94M66 70 70 94', 'M34 48 22 70M66 48 78 70']
  }
}

// Resumo de cada ofício (por id do catálogo); as fórmulas de exemplo vêm de /crafts/formulas.
export const CRAFT_BLURBS = {
  alquimista: 'Transmuta substâncias: ácidos, elixires, explosivos e outras misturas de efeito alquímico.',
  apotecario: 'Prepara remédios, antídotos, venenos e unguentos a partir de ervas e ingredientes naturais.',
  armadilheiro: 'Projeta, monta e desarma armadilhas, de simples laços a mecanismos elaborados.',
  armeiro: 'Forja e conserta armas de metal, de lâminas a armas de haste.',
  armoreiro: 'Forja, ajusta e repara armaduras e escudos.',
  arqueirista: 'Constrói arcos, bestas, flechas e virotes, e cuida da munição à distância.',
  chaveiro: 'Fabrica fechaduras, cadeados e chaves; também sabe como abri-los sem a chave.',
  cozinheiro: 'Transforma ingredientes em refeições que alimentam, animam e podem dar benefícios.',
  cuteleiro: 'Faz facas, adagas e lâminas pequenas, e afia o que estiver cego.',
  encantador: 'Imbui objetos com magia, gravando encantamentos em armas, joias e utensílios.',
  encarrocador: 'Constrói e conserta carroças, carruagens e veículos de tração.',
  fermentador: 'Produz bebidas fermentadas e destiladas, de cervejas a licores.',
  joalheiro: 'Lapida gemas e trabalha metais preciosos em joias e adornos.',
  modista: 'Costura, tinge e confecciona roupas, tecidos e acessórios.',
  pedreiro: 'Trabalha pedra e alvenaria: muros, fortificações e estruturas duráveis.',
  tecmaturgo: 'Combina tecnologia e magia, criando engenhos movidos a energia e mana.',
  artesanato: 'Ofícios manuais variados: carpintaria, escultura, cerâmica, vidraria e afins.',
  artista: 'Expressão artística: pintura, música, atuação e outras artes.',
  coletor: 'Reconhece e colhe ervas, minérios e materiais úteis na natureza.',
  falsificador: 'Imita documentos, assinaturas, selos e obras com alto grau de fidelidade.',
  guia: 'Orienta viagens: leitura de mapas, rotas, acampamentos e sobrevivência.',
  jogador: 'Domina jogos de azar e de estratégia, e sabe ler quem está à mesa.'
}
