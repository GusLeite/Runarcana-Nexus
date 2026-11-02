package gusleite.runarcana_nexus.rules;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.Recharge;
import gusleite.runarcana_nexus.enums.UsesFormula;

// Usos de uma opção de habilidade com escolha (FEATURE com options + optionUses), quando ela tem usos próprios.
// Ex.: Florescência "Charme Sobrenatural" = metade do mod. de Carisma; "Sopro de Esporos" = 1 por descanso longo.
public record UsesRule(UsesFormula usesFormula, Integer maxUses, Attribute attribute, Integer usesPlus, Recharge recharge) {}
