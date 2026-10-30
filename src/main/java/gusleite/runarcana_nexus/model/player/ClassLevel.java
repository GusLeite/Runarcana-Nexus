package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Níveis do personagem numa classe (multiclasse: uma linha por classe). classId é o id do catálogo ("ARCANIST").
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassLevel {
    private String classId;
    private String className;
    @Column(name = "class_level")
    private int level;
    private String subclass;
}
