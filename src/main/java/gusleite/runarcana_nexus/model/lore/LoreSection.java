package gusleite.runarcana_nexus.model.lore;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

// Conhecimento: trecho do verbete que o mestre libera para todos ou só para alguns personagens.
@Entity
@Getter
@Setter
public class LoreSection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id")
    private LoreEntry entry;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 20000)
    private String body;

    private boolean toAll;

    @ManyToMany
    @JoinTable(
            name = "lore_section_recipients",
            joinColumns = @JoinColumn(name = "section_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private Set<Account> recipients = new HashSet<>();
}
