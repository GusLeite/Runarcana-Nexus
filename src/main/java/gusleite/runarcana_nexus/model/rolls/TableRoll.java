package gusleite.runarcana_nexus.model.rolls;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Rolagem da mesa, sorteada no servidor (RollService). CHECK = d20 + modificador (com vantagem/desvantagem);
// DICE = expressão de dados ("2d6+3"). PRIVATE: só quem rolou e o mestre veem os números; o resto vê que houve uma rolagem.
@Entity
@Getter
@Setter
@Table(indexes = @Index(columnList = "createdAt"))
public class TableRoll {
    public enum Kind { CHECK, DICE }

    public enum Visibility { TABLE, PRIVATE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    // Nome mostrado: o personagem de quem rolou ou "Mestre".
    @Column(nullable = false, length = 80)
    private String who;

    @Column(nullable = false, length = 120)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Kind kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Visibility visibility;

    // CHECK
    @Column(length = 10)
    private String mode;
    private int modifier;
    private Integer critRange;
    private Integer d20;
    private Integer otherD20;

    // DICE
    @Column(length = 40)
    private String expr;
    private Integer diceCount;
    private Integer diceSides;
    private int bonus;
    // Cada dado, separado por vírgula ("3,5").
    @Column(length = 500)
    private String dice;

    private int total;

    @Column(nullable = false)
    private Instant createdAt;
}
