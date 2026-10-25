package gusleite.runarcana_nexus.enums;

import static gusleite.runarcana_nexus.enums.Attribute.*;

public enum SkillType {
    // Força
    ATHLETICS(STRENGTH),

    // Destreza
    ACROBATICS(DEXTERITY),
    SLEIGHT_OF_HAND(DEXTERITY),
    STEALTH(DEXTERITY),

    // Inteligência
    ARCANA(INTELLIGENCE),
    HISTORY(INTELLIGENCE),
    INVESTIGATION(INTELLIGENCE),
    NATURE(INTELLIGENCE),
    RELIGION(INTELLIGENCE),
    TECHNOLOGY(INTELLIGENCE), // Adaptação Runarcana

    // Sabedoria
    INSIGHT(WISDOM),
    ANIMAL_HANDLING(WISDOM),
    MEDICINE(WISDOM),
    PERCEPTION(WISDOM),
    SURVIVAL(WISDOM),

    // Carisma
    DECEPTION(CHARISMA),
    INTIMIDATION(CHARISMA),
    PERFORMANCE(CHARISMA),
    PERSUASION(CHARISMA);



    private final Attribute baseAttribute;

    // Construtor do Enum
    SkillType(Attribute baseAttribute) {
        this.baseAttribute = baseAttribute;
    }

    // Getter para acessar o atributo associado
    public Attribute getBaseAttribute() {
        return this.baseAttribute;
    }
}