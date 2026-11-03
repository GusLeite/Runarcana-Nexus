package gusleite.runarcana_nexus.model.lore;

import gusleite.runarcana_nexus.enums.LoreKind;
import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Verbete da lore: personagem, lugar ou região. O jogador só o vê se o mestre liberou o verbete ou um conhecimento dele.
@Entity
@Getter
@Setter
public class LoreEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoreKind kind;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 160)
    private String subtitle;

    @Column(length = 500)
    private String quote;

    @Column(length = 120)
    private String quoteAuthor;

    @Column(length = 4000)
    private String summary;

    @Column(length = 1000)
    private String imageUrl;

    // Região: qual brasão do mapa ela representa (slug de components/map/regions.js).
    @Column(length = 40)
    private String mapSlug;

    // Personagem ou lugar: a região a que pertence.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private LoreEntry region;

    @ElementCollection
    @CollectionTable(name = "lore_entry_facts", joinColumns = @JoinColumn(name = "entry_id"))
    @OrderColumn(name = "position")
    private List<LoreFact> facts = new ArrayList<>();

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "position")
    private List<LoreSection> sections = new ArrayList<>();

    private boolean toAll;

    @ManyToMany
    @JoinTable(
            name = "lore_entry_recipients",
            joinColumns = @JoinColumn(name = "entry_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private Set<Account> recipients = new HashSet<>();
}
