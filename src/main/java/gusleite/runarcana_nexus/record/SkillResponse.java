package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.SkillType;

// Uma perícia da ficha com o bônus já calculado (atributo + proficiência).
public record SkillResponse(
        SkillType skill,
        Attribute attribute,
        boolean proficient,
        int modifier
) {}
