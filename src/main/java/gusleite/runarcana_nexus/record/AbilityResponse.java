package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.model.player.CharacterAbility;

public record AbilityResponse(
        Long id,
        String name,
        AbilityType type,
        Integer spellLevel,
        String school,
        String castingTime,
        String range,
        String duration,
        String components,
        String damage,
        String description,
        Integer maxUses,
        Integer usesLeft,
        Recharge recharge
) {
    public static AbilityResponse of(CharacterAbility a) {
        return new AbilityResponse(a.getId(), a.getName(), a.getType(), a.getSpellLevel(), a.getSchool(),
                a.getCastingTime(), a.getAbilityRange(), a.getDuration(), a.getComponents(), a.getDamage(),
                a.getDescription(), a.getMaxUses(), a.getUsesLeft(), a.getRecharge());
    }
}
