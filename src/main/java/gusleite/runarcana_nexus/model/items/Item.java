package gusleite.runarcana_nexus.model.items;

import gusleite.runarcana_nexus.enums.Rarity;
import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String itemDescription;
    private Rarity rarity;
    private Integer price;
    private Integer weigh;
}
