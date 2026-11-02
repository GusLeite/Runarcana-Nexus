package gusleite.runarcana_nexus.model.merchant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Uma compra ou venda feita na loja, para o mestre acompanhar o movimento.
@Entity
@Getter
@Setter
public class MerchantTrade {
    public enum Kind { BUY, SELL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_id")
    private Merchant merchant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Kind kind;

    private String characterName;

    private String itemName;

    private int quantity;

    private int total;

    private Instant createdAt;
}
