package gusleite.runarcana_nexus.model.player;

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

    @ManyToOne(optional = false)
    @JoinColumn(name = "skill_id")
    private Skill skill;

    private boolean trained;
}