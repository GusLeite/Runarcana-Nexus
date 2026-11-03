package gusleite.runarcana_nexus.model.map;

import gusleite.runarcana_nexus.model.auth.Account;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

// Comentário num ponto de interesse. shared: a mesa inteira vê; senão, é anotação só do autor.
@Entity
@Getter
@Setter
public class PoiComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "poi_id")
    private MapPoi poi;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private Account author;

    @Column(name = "comment_text", nullable = false, length = 1000)
    private String text;

    private boolean shared;

    private Instant createdAt;
}
