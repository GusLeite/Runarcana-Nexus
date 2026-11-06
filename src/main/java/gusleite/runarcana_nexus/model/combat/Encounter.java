package gusleite.runarcana_nexus.model.combat;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

// Confronto: o mestre monta (rascunho), ativa (um por vez; a ficha dos jogadores fica presa na aba COMBATE) e encerra.
@Entity
@Getter
@Setter
public class Encounter {

    public enum Status { DRAFT, ACTIVE, ENDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status = Status.DRAFT;

    private int round = 1;

    // De quem é a vez (id do Combatant). Nulo = os turnos ainda não começaram (fase de iniciativa).
    private Long currentId;

    // Sobe a cada mudança: as telas só buscam o confronto de novo quando muda.
    private long revision;

    private Instant createdAt;
    private Instant startedAt;
    private Instant endedAt;

    @OneToMany(mappedBy = "encounter", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<Combatant> combatants = new ArrayList<>();
}
