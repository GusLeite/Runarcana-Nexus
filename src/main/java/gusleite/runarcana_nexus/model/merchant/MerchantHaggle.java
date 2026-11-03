package gusleite.runarcana_nexus.model.merchant;

import gusleite.runarcana_nexus.enums.SkillType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Pechincha de um personagem com o mercador aberto: uma por abertura da loja (abrir ou fechar apaga todas).
// percent muda o preço de compra dele nessa loja: negativo = desconto, positivo = mercador irritado.
@Entity
@Getter
@Setter
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"merchant_id", "character_id"}))
public class MerchantHaggle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_id")
    private Merchant merchant;

    private Long characterId;

    private String characterName;

    @Enumerated(EnumType.STRING)
    private SkillType skill;

    private int d20;

    private int total;

    private int dc;

    private int percent;

    private Instant createdAt;
}
