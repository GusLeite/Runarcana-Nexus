package gusleite.runarcana_nexus.model.map;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Uma parada da viagem do grupo no mapa: cada vez que o mestre move o marcador, a trilha ganha um ponto.
@Entity
@Getter
@Setter
public class PartyTrailPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int x;

    private int y;

    @Column(length = 80)
    private String label;

    private Instant createdAt;
}
