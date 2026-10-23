package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Occupation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
