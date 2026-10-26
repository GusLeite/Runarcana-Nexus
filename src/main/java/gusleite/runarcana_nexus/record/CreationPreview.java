package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.GrantType;
import gusleite.runarcana_nexus.enums.HeritageCategory;
import gusleite.runarcana_nexus.enums.SkillType;

import java.util.List;

// Ficha em construção calculada pelo back a partir das escolhas (a mesma conta da criação).
// errors vazio = pode criar. source diz de onde veio cada coisa ("Origem: ...", "Classe: ...").
public record CreationPreview(
        List<AttributeLine> attributes,
        PointBuyStatus pointBuy,
        List<SkillLine> skills,
        List<SaveLine> savingThrows,
        List<FeatureLine> features,
        List<ChoiceLine> choices,
        int maxHp,
        int hitDie,
        // Em pés.
        double speed,
        // Todos os deslocamentos (caminhada primeiro).
        List<SpeedLine> speeds,
        int gold,
        CreatureSize size,
        List<String> languages,
        List<String> crafts,
        int heritagePoints,
        List<HeritagePool> heritagePools,
        List<HeritageLine> heritages,
        List<HeritageStatus> heritageOptions,
        // Runinata: conta dos traços (null quando a origem não usa traços), escolhidos e o que dá para escolher.
        TraitBudgetStatus traitBudget,
        List<TraitLine> traits,
        List<TraitStatus> traitOptions,
        List<String> errors,
        boolean complete
) {
    public record AttributeLine(Attribute attribute, Integer base, int bonus, int total, int modifier) {}

    public record PointBuyStatus(int spent, int budget) {}

    public record SkillLine(SkillType skill, String source) {}

    public record SaveLine(Attribute attribute, String source) {}

    // dice/uses já calculados para o 1º nível (habilidades que escalam com a proficiência).
    public record FeatureLine(String name, String description, AbilityType type, String dice, Integer uses, String source) {}

    // Pontos de Herança por tipo: scope REGION (compra de Região e Gerais), ORIGIN (de Origem e Gerais) ou ANY (todas).
    public record HeritagePool(String scope, int points, int spent) {}

    // Herança escolhida. times > 1 quando escolhida de novo.
    public record HeritageLine(String id, String name, HeritageCategory category, String option, int times) {}

    // Para cada Herança do catálogo: se dá para escolher agora e, se não, o motivo (pré-requisito, tipo de ponto...).
    public record HeritageStatus(String id, boolean available, String reason, int times) {}

    // Conta dos traços: os do modo (menores/maiores, menos os convertidos em pontos), quantos foram usados,
    // e os pontos de Origem (desvantagens + conversões) e quanto deles foi gasto. Pontos podem ter meio ponto.
    public record TraitBudgetStatus(String budget, int minorSlots, int majorSlots, int minorUsed, int majorUsed,
                                    boolean minorConverted, boolean majorConverted, double drawbackPoints,
                                    double points, double pointsSpent) {}

    // Traço ou desvantagem escolhido (kind TRAIT ou DRAWBACK). tier: MINOR, MAJOR, SUPERIOR (null na desvantagem).
    public record TraitLine(String id, String name, String kind, String tier, List<String> details, int times) {}

    // Para cada traço e desvantagem do catálogo: se dá para escolher agora e, se não, o motivo.
    public record TraitStatus(String id, boolean available, String reason, int times) {}

    // Escolha pendente ou feita: key é o que o front devolve em CreationRequest.choices.
    // note explica uma escolha sem opções (ex.: lista de ofícios ainda não cadastrada); ela não bloqueia a criação.
    public record ChoiceLine(String key, GrantType type, String label, int count, List<String> options,
                             List<String> selected, String source, String note) {}
}
