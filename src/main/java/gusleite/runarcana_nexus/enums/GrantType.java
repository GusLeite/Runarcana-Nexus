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
    RESOURCE_CHOICE     // recurso de classe do Capítulo 5 (rules/recursos.json): value = tipo (SUTRA, IRA, TECNICA...), count,
                        // options = grupos aceitos (vazio = todos); VEL é opcional e usa amount como os pontos (◆) disponíveis
}
