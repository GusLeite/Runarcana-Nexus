package gusleite.runarcana_nexus.model.documents;

import gusleite.runarcana_nexus.enums.DocumentKind;
import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

// Documento que o mestre entrega aos jogadores: carta, pista, mapa, lore, segredo ou recompensa.
// Vai para todos (toAll) ou só para as contas em recipients.
@Entity
@Getter
@Setter
public class GameDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentKind kind;

    @Column(length = 20000)
    private String body;

    @Column(length = 1000)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private Account author;

    private Instant createdAt;

    private boolean toAll;

    @ManyToMany
    @JoinTable(
            name = "game_document_recipients",
            joinColumns = @JoinColumn(name = "document_id"),
            inverseJoinColumns = @JoinColumn(name = "account_id")
    )
    private Set<Account> recipients = new HashSet<>();
}
