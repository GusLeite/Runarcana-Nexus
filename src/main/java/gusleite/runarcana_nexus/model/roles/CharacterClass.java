package gusleite.runarcana_nexus.model.roles;

import gusleite.runarcana_nexus.enums.CharacterClassType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public class CharacterClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Enumerated(EnumType.STRING)
    private CharacterClassType className;
    private int hitHpDice;
}
