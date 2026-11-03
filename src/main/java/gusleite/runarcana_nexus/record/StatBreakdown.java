package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Attribute;

import java.util.List;

// De onde vem cada ponto de atributo e de PV da ficha (a ficha só guarda os totais; isto refaz a conta pelas escolhas
// guardadas). Cada linha é uma fonte e o quanto ela soma; a soma das linhas é o total.
public record StatBreakdown(List<AttributeLines> attributes, HpLines hp) {

    public record Line(String label, int amount) {}

    public record AttributeLines(Attribute attribute, int total, List<Line> lines) {}

    public record HpLines(int total, List<Line> lines) {}
}
