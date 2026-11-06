package gusleite.runarcana_nexus.model.combat;

import gusleite.runarcana_nexus.model.merchant.Merchant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Quem está no confronto. PLAYER aponta a ficha (PV, CA e iniciativa vêm dela, ao vivo); ENEMY é uma cópia
// da ficha do bestiário com PV próprios, para "Lobo 1" e "Lobo 2" apanharem separados.
@Entity
@Getter
@Setter
public class Combatant {

    public enum Kind { PLAYER, ENEMY }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Encounter encounter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Kind kind;

    private Long characterId;

    // Ficha de origem no bestiário (nula se ela foi apagada depois).
    private Long enemyId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = Merchant.MAX_IMAGE)
    private String image;

    // Só inimigos; o jogador usa os da ficha.
    private int maxHp;
    private int currentHp;
    private int armorClass;
    private int initiativeBonus;

    // Total da iniciativa (nulo = ainda não rolou) e o d20 que saiu (nulo se o mestre digitou).
    private Integer initiative;
    private Integer initiativeD20;

    // Inimigo escondido: os jogadores não o veem (emboscada) até o mestre revelar.
    private boolean hidden;
    private boolean defeated;
}
