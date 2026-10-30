# Mapeamento: o que está só no texto

Levantamento de 2026-10-29: cada Herança (205), Aprimoramento (99), recurso de classe (397), origem/linhagem, classe/subclasse, passado e traço da Runinata, comparando o texto do livro com as concessões dos JSON em `src/main/resources/rules/`.

Para que serve: decidir de uma vez o que entra no sistema e o que fica com o mestre, e implementar **por bloco** (um commit por bloco). Cada bloco termina com os itens dele marcados aqui. Quando um bloco é feito, a linha dele ganha ✅; o que você decidir deixar de fora ganha ✖ (fica com o mestre, de propósito).

Legenda dos blocos:
- **A**: dá para fazer só com dados (o sistema já tem o tipo de concessão).
- **B**: precisa de algo pequeno e novo no sistema.
- **C**: precisa de um sistema novo de verdade.
- **M**: fica com o mestre (situacional, narrativo ou ativo com duração; a habilidade já mostra o texto e os usos).

---

## A. Só dados (o sistema já sabe fazer)

### A1. Erros nos dados (corrigir primeiro) ✅
- **Força Pneumática**: a descrição traz junto o texto da Herança **Força Predatória**, e a concessão dela (Sobrevivência) foi aplicada na Força Pneumática.
- **Inventor Renomado**: tem a nota situacional, mas falta a proficiência em Tecnologia ("caso já tenha, especialidade").
- **Acólito Arcanista**: falta a proficiência em Arcanismo.
- **Prestidigitador**: falta a proficiência em Prestidigitação.
- **Piromaníaco**: falta o Mistério do Fogo.
- **Atento** (Aprimoramento): falta o +1 na Percepção passiva.
- **Perspicaz** (Aprimoramento): falta o +5 na Percepção passiva.
- **Treinamento Demaciano**: faltam as proficiências (armas marciais corpo a corpo, escudos, armaduras leves e médias).
- **Lendário Guardião** (Combatente Guardião, 20º): falta Constituição +2 (máximo 22).

### A2. Proficiências e Mistérios fixos ou à escolha ✅
Princípio Elemental: elementos terciários e de transição pelo `tier` do catálogo de magia. O truque da Essência Elemental foi no A3. A Centelha Vesani já tinha a escolha. O Mestre Tático ignora o pré-requisito de classe/subclasse das Técnicas (`anyClass`). "Armas regionais" = as Impróprias do catálogo de itens.

- Ofícios: Mestre Artesão (ofício + especialidade), Artesão Nazumita (1 de 6, ou especialidade), Coletor Nazumita (Biologista e Curtidor), Tecnomaníaco e Musicista Prodígio (ou especialidade), Hospitaleiro (Cozinheiro), Pastor da Montanha (Guia-Piloto ou Apotecário), Acólito da Forja 2º (Coletor-Minerador).
- Armas: Armas Avançadas (a escolhida), Enxofre/Salitre/Carvão (arma de fogo), Estudioso de Armas (arma regional), Ferromante (marcial regional), Disciplina é Força (uma arma), Estudioso das Armas (4 armas), Variante Anfíbio e Estilo do Mar (rede, lança, tridente), Bélico (Runinata), Sutra Estrada do Ceifador, Mercurial Explorador 3º (bestas de repetição ou armas de fogo).
- Perícias: Habilidoso (3 entre perícia e ofício), Variante Nebulon (especialidade à escolha), Ascensão Ínfera (runa: 1 de 5), Líder da Ninhada (runa: Intimidação).
- Mistério à escolha: Acólito Arcanista, Filho da Escuridão (Sombrio ou Umbramancia), Meditação Profunda, Sangue Arcano, Aptidão Elemental, Talento Mágico Ioniano, Sangue Vastaya, Manifestação Primordial, Vislumbre Estelar, Presente Incandescente, Essência Elemental, Centelha Vesani (o 2º), Potência da Cura, Iniciado nos Mistérios (2), Arcanun, Assinatura Aprimorada.
- Recursos à escolha: Mestre Tático (Técnica de Combate), Fluência Espiritual (Grande Espírito), Desbravador do Ki (2 Sutras), Modularidade (Vantagem Tecnológica), Mais Inimigos (Inimigo Favorito).
- Atributo: Líder da Ninhada (runa: CON +2, máximo 22).

### A3. Magias fixas das Heranças ✅
Filho da Escuridão, Castelo de Areia e Dupliventos já tinham a magia como habilidade (não duplicadas). Shugenja: "a que tem acesso" virou os Mistérios Espirituais; o de 2º nível aceita também de 1º.

Viram a magia na ficha (concessão `SPELL`), com os usos que a Herança já tem: Convocar Auxílio (convocar familiar), Curandeiro Abençoado (palavra curativa), Filho da Escuridão (escuridão), Magia da Floresta (constrição), Medicina Natural (curar ferimentos), Sinergia Elemental (raio elemental), Autoridade Justa (taumaturgia), Sangue Buhru (chama sagrada), Toque Feérico (ilusão menor), Ladrão de Segredos (mensagem, zombaria viciosa), Arbusto Frutífero e Hospitaleiro (bom fruto), Sombra da Folha (passos sem pegadas), Conjurador Marai (criar ou destruir água), Proficiência Onírica (sono), Salva-IIP-guarda (bênção), Teleporte das Fadas (passo nebuloso), Truque da Maré (jato d'água), Encanto Vulpino (enfeitiçar pessoa), Extrovertido (reparar), Conhecimentos Venéficos (borrifo venenoso), Dupliventos (leque de vento), Castelo de Areia (aumentar/reduzir), Leveza das Nuvens (queda suave).
- À escolha: Benefício Colateral (truque), Musicista Prodígio (truque do Som), Incentivo Celeste (truque celestial), Conjurador Natural (magia de Xamã), Vislumbre Estelar (1º nível de Adivinhação/Oniromancia), Ritualista (ritual de 1º), Adepto e Iniciado Shugenja.

### A4. Defesas contra dano (resistência, vulnerabilidade, absorção, "caso já tenha, imunidade") ✅
Meio-Dragão: a "fraqueza" vale para o tipo simples e o mágico. Hakensai 15º/20º pelo Caminho Elemental escolhido (o 20º usa o mesmo tipo do 15º). Nascimento da Ninhada ganhou a escolha Aranha/Cobra; Cobra dá imunidade a venenoso (a imunidade da Aranha a Amedrontado é condição, bloco B2).

- Heranças: Pele Rígida (cortante/perfurante/contundente à escolha; caso já tenha, imunidade), Construção Primorosa (2ª resistência da lista do Brutal).
- Origens: Construto (venenoso), Brutal (o "Resistente" hoje é uma escolha sem efeito → resistência à escolha), Meio-Dragão (resistência e vulnerabilidade da linhagem; no 15º, a versão mágica), Yordle Aquático (contundente).
- Classes: Acólito da Forja (ígneo 5º, incinerante 10º, imunidade 15º), Sepultura (necrótico 2º, imune 11º; 20º imune necrótico e resistente a radiante), Tempestade (elétrico 2º, imune plásmico 17º), Arcanista Púrpura (venenoso), Caçador Arqueiro Rúnico 7º (psíquico), Mercurial Explorador 13º (venenoso).
- Runas: Força de Statikk (elétrico), Fúria de Statikk (plásmico).
- Runinata: Resistência Natural (à escolha), Construído (venenoso), Consistência Gelatinosa (físicos).

### A5. Notas situacionais (vantagens) ✅
O traço Habilidoso virou uma escolha de perícia (a nota vai nela); ofício não é alvo de nota, então vale só para perícias.

- Origens: Construto (desvantagem contra clima hostil), Emissário (vantagem contra clima), Aelus (iniciativa e Percepção contra surpresa), Alnuk (frio extremo), Arbóreo (movimento forçado), Chireano (audição), Nocti (desvantagem: luz forte, Intoxicado respiratório), Kiilash (Percepção por olfato/audição), Yordle Feérico (Enfeitiçado).
- Classes: Bruto 2º (salvaguarda de DES) e 7º (iniciativa), Caçador 1º (iniciativa) e 6º (salvaguardas contra Inimigos Favoritos), Arcanista Zhonya (iniciativa), Púrpura (venenos, controle mental, Percepção), Atirador 11º (Furtividade), Desperado 17º (iniciativa), Acólito da Forja (frio), Mercurial Explorador 13º (Envenenado/Intoxicado).
- Heranças: Valor da Justiceira (detectar mentiras), Quebra Gelo (ártico), Medicina Natural (aflições), Linhagem Vastaya (doença mágica), Caçador Nazumita (+1 CA e ataque contra a presa), Mestre de Vinhas (+1 com chicote de espinhos).
- Aprimoramentos: Ars Veneficius (Envenenado/Intoxicado), Empunhadura Dupla (+1 CA com duas armas).
- Runinata: Sentidos Aguçados e Habilidoso (Percepção / perícia escolhida).

### A6. CA, RD e deslocamento ✅
- Guerreiro Primal (CA 10 + CON sem armadura), Alnuk (RD de metade da proficiência; o tipo já existe, da Carapaça), Especialista em Armadura Pesada (+1 RD com pesada, como a média), Constituição Anfíbia (natação 35), Ascensão Feérica (runa: voo 30), Constituição Montanhosa (+metade da proficiência em PV por nível, como o Minotauro).

### A7. Opções que hoje não fazem nada ✅
Protetor (proficiências), Estudioso (duas perícias) e Obreiro (truque espiritual e +1 uso de Liturgia), pela opção.

- Chamado Sagrado (Acólito 2º): Protetor (armas marciais e armadura pesada) e Estudioso (2 perícias) viram efeito pela opção.

## B. Algo pequeno e novo no sistema

- ✅ **B1. Imunidade a dano fixa** (`IMMUNITY`, feito junto com o A4): Troll da Selva (venenoso), Vel Escamas do Dragão (ígneo e cortante), Precursor do Gelo Sombrio (gélido e ígneo), Nascimento da Ninhada (venenoso), Hakensai 20º, e as imunidades de classe listadas em A4.
- ✅ **B2. Imunidade a condições e doenças** (`CONDITION_IMMUNITY`; também Trolls da Areia/Gelo, Glacinata, Atirador 11º, Desperado 20º, sono mágico do Feérico/Linhagem Vastaya/Toque Feérico) (lista na ficha, como as de dano): Ressurgido Espectral, Limiar Tecnológico, Construto Vivo, Bodisatva 10º, Nascimento da Ninhada (Amedrontado), Essência Etílica (Intoxicado por álcool), Lendário Guardião, Experimento Zaunita (Cinza de Zaun).
- ✅ **B3. Resistência que muda com o nível** (`minLevel`; Runinata pela escolha "Resistência Natural". Venenoso, energético e os espirituais não têm versão mágica, então a Resistência Mágica não muda nada neles): Gás Corrosivo/Ionizado/Termiônico (outro tipo no 11º), Resistência Natural da Runinata (versão mágica no 12º, imunidade no 16º, absorção no 18º).
- ✅ **B4. "Um avanço na resistência"** (`RESISTANCE` com `expertise` e `amount: 1`) (degraus: resistência → imunidade → absorção): Bênção do Urso e do Vorme (Invocações).
- ✅ **B5. Especialidade em salvaguarda**: Graciosidade ("caso já tenha proficiência").
- ✅ **B6. Tamanho +1 categoria** (`SIZE` `UP` na 2ª escolha; o +1 de dano e o custo maior ficam no texto): Variante Colosso.
- ✅ **B7. RD contra um tipo de dano** (`DAMAGE_REDUCTION`; a do Domínio Azakana é temporária, durante a Ascensão Azakana, e ficou com o mestre): Variante Glacinata (gélido = proficiência), Adaptação Selvagem (ácido e ígneo), Ascensão Feérica (sombrio 2), Domínio Azakana (radiante 2).
- ✅ **B8. Ki e Energia extras** (`EXTRA_USES` no Ki; a Energia da Bioenergia e do Experimento Reconhecido já era contada nos usos da própria Herança, e a do Chireano na habilidade Energia): Cultivo de Ki, Conjurador Natural, Alianças Espirituais (Ki); Bioenergia, Experimento Reconhecido, Chireano (Energia).

## C. Sistema novo de verdade

- ✅ **C1. Sentidos** (`SENSE`: vale o maior alcance e cada fonte "ou +N" soma N; "debaixo d'água" é um sentido à parte; Bodisatva, Tecelã e Aspectos Ferais crescem pelo nível da classe. Ficam com o mestre: "visão no escuro dobrada" dos Aspectos Alados e as formas da Forma Selvagem (são formas), sentidos ativos com duração (Geolocalização, Visão Arcana, Controle Etéreo), a telepatia com o companheiro e o "+10 por maestria" dos Olhos do Caçador. A Visão Noturna para em 120 pela escolha máxima de 4) (visão no escuro, visão às cegas, sentido sísmico, telepatia), com "ou +N se já tiver": Yordle, Troll da Selva, Nocti, Força Predatória, Visão Treinada, Visão Lunar, Variante Anfíbio, Meio-Vastaya, Manifestação Primordial (Sombra), Perceptivo, Sutras noctígenos, Vel Furto Luminar e Yanlei, Invocações (Cervo, Marés, Aspecto Feral), Aspectos Alados, runas (Olhos do Caçador, Pacto Místico, Ninhada), Bodisatva 4º, Atirador 11º, Assassino 9º, Arcanista Púrpura, Runinata (Visão Noturna, Comunicação Telepática).
- ✅ **C2. Bônus no dano dos ataques** (`DAMAGE_BONUS`, somado no dano da ficha com nota; Detectar/Perceber Fraquezas ganharam a escolha, e a opção "no lugar da Força" fica no texto; Brutalizador (+1 categoria) e Selvageria Superior (usos por descanso) ficam com o mestre; também Colosso +1 corpo a corpo e Mãos de Ferro +1): Detectar/Perceber Fraquezas (metade de INT/SAB), Disciplina é Força (+proficiência com a arma), Fúria de Warmog (+proficiência em duas mãos), Briguento (+1d4 desarmado), Brutalizador (+1 categoria), Selvageria Superior.
- ✅ **C3. Níveis de ofício** (`CRAFT_LEVEL`/`CRAFT_FORMULAS`; Hábil ganhou a opção "+1 nível num Ofício Maior"; os limites de nível do ofício, disciplinas novas e o PO por dia ficam no texto): Minucioso, Operário e Privilegiado (+1 nível), Maestria (6º nível + especialidade + fórmulas), Praticante Dedicado (+1 nível, 5 fórmulas), Atirador 3º (Armeiro acima do limite).
- ✅ **C4. Troca de atributo** (`ATTRIBUTE_SWAP`, vale o maior; também a 2ª opção de Detectar/Perceber Fraquezas nos ataques. Ficam no texto: os truques do Ladrão de Segredos e o Encanto Vulpino, que trocam o atributo só de magias específicas): Comandante (FOR em Intimidação), Mente Intuitiva (INT/SAB em Investigação e Intuição), Resiliência Adaptativa (PV com metade da DES, CA com metade da CON), Acordes de Poder (CAR para conjurar).
- ✅ **C5. Formas temporárias** (`FORM`: Forma de Sho'Ma, uma por forma escolhida, com atributos, deslocamentos e tamanho lidos do texto de cada uma; Forma Dracônica no 8º, com +½ proficiência no atributo da essência, voo 60 (Nuvens 70) e tamanho +1. A ficha liga e desliga. Ficam no texto: armas naturais e efeitos das formas, os PV a mais da Constituição maior, a Forma Dracônica Aprimorada e a Forma Selvagem do Xamã, que troca a ficha inteira): Forma de Sho'Ma, Forma Dracônica (e o Aprimoramento dela), Forma Selvagem (já é texto da classe).
- ✅ **C6. Magia Inata e magia sempre preparada** (Magia Inata: escolhas da lista da origem que abrem no 1º, 5º, 11º e 17º; Acólito Arcanista: uma magia do Mistério escolhido a cada novo nível de magia, pela tabela de conjurador pleno; as escolhas que abrem depois aparecem na subida de nível. Ficam no texto: o atributo de conjuração da Magia Inata, o uso sem Mana e a Conjuração Inata da Runinata, combinada com o Mestre; nas escolhas de 2º e 3º nível também entram magias de nível menor): Magia Inata (tabela por nível e origem), Acólito Arcanista (magia sempre preparada ao ganhar nível de magia), Conjuração Inata da Runinata.

## M. Fica com o mestre (não precisa decidir item a item)

- Habilidades ativas com duração, reações e efeitos em área (a maioria das Iras, Sutras, Técnicas, Runas, Invocações e das partes ativas das Heranças): já são habilidades com tempo e usos.
- Efeitos contra um alvo específico (presa, Foco de Caça, criatura agarrada), margens e multiplicadores de crítico, ignorar RD/cobertura.
- ✅ Produção de ofício (`CRAFT_INCOME`/`CRAFT_MASTERWORK`): PO por dia a mais (Artífice, Operário, Coletivo Forte, Mestre Artesão, Forjador do Acólito da Forja) e margem de Obra-Prima (Artífice à escolha, Hospitaleiro no Cozinheiro), no cartão de Ofícios. Pertences e contatos ficam no texto.
- Terreno, clima e queda (neve, areia, saltos, terreno difícil).
- Idiomas (desligados por decisão sua).

## A conferir antes de implementar
- **Sinergia das Runas**: quando vale (Elegia: resistência a necrótico; Bênção do Vigia e Fôlego de Guerra: +nível em PV máximos)?
- **Bônus de Totem dos Grandes Espíritos**: é permanente ou só com o Totem? (resistência a contundente, RD igual à proficiência, iniciativa + proficiência, resistência a venenoso).
- **Dançarino**: "a perícia escolhida recebe seu bônus de proficiência" (é proficiência ou bônus extra?).
- **Hakensai 15º**: depende do elemento escolhido; conferir onde fica essa escolha.

## Ordem sugerida
1. A1 (erros) → 2. A2 + A3 (proficiências, Mistérios, magias) → 3. A4 + B1 (defesas) → 4. A5 + A6 + A7 → 5. B2–B8 → 6. C1 (sentidos, o maior) → 7. C2–C6, conforme você decidir.
