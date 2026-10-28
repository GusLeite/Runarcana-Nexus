package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Recharge;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Magia, habilidade ativa ou passiva de um personagem. Quem cadastra é o mestre;
// o jogador só gasta e recupera os usos.
@Entity
@Getter
@Setter
public class CharacterAbility {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id")
    private Character character;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AbilityType type;

    // Círculo da magia (0 = truque); nulo para habilidades.
    private Integer spellLevel;
    private String school;
    private String castingTime;
    private String abilityRange;
    private String duration;
    private String components;
    // Expressão de dados, ex.: "2d6+4". O front rola direto dela.
    private String damage;

    @Column(length = 4000)
    private String description;

    // Nulo = uso livre (sem contador).
    private Integer maxUses;
    private Integer usesLeft;

    @Enumerated(EnumType.STRING)
    private Recharge recharge;

    // Imagem do ícone: data URL (o front já manda reduzida para 128x128) ou link http(s). Nulo = inicial do nome.
    @Column(length = 300000)
    private String icon;

    // De onde veio pelo assistente ("Classe: Bruto", "Aprimoramento: Atleta"); nulo = cadastrada pelo mestre.
    // A subida de nível refaz as que têm fonte e não mexe nas do mestre.
    private String source;

    // Magia que se prepara (Acólito, Xamã): true = preparada, false = conhecida mas não preparada, nulo = não se prepara.
    private Boolean prepared;
    // Id da magia no rules/magias.json (as preparadas do Acólito).
    private String spellId;
}
