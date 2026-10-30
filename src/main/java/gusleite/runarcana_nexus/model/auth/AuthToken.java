package gusleite.runarcana_nexus.model.auth;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

// Sessão de login. O token em si só existe no cliente; aqui fica o SHA-256 dele.
@Entity
@Data
public class AuthToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @ManyToOne(optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(nullable = false)
    private Instant expiresAt;
}
