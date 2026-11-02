package gusleite.runarcana_nexus.model.notes;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Anotação pessoal do jogador. Só o dono vê e edita.
@Entity
@Getter
@Setter
public class PlayerNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(nullable = false)
    private String title;

    @Column(length = 20000)
    private String body;

    private boolean pinned;

    private Instant createdAt;
    private Instant updatedAt;
}
