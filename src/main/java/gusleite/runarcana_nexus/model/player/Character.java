package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.Alignment;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.model.roles.CharacterClass;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String PlayerName;
    @NotBlank
    private String characterName;
    @Min(0)
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


    private int getModifier(int attribute){
        return Math.floorDiv(attribute - 10, 2);
        }

    private int getModifier(Attribute attribute) {
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
        return getPassiveSkill(SkillType.PERCEPTION);
    }
    public int getPassiveInsight(){
        return getPassiveSkill(SkillType.INSIGHT);
    }

    private int getPassiveSkill(SkillType skill) {
        int modifier = 0;

        CharacterSkill characterSkill = getSkill(skill);

        if (characterSkill != null && characterSkill.isProficient()) {
            modifier += getProficiencyBonus();
        }

        return 10 + modifier;
    }
}