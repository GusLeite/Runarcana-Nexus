package gusleite.runarcana_nexus.model.journal;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Diário do grupo: entradas escritas por qualquer um da mesa (NOTE) e eventos que o sistema registra sozinho
// (loot, ouro, alguém caindo a 0 PV, documento enviado, subida de nível), base do resumo de cada sessão.
@Entity
@Getter
@Setter
public class JournalEntry {
    public enum Kind { NOTE, LOOT, GOLD, DOWNED, DOCUMENT, LEVEL_UP }

    public static final int MAX_TITLE = 120;
    public static final int MAX_BODY = 8000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind kind;

    // Quem escreveu (só nas NOTE); evento automático não tem autor.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private Account author;

    // Nome mostrado: o personagem do autor, "Mestre" ou, nos eventos, o personagem envolvido.
    @Column(length = 80)
    private String who;

    @Column(length = MAX_TITLE)
    private String title;

    @Column(length = MAX_BODY)
    private String body;

    private Instant createdAt;

    private Instant updatedAt;
}
