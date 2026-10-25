package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.ItemSize;
import gusleite.runarcana_nexus.enums.Rarity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String itemDescription;
    @Enumerated(EnumType.STRING)
    private Rarity rarity;
    private Integer price;
    private Double weight;
    @Enumerated(EnumType.STRING)
    private ItemSize size;
    private String effect;
}


