package gusleite.runarcana_nexus.record;

// Cartão da visão da mesa (painel do mestre): a ficha, a CA em uso e a Mana (nulas se a ficha não tem Pontos de Mana).
public record TableCardResponse(
        CharacterResponse character,
        int armorClass,
        Integer manaLeft,
        Integer manaMax
) {}
