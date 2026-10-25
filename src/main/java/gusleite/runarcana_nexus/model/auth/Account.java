package gusleite.runarcana_nexus.model.auth;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

// Conta de acesso de um jogador. Por enquanto, uma conta por personagem da mesa.
@Entity
@Data
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sempre em minúsculas; o login não diferencia maiúsculas.
    @Column(nullable = false, unique = true)
    private String username;

    // Hash BCrypt, nunca a senha em texto.
    @Column(nullable = false)
    private String passwordHash;

    // true enquanto a conta ainda usa a senha inicial do seed.
    private boolean mustChangePassword;

    private Instant passwordChangedAt;
}
