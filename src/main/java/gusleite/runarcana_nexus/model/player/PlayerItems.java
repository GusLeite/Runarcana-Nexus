package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.model.items.Item;
import jakarta.persistence.*;

@Entity
public class PlayerItems {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "character_id")
    private Character character;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    private Integer quantity;
}
