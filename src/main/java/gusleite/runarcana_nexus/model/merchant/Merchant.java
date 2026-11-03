package gusleite.runarcana_nexus.model.merchant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

// Mercador que o mestre monta e abre para a mesa: um por vez fica ativo e vira a aba MERCADOR da ficha.
@Entity
@Getter
@Setter
public class Merchant {
    public static final int MAX_IMAGE = 2_000_000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 500)
    private String greeting;

    // Imagem embutida (data URL) ou link http(s), mostrada no topo da loja.
    @Column(length = MAX_IMAGE)
    private String image;

    // Quanto do preço ele paga quando o jogador vende (0 a 100%); 0 = não compra nada.
    private int buyRate;

    // CD da pechincha (Persuasão ou Enganação); nulo = 15 (padrão), 0 = não aceita pechincha.
    private Integer haggleDc;

    private boolean active;

    // Sobe a cada mudança (estoque, preço, venda): a ficha só busca a loja de novo quando muda.
    private long revision;

    @OneToMany(mappedBy = "merchant", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<MerchantItem> items = new ArrayList<>();
}
