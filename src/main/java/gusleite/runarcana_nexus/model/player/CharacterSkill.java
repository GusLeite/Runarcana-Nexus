package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.SkillType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class CharacterSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "character_id")
    private Character character;
    private SkillType skillType;
    private boolean proficient;
}