package gusleite.runarcana_nexus.model.player;

import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.model.items.Item;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
public class Background {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ElementCollection
    @CollectionTable(
            name = "background_skills",
            joinColumns = @JoinColumn(name = "background_id")
    )
    @Column(name = "skill")
    @Enumerated(EnumType.STRING)
    private Set<SkillType> skills = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "occupation_id")
    private Occupation occupation;

    @ManyToMany
    @JoinTable(
            name = "background_items",
            joinColumns = @JoinColumn(name = "background_id"),
            inverseJoinColumns = @JoinColumn(name = "item_id")
    )
    private Set<Item> items = new HashSet<>();

}