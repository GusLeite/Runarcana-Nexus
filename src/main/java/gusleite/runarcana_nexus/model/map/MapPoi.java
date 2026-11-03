package gusleite.runarcana_nexus.model.map;

import gusleite.runarcana_nexus.enums.PoiKind;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.lore.LoreEntry;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

// Ponto de interesse criado pelo mestre, em coordenadas do mundo (centro do mapa em 0,0).
@Entity
@Getter
@Setter
public class MapPoi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PoiKind kind;

    @Column(length = 4000)
    private String description;

    private double x;

    private double y;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lore_entry_id")
    private LoreEntry loreEntry;

    private boolean toAll;

    @ManyToMany
    @JoinTable(
            name = "map_poi_recipients",
            joinColumns = @JoinColumn(name = "poi_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private Set<Account> recipients = new HashSet<>();
}
