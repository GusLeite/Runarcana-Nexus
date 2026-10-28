package gusleite.runarcana_nexus.record;

import java.util.List;

// Ficha completa do personagem logado: dados, perícias, CA (com as armaduras do inventário), ataques com arma,
// inventário e magias/habilidades.
public record CharacterSheetResponse(
        CharacterResponse character,
        ArmorClassResponse armorClass,
        List<AttackResponse> attacks,
        SpellcastingResponse spellcasting,
        List<CraftResponse> crafts,
        List<InventoryItemResponse> inventory,
        List<AbilityResponse> abilities
) {}
