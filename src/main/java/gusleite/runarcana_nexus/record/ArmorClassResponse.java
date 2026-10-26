package gusleite.runarcana_nexus.record;

import java.util.List;

// Classe de Armadura da ficha (e da prévia): o valor e a Redução de Dano da defesa em uso (selected),
// todas as opções com o valor já somado aos bônus, a lista de bônus ("Escorregadio +2") e, quando uma regra
// impede armaduras do inventário, o nome dela (blockedBy).
public record ArmorClassResponse(int value, int reduction, String selected, List<DefenseOption> options,
                                 List<String> bonuses, String blockedBy) {

    // key: "UNARMORED", "RULE:<n>" ou "ITEM:<id>". kind: UNARMORED, RULE ou ITEM.
    public record DefenseOption(String key, String label, String kind, int value, int reduction) {}
}
