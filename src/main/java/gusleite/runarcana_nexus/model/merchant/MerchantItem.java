package gusleite.runarcana_nexus.model.merchant;

import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.model.items.Item;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Linha da prateleira: guarda o que a loja mostra e de onde sai o item entregue, a linha de Item (item livre ou algo
// que um jogador vendeu) ou o catálogo (catalogId; conjunto de equipamento não tem linha de Item e entrega aberto).
@Entity
@Getter
@Setter
public class MerchantItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_id")
    private Merchant merchant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    private String catalogId;

    @Column(nullable = false)
    private String name;

    @Column(length = 4000)
    private String description;

    @Column(length = 4000)
    private String effect;

    @Enumerated(EnumType.STRING)
    private Rarity rarity;

    // WEAPON | ARMOR | CONSUMABLE | OBJECT, como no inventário.
    private String kind;

    private Double weight;

    private int price;

    // Nulo = sem limite.
    private Integer stock;
}
