package gusleite.runarcana_nexus.services;

import java.util.random.RandomGenerator;

// Os testes de controller ficam em outro pacote: daqui eles fixam o d20 do CombatService.
public final class CombatTestAccess {
    private CombatTestAccess() {}

    public static void random(CombatService combat, RandomGenerator random) {
        combat.setRandom(random);
    }
}
