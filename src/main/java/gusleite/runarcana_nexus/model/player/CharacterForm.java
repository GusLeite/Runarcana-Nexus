package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Uma forma temporária da ficha (Forma de Sho'Ma, Forma Dracônica). Os efeitos em texto curto, lidos por Character:
// attributes "STRENGTH:2,DEXTERITY:4" (P no lugar do número = metade da proficiência), speeds "WALK:50,FLY:40", size "UP"/"LARGE".
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CharacterForm {
    private String name;
    @Column(length = 4000)
    private String description;
    private String attributes;
    private String speeds;
    private String size;
}
