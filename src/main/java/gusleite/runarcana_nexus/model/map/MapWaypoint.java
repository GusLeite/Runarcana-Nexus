package gusleite.runarcana_nexus.model.map;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Marcador de um jogador no mapa (até 3 por conta). Só ele e o mestre veem.
@Entity
@Getter
@Setter
public class MapWaypoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private Account owner;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "waypoint_comment", length = 1000)
    private String comment;

    private double x;

    private double y;
}
