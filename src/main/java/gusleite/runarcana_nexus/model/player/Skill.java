package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.SkillType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private SkillType type;
    @Column(nullable = false)
    private String name;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Attribute governingAttribute;
}