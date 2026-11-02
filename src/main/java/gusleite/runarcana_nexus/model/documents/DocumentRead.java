package gusleite.runarcana_nexus.model.documents;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Marca que um jogador já abriu um documento (para o selo "NOVO" no front).
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "account_id"}))
@Getter
@Setter
public class DocumentRead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private GameDocument document;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    private Instant readAt;
}
