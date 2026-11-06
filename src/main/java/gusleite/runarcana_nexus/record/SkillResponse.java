package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.SkillType;

// Uma perícia da ficha com o bônus já calculado (atributo + proficiência, dobrada com especialidade).
// base: o que as regras deram (NONE, PROFICIENT, EXPERTISE); adjusted: o mestre mudou essa perícia na mão.
public record SkillResponse(
        SkillType skill,
        Attribute attribute,
        boolean proficient,
        boolean expertise,
        int modifier,
        String base,
        boolean adjusted
) {}
