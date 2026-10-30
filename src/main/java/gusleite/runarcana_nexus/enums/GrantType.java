package gusleite.runarcana_nexus.enums;

// O que uma origem, classe, passado ou região concede na criação (e, nas classes, a cada nível).
// Os campos de cada tipo estão em docs/regras-criacao.md.
public enum GrantType {
    ATTRIBUTE,          // +amount no atributo fixo
    ATTRIBUTE_CHOICE,   // o jogador escolhe count atributos (de options) para +amount
    SKILL,              // proficiência fixa numa perícia
    SKILL_CHOICE,       // o jogador escolhe count perícias (de options; vazio = qualquer uma)
    SAVING_THROW,       // proficiência no teste de resistência do atributo
    FEATURE,            // passiva, habilidade ou magia (vira uma CharacterAbility)
    HP_BONUS,           // +amount de PV (perLevel = por nível)
    SPEED,              // +feet de deslocamento
    GOLD,               // +amount de ouro inicial
    SIZE,               // tamanho fixo (value = CreatureSize)
    SIZE_CHOICE,        // o jogador escolhe o tamanho (options = CreatureSize)
    CRAFT,              // proficiência fixa num ofício (value = id do ofício do catálogo)
    CRAFT_CHOICE,       // o jogador escolhe count ofícios (de options; vazio = todos do catálogo)
    LANGUAGE,           // idioma fixo (value = nome)
    LANGUAGE_CHOICE,    // o jogador escolhe count idiomas (de options ou, com fromRegion, da região escolhida)
    HERITAGE_POINTS,    // +amount pontos de Herança (value: REGION, ORIGIN ou ANY)
    PROFICIENCY_CHOICE, // count proficiências à escolha entre perícia, ofício e arma marcial (options = quais tipos valem)
    ARMOR_CLASS,        // opção de defesa (CA) com a fórmula em armor; com options (atributos), o jogador escolhe o atributo somado
    AC_BONUS,           // bônus de CA somado à opção usada (amount ou usesFormula PROFICIENCY; armor.unarmoredOnly/blocksArmor)
    EXPERTISE_CHOICE,   // especialidade em count perícias que o personagem já tem (de options; vazio = qualquer uma proficiente;
                        // value WITH_CRAFTS = também ofícios que ele tem, opções "SKILL:..." e "CRAFT:...")
    SAVING_THROW_CHOICE, // proficiência em count resistências à escolha (options = atributos)
    ARMOR_PROFICIENCY,  // proficiência com armaduras: value LIGHT, MEDIUM, HEAVY ou SHIELD
    WEAPON_PROFICIENCY, // proficiência com armas: value = o nome ("Armas simples", "Rapieiras")
    EQUIPMENT,          // equipamento inicial fixo: value = opção de itens do rules/itens.json ("escudo-leve+livro", ver EquipmentRules)
    EQUIPMENT_CHOICE,   // equipamento inicial à escolha: options = opções de itens ("group:arma-simples" vira uma por item), count
    MYSTERY,            // Mistério de magia fixo: value = id do Mistério (rules/magias.json). FEATURE com value MYSTERY: as opções
                        // escolhidas são Mistérios pelo nome ("Água (Elemental)" → agua)
    SPELL,              // magia conhecida fixa, que não conta nos limites: value = id da magia
    SPELL_CHOICE,       // count magias à escolha: spellLevel 0 = truques, N = do 1º ao Nº nível; value = de onde vêm
                        // (CLASS = lista da classe, MYSTERIES = Mistérios do personagem, CLASS_OR_MYSTERIES = as duas)
    INITIATIVE,         // +amount na iniciativa (Atento: +5)
    SITUATIONAL,        // efeito que depende da situação, mostrado ao lado do que afeta: value = alvo (SKILL:STEALTH, SAVE,
                        // SAVE:DEXTERITY, INITIATIVE, AC, ATTACK, ATTACK:MELEE|RANGED|BOW|CROSSBOW|THROWN|FIREARM), description = a nota
    RESISTANCE,         // resistência a um tipo de dano: value = o tipo ("venenoso"); expertise = "caso já tenha, imunidade";
                        // options + count = à escolha (vale para VULNERABILITY e ABSORPTION; a mesma fonte não repete o tipo)
    ABSORPTION,         // absorção de um tipo de dano: value = o tipo ("necrótico")
    IMMUNITY,           // imunidade a um tipo de dano: value = o tipo ("venenoso")
    CRAFT_LEVEL,        // nível de ofício: value = id do ofício ou CHOSEN (o da CRAFT_CHOICE da mesma fonte); amount = +níveis,
                        // valueByLevel = nível mínimo (Maestria: 6º; Atirador: pelo nível na classe). Sem value: escolha entre os
                        // ofícios maiores que ele tem (sem repetir um que outra fonte já aumentou)
    CRAFT_FORMULAS,     // fórmulas a mais no limite de um ofício: value (id ou CHOSEN), amount ou usesFormula (× count)
    DAMAGE_BONUS,       // bônus no dano dos ataques: value = alvo (ATTACK, ATTACK:MELEE..., UNARMED, TWO_HANDED, WEAPON:<nome>,
                        // CHOSEN = a arma escolhida na PROFICIENCY_CHOICE da mesma fonte); amount, damage ("1d4") ou usesFormula
                        // (PROFICIENCY, HALF_PROFICIENCY, HALF_ATTRIBUTE_MODIFIER com attribute)
    SENSE,              // sentido: value DARKVISION, BLINDSIGHT, TREMORSENSE ou TELEPATHY; feet (valueByLevel pelo nível);
                        // amount = quanto soma se já tiver ("ou +15"); description = onde vale ("debaixo d'água"); options = à escolha
    EXTRA_USES,         // soma usos numa habilidade (value = nome): amount ou usesFormula; sem a habilidade, cria com
                        // description e maxUses (ou a fórmula). Cultivo de Ki: +1 Ki, ou 2 pontos se não tiver Ki
    DAMAGE_REDUCTION,   // RD contra um tipo de dano: value = o tipo, amount ou usesFormula (PROFICIENCY/HALF_PROFICIENCY)
    CONDITION_IMMUNITY, // imunidade a condição, doença ou efeito: value = o texto ("Envenenado", "doenças mundanas")
    VULNERABILITY,      // vulnerabilidade a um tipo de dano (value = "radiante", "armas de ouro e de prata"); amount -1 = deixa de ter
    PASSIVE_BONUS,      // bônus na percepção ou intuição passiva: value PERCEPTION ou INSIGHT, amount ou usesFormula HALF_PROFICIENCY
    ABILITY_USES,       // muda os usos de outra habilidade (value = nome): usesFormula/maxUses/usesPlus trocam a fórmula,
                        // amount soma usos (Inspirar Aliados, Adepto Espiritual, Controle de Plumadagas)
    RESOURCE_CHOICE     // recurso de classe do Capítulo 5 (rules/recursos.json): value = tipo (SUTRA, IRA, TECNICA...), count,
                        // options = grupos aceitos (vazio = todos); VEL é opcional e usa amount como os pontos (◆) disponíveis
}
