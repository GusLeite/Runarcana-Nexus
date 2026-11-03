package gusleite.runarcana_nexus.model.map;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Trajetória que um jogador desenha no mapa (até MapRouteService.MAX_PER_PLAYER por conta). Só ele e o mestre veem.
// Os pontos ficam num texto "x,y;x,y;…" (em ordem), que o serviço valida e converte.
@Entity
@Getter
@Setter
public class MapRoute {
    public static final int MAX_PATH = 4000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private Account owner;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "route_path", nullable = false, length = MAX_PATH)
    private String path;

    private Instant createdAt;
}
