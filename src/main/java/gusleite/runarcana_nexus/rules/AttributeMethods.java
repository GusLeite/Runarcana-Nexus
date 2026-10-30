package gusleite.runarcana_nexus.rules;

import java.util.List;
import java.util.Map;

// Jeitos de definir os atributos base na criação. Um método nulo fica desligado.
public record AttributeMethods(
        PointBuy pointBuy,
        List<Integer> standardArray,
        Range manual
) {
    // Compra de pontos: cada valor de min a max custa costs[valor]; o total não passa de points.
    public record PointBuy(Integer points, Integer min, Integer max, Map<String, Integer> costs) {}

    public record Range(Integer min, Integer max) {}
}
