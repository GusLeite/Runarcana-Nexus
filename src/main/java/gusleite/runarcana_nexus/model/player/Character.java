package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.model.roles.CharacterClass;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotNull
    private String PlayerName;
    @NotNull
    private String characterName;
    @Min(0)
    private Integer level;
    @Positive
    private Integer gold;
    @Min(1)
    private Integer age;
    @Positive
    private double height;
    @ManyToOne
    @NotNull
    private CharacterClass characterClass;
    @Positive
    private Integer maxHp;
    @Positive
    private Integer currentHp;
    @Positive
    private Integer str;
    @Positive
    private Integer dex;
    @Positive
    private Integer intel;
    @Positive
    private Integer wis;
    @Positive
    private Integer cha;
    @OneToMany(mappedBy = "character", cascade = CascadeType.ALL)
    private List<CharacterSkill> skills = new ArrayList<>();


    private int getModifier(int attribute){
        return (attribute - 10)/2;
    }

    public int calculateProficiencyBonus() {
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
}