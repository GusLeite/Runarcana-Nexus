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
        // CA com as opções de defesa da origem (sem inventário ainda). Nulo sem origem.
        ArmorClassResponse armorClass,
        int gold,
        CreatureSize size,
        List<String> languages,
        List<String> crafts,
        // Ofícios (ids) com especialidade e proficiências com armaduras (LIGHT/MEDIUM/HEAVY/SHIELD) e armas (nomes).
        List<String> craftExpertise,
        List<String> armorProficiencies,
        List<String> weaponProficiencies,
        int heritagePoints,
        List<HeritagePool> heritagePools,
        List<HeritageLine> heritages,
        List<HeritageStatus> heritageOptions,
        // Runinata: conta dos traços (null quando a origem não usa traços), escolhidos e o que dá para escolher.
        TraitBudgetStatus traitBudget,
        List<TraitLine> traits,
        List<TraitStatus> traitOptions,
        // Equipamento inicial (itens do catálogo, com os conjuntos ainda fechados) e a riqueza inicial da classe.
        List<EquipmentLine> equipment,
        StartingWealth startingWealth,
        List<String> errors,
        boolean complete
) {
    public record AttributeLine(Attribute attribute, Integer base, int bonus, int total, int modifier) {}

    public record PointBuyStatus(int spent, int budget) {}

    // expertise: especialidade (bônus de proficiência em dobro).
    public record SkillLine(SkillType skill, String source, boolean expertise) {}

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
    // locked: o modo foi travado pelo mestre (o jogador não escolhe).
    public record TraitBudgetStatus(String budget, int minorSlots, int majorSlots, int minorUsed, int majorUsed,
                                    boolean minorConverted, boolean majorConverted, double drawbackPoints,
                                    double points, double pointsSpent, boolean locked) {}

    // Traço ou desvantagem escolhido (kind TRAIT ou DRAWBACK). tier: MINOR, MAJOR, SUPERIOR (null na desvantagem).
    public record TraitLine(String id, String name, String kind, String tier, List<String> details, int times) {}

    // Para cada traço e desvantagem do catálogo: se dá para escolher agora e, se não, o motivo.
    public record TraitStatus(String id, boolean available, String reason, int times) {}

    // Escolha pendente ou feita: key é o que o front devolve em CreationRequest.choices.
    // note explica uma escolha sem opções (ex.: lista de ofícios ainda não cadastrada); ela não bloqueia a criação.
    // item: id no rules/itens.json; source: de onde veio ("Classe: Acólito").
    public record EquipmentLine(String item, String name, int quantity, String source) {}

    // formula: dados da classe em PO ("5d4 x 10"), nulo sem classe; selected: o jogador trocou o equipamento por ela.
    public record StartingWealth(String formula, boolean selected) {}

    public record ChoiceLine(String key, GrantType type, String label, int count, List<String> options,
                             List<String> selected, String source, String note) {}
}
