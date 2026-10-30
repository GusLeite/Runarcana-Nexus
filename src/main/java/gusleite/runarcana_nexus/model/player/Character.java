package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.Alignment;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.CreatureSize;
import gusleite.runarcana_nexus.enums.MovementType;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

// @Getter/@Setter em vez de @Data: o equals/hashCode/toString do @Data entraria em ciclo com CharacterSkill.
@Entity
@Getter
@Setter
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String playerName;
    @NotBlank
    private String characterName;
    @Min(1)
    @Max(20)
    private int level;
    @PositiveOrZero
    private int gold;
    @Min(1)
    private int age;
    @Positive
    private double height;
    @ManyToOne
    @NotNull
    private CharacterClass characterClass;
    @Positive
    private int maxHp;
    @PositiveOrZero
    private int currentHp;
    // PV temporários (somem antes dos PV atuais ao sofrer dano). Nulo nas fichas antigas = 0.
    private Integer tempHp;
    // Fórmulas de Ofício conhecidas ("<id do ofício>:<id da fórmula>" do rules/formulas.json); quem marca é o mestre.
    @ElementCollection
    @CollectionTable(name = "character_formulas", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "formula")
    private Set<String> formulas = new LinkedHashSet<>();
    // Efeitos situacionais (Heranças, Aprimoramentos), resistências a dano e bônus nas passivas, vindos das concessões.
    @ElementCollection
    @CollectionTable(name = "character_situational", joinColumns = @JoinColumn(name = "character_id"))
    @OrderColumn(name = "position")
    private List<SituationalNote> situational = new ArrayList<>();
    @ElementCollection
    @CollectionTable(name = "character_resistances", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "damage_type")
    private Set<String> resistances = new LinkedHashSet<>();
    @ElementCollection
    @CollectionTable(name = "character_vulnerabilities", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "damage_type")
    private Set<String> vulnerabilities = new LinkedHashSet<>();
    @ElementCollection
    @CollectionTable(name = "character_immunities", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "damage_type")
    private Set<String> immunities = new LinkedHashSet<>();
    @ElementCollection
    @CollectionTable(name = "character_absorptions", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "damage_type")
    private Set<String> absorptions = new LinkedHashSet<>();
    @ElementCollection
    @CollectionTable(name = "character_condition_immunities", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "name")
    private Set<String> conditionImmunities = new LinkedHashSet<>();
    // RD contra um tipo de dano (Glacinata: gélido = bônus de proficiência), recalculada a cada criação/subida.
    @ElementCollection
    @CollectionTable(name = "character_typed_reductions", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "damage_type")
    @Column(name = "amount")
    private Map<String, Integer> typedReductions = new HashMap<>();
    // Sentidos ("DARKVISION", "DARKVISION|debaixo d'água", "BLINDSIGHT"...) → alcance em pés.
    @ElementCollection
    @CollectionTable(name = "character_senses", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "sense")
    @Column(name = "feet")
    private Map<String, Integer> senses = new HashMap<>();
    private Integer passivePerceptionBonus;
    private Integer passiveInsightBonus;
    // Bônus na iniciativa (Atento: +5), das concessões INITIATIVE. Nulo = 0.
    private Integer initiativeBonus;
    // Bônus nos PV máximos dado pelo mestre (item, maldição, bênção); fica fora da conta da subida de nível. Nulo = 0.
    private Integer maxHpBonus;
    // Testes contra a morte (0–3 cada) com 0 PV; zerados ao ganhar PV ou descansar. Nulos nas fichas antigas = 0.
    private Integer deathSuccesses;
    private Integer deathFailures;
    // Condições do rules/condicoes.json (ids) e nível de Exaustão (0–10); quem mexe é o mestre. Exaustão nula = 0.
    @ElementCollection
    @CollectionTable(name = "character_conditions", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "condition_id")
    private Set<String> conditions = new LinkedHashSet<>();
    private Integer exhaustion;
    @Positive
    private int str;
    @Positive
    private int dex;
    @Positive
    private int intel;
    @Positive
    private int wis;
    @Positive
    private int cha;
    @Positive
    private int con;
    @OneToMany(mappedBy = "character", cascade = CascadeType.ALL)
    private List<CharacterSkill> skills = new ArrayList<>();
    private Region region;
    @ManyToOne
    @JoinColumn(name = "background_id")
    private Background background;
    private Alignment alignment;
    private int inspiration;

    // Dono da ficha. Nulo nas fichas antigas (ligadas à conta pelo nome; ver CharacterService.characterOf).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    // Nome da origem escolhida no catálogo de regras (rules/criacao.json).
    private String origin;

    // Nome da linhagem (tribo) da origem, quando ela tem (ex.: "Aelus").
    private String lineage;

    // Nome da subclasse (Glifo do Arcanista, Cabala do Mercurial...), quando a classe tem.
    private String subclass;

    // Proficiências com armaduras (LIGHT, MEDIUM, HEAVY, SHIELD) e com armas (pelo nome: "Armas simples", "Rapieiras").
    @ElementCollection
    @CollectionTable(name = "character_armor_proficiencies", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "armor")
    private Set<String> armorProficiencies = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "character_weapon_proficiencies", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "weapon")
    private Set<String> weaponProficiencies = new LinkedHashSet<>();

    // Ofícios (pelo nome) com especialidade.
    @ElementCollection
    @CollectionTable(name = "character_craft_expertise", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "craft")
    private Set<String> craftExpertise = new LinkedHashSet<>();

    // Deslocamento em pés (como no livro). Nulo nas fichas antigas (o front mostra "—").
    private Double speed;

    // Outros deslocamentos em pés: natação, escalada, voo, escavação (a caminhada é o speed).
    @ElementCollection
    @CollectionTable(name = "character_speeds", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "movement")
    @Column(name = "feet")
    private Map<MovementType, Double> otherSpeeds = new HashMap<>();

    @Enumerated(EnumType.STRING)
    private CreatureSize size;

    // CAs alternativas e bônus de CA da origem/linhagem/traços (Pele de Árvore, Proteção Ajustável, Escorregadio...).
    @ElementCollection
    @CollectionTable(name = "character_armor_rules", joinColumns = @JoinColumn(name = "character_id"))
    @OrderColumn(name = "position")
    private List<ArmorRule> armorRules = new ArrayList<>();

    // Defesa em uso, escolhida na ficha: "UNARMORED", "RULE:<n>" (n-ésima opção de defesa de armorRules, sem contar os bônus)
    // ou "ITEM:<id do PlayerItems>".
    // Nulo = a de maior CA.
    private String defense;

    // Escudo em uso: "ITEM:<id do PlayerItems>", "NONE" (sem escudo) ou nulo (= o de maior bônus do inventário).
    private String shield;

    @ElementCollection
    @CollectionTable(name = "character_languages", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "language")
    private Set<String> languages = new LinkedHashSet<>();

    // Nomes dos ofícios em que é proficiente (vindos de "crafts" do rules/criacao.json).
    @ElementCollection
    @CollectionTable(name = "character_crafts", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "craft")
    private Set<String> crafts = new LinkedHashSet<>();

    // Nível do personagem em que cada ofício (pelo nome) foi aprendido. Sem entrada (fichas antigas) = 1º nível.
    @ElementCollection
    @CollectionTable(name = "character_craft_levels", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "craft")
    @Column(name = "learned_at")
    private Map<String, Integer> craftLevels = new HashMap<>();
    // Níveis a mais em cada ofício (Minucioso, Operário: +1), o nível mínimo (Maestria: 6º) e fórmulas a mais no limite.
    @ElementCollection
    @CollectionTable(name = "character_craft_level_bonus", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "craft")
    @Column(name = "levels")
    private Map<String, Integer> craftLevelBonus = new HashMap<>();
    @ElementCollection
    @CollectionTable(name = "character_craft_min_level", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "craft")
    @Column(name = "min_level")
    private Map<String, Integer> craftMinLevel = new HashMap<>();
    @ElementCollection
    @CollectionTable(name = "character_craft_formula_bonus", joinColumns = @JoinColumn(name = "character_id"))
    @MapKeyColumn(name = "craft")
    @Column(name = "formulas")
    private Map<String, Integer> craftFormulaBonus = new HashMap<>();

    // Pontos de Herança ainda não gastos (os da criação são gastos no assistente).
    private Integer heritagePoints;

    // Nomes das Heranças escolhidas, com a opção e as repetições: "Variante Meio-Vastaya (Marai)", "Variante Colosso (2×)".
    // O texto completo de cada uma vira uma habilidade do tipo HERITAGE.
    @ElementCollection
    @CollectionTable(name = "character_heritages", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "heritage")
    private Set<String> heritages = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "character_saving_throws", joinColumns = @JoinColumn(name = "character_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "attribute")
    private Set<Attribute> savingThrows = new HashSet<>();
    // Especialidade em salvaguarda (Graciosidade: "caso já tenha proficiência"): proficiência em dobro.
    @ElementCollection
    @CollectionTable(name = "character_save_expertise", joinColumns = @JoinColumn(name = "character_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "attribute")
    private Set<Attribute> savingThrowExpertise = new HashSet<>();

    // Escolhas feitas na criação e nos níveis ganhos (JSON do CreationRequest), para a subida de nível reaproveitar.
    @Column(length = 100000)
    private String build;

    // Níveis em cada classe, na ordem em que entraram (a primeira é a da criação). Vazio nas fichas antigas.
    @ElementCollection
    @CollectionTable(name = "character_class_levels", joinColumns = @JoinColumn(name = "character_id"))
    @OrderColumn(name = "position")
    private List<ClassLevel> classLevels = new ArrayList<>();


    // PV máximos com o bônus do mestre (o que a ficha mostra e o limite da cura).
    public int getMaxHpTotal() {
        return Math.max(1, maxHp + (maxHpBonus == null ? 0 : maxHpBonus));
    }

    private int getModifier(int attribute){
        return Math.floorDiv(attribute - 10, 2);
        }

    public int getModifier(Attribute attribute) {
        int value = switch (attribute) {
            case STRENGTH -> str;
            case DEXTERITY -> dex;
            case CONSTITUTION -> con;
            case INTELLIGENCE -> intel;
            case WISDOM -> wis;
            case CHARISMA -> cha;
            default -> 0;
        };

        return getModifier(value);
    }

    public int getProficiencyBonus() {
        if (level < 1 || level > 20) {
            throw new IllegalArgumentException(
                    "O nível deve estar entre 1 e 20."
            );
        }
        if (level <= 4) return 2;
        if (level <= 8) return 3;
        if (level <= 12) return 4;
        if (level <= 16) return 5;

        return 6;
    }

    private CharacterSkill getSkill(SkillType type) {
        return skills.stream()
                .filter(characterSkill ->
                        characterSkill.getSkillType() == type)
                .findFirst()
                .orElse(null);
    }

    public int getPassivePerception(){
        return getPassiveSkill(SkillType.PERCEPTION) + (passivePerceptionBonus == null ? 0 : passivePerceptionBonus);
    }
    public int getPassiveInsight(){
        return getPassiveSkill(SkillType.INSIGHT) + (passiveInsightBonus == null ? 0 : passiveInsightBonus);
    }

    public boolean isProficient(SkillType skill) {
        CharacterSkill characterSkill = getSkill(skill);
        return characterSkill != null && characterSkill.isProficient();
    }

    public boolean isExpert(SkillType skill) {
        CharacterSkill characterSkill = getSkill(skill);
        return characterSkill != null && characterSkill.isProficient() && characterSkill.isExpertise();
    }

    // Bônus de um teste de perícia: modificador do atributo base + proficiência, se tiver (duas vezes com especialidade).
    public int getSkillModifier(SkillType skill) {
        int modifier = getModifier(skill.getBaseAttribute());

        if (isProficient(skill)) {
            modifier += getProficiencyBonus();
        }
        if (isExpert(skill)) {
            modifier += getProficiencyBonus();
        }

        return modifier;
    }

    private int getPassiveSkill(SkillType skill) {
        return 10 + getSkillModifier(skill);
    }
}