package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.model.roles.CharacterClass;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

@Entity
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String PlayerName;
    private String characterName;
    @Positive
    private Integer gold;
    @Min(1)
    private Integer age;
    @Positive
    private double height;
    @ManyToOne
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
    private Integer Integerel;
    @Positive
    private Integer wis;
    @Positive
    private Integer cha;

    private int getModifier(int attribute){
        return (attribute - 10)/2;
    }
}