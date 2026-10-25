package gusleite.runarcana_nexus.model.player;

import jakarta.persistence.*;

@Entity
public class Origin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    private int baseMovementSpeed;
}