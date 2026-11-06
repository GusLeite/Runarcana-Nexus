package gusleite.runarcana_nexus.model.combat;

import gusleite.runarcana_nexus.model.merchant.Merchant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Ficha de inimigo do bestiário do mestre: modelo reaproveitável. Ao entrar num confronto vira um Combatant
// (com PV próprios), então editar ou apagar a ficha não mexe em quem já está lutando.
@Entity
@Getter
@Setter
public class Enemy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    // Retrato: data URL enviada ou link http(s) (mesmas regras do mercador).
    @Column(length = Merchant.MAX_IMAGE)
    private String image;

    private int maxHp;
    private int armorClass;
    private int initiativeBonus;

    @Column(length = 60)
    private String speed;

    private int str = 10;
    private int dex = 10;
    private int con = 10;
    private int intel = 10;
    private int wis = 10;
    private int cha = 10;

    // Ataques e habilidades em texto livre (uma por linha), e notas só do mestre.
    @Column(length = 4000)
    private String attacks;

    @Column(length = 4000)
    private String notes;
}
