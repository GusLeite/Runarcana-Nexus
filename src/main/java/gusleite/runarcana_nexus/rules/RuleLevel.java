package gusleite.runarcana_nexus.rules;

import java.util.List;

// O que a classe, a origem ou a linhagem concede ao chegar em um nível (2 a 20).
public record RuleLevel(Integer level, List<Grant> grants) {}
