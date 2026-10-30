package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.MovementType;
import gusleite.runarcana_nexus.model.player.Character;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

// Um deslocamento em pés. A ficha e a prévia mandam a lista com a caminhada primeiro e depois os outros
// tipos na ordem do enum (só os que existem), para o front alternar entre eles.
public record SpeedLine(MovementType type, double feet) {

    public static List<SpeedLine> of(Double walk, Map<MovementType, Double> others) {
        List<SpeedLine> out = new ArrayList<>();
        if (walk != null) out.add(new SpeedLine(MovementType.WALK, walk));
        Arrays.stream(MovementType.values())
                .filter(t -> t != MovementType.WALK && others.getOrDefault(t, 0.0) > 0)
                .forEach(t -> out.add(new SpeedLine(t, others.get(t))));
        return out;
    }

    // Com a forma ativa: vale o maior entre o deslocamento da forma e o normal.
    public static List<SpeedLine> of(Character c) {
        Map<MovementType, Double> form = c.getFormSpeeds();
        if (form.isEmpty()) return of(c.getSpeed(), c.getOtherSpeeds());
        Double walk = c.getSpeed() == null ? form.get(MovementType.WALK) : Math.max(c.getSpeed(), form.getOrDefault(MovementType.WALK, 0.0));
        Map<MovementType, Double> others = new java.util.HashMap<>(c.getOtherSpeeds());
        form.forEach((t, v) -> { if (t != MovementType.WALK) others.merge(t, v, Math::max); });
        return of(walk, others);
    }
}
