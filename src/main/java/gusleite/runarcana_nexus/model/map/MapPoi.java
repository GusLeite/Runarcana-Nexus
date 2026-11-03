package gusleite.runarcana_nexus.model.map;

import gusleite.runarcana_nexus.enums.PoiKind;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.lore.LoreEntry;
import gusleite.runarcana_nexus.model.merchant.Merchant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

    // Notas que só o mestre lê.
    @Column(length = 4000)
    private String secretNotes;

    // Galeria: data URLs ou links, na ordem em que o mestre enviou.
    @ElementCollection
    @CollectionTable(name = "map_poi_images", joinColumns = @JoinColumn(name = "poi_id"))
    @OrderColumn(name = "position")
    @Column(name = "image", length = Merchant.MAX_IMAGE)
    private List<String> images = new ArrayList<>();

    // Imagem aberta na tela dos jogadores (índice em images); spotlightRev sobe a cada MOSTRAR À MESA para reabrir a mesma.
    private Integer spotlight;

    private Long spotlightRev;

    private boolean toAll;

    @ManyToMany
    @JoinTable(
            name = "map_poi_recipients",
            joinColumns = @JoinColumn(name = "poi_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private Set<Account> recipients = new HashSet<>();
}
