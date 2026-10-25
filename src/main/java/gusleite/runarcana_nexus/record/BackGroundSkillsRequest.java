package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.SkillType;

import java.util.Set;

public record BackGroundSkillsRequest(
         Set<SkillType> skills
) {}