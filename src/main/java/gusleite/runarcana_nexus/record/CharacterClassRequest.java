package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.CharacterClassType;

public record CharacterClassRequest(
    int hitHpDice,
    CharacterClassType className
) {}