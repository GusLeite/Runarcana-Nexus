package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.merchant.Merchant;
import gusleite.runarcana_nexus.model.merchant.MerchantItem;
import gusleite.runarcana_nexus.model.merchant.MerchantTrade;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CreationPreview.EquipmentLine;
import gusleite.runarcana_nexus.record.InventoryItemResponse;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.MerchantItemRepository;
import gusleite.runarcana_nexus.repository.MerchantRepository;
import gusleite.runarcana_nexus.repository.MerchantTradeRepository;
import gusleite.runarcana_nexus.repository.PlayerItemsRepository;
import gusleite.runarcana_nexus.rules.RuleItem;
import gusleite.runarcana_nexus.services.InventoryService.CustomItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

// Mercadores: o mestre monta a loja (imagem, itens, preços, estoque) e abre uma por vez; os jogadores compram com o
// próprio ouro e vendem o que têm. O que um jogador vende vai para a prateleira, ao preço normal do item.
@Service
public class MerchantService {

    static final int MAX_PRICE = 1_000_000;
    private static final Pattern IMAGE_HEADER = Pattern.compile("^data:image/(png|jpeg|webp|gif);base64,");
    private static final Pattern IMAGE_LINK = Pattern.compile("^https?://\\S+$");

    private final MerchantRepository merchants;
    private final MerchantItemRepository shelf;
    private final MerchantTradeRepository trades;
    private final CharacterRepository characters;
    private final PlayerItemsRepository inventory;
    private final InventoryService inventoryService;
    private final StartingEquipmentService equipment;
    private final CharacterService characterService;
    private final RuleCatalogService rules;

    public MerchantService(MerchantRepository merchants, MerchantItemRepository shelf, MerchantTradeRepository trades,
                           CharacterRepository characters, PlayerItemsRepository inventory, InventoryService inventoryService,
                           StartingEquipmentService equipment, CharacterService characterService, RuleCatalogService rules) {
        this.merchants = merchants;
        this.shelf = shelf;
        this.trades = trades;
        this.characters = characters;
        this.inventory = inventory;
        this.inventoryService = inventoryService;
        this.equipment = equipment;
        this.characterService = characterService;
        this.rules = rules;
    }

    public record MerchantRequest(String name, String greeting, String image, Integer buyRate) {}

    // Do catálogo (catalogId) ou item livre (custom). Preço nulo = o do catálogo; estoque nulo = sem limite.
    public record ShelfRequest(String catalogId, CustomItem custom, Integer price, Integer stock) {}

    public record ShelfUpdate(Integer price, Integer stock) {}

    public record Line(long id, String catalogId, String name, String description, String effect, Rarity rarity, String kind,
                       Double weight, int price, Integer stock) {}

    // offers: quanto ele paga por unidade em cada linha do inventário de quem pediu (só o que ele compra).
    public record View(long id, String name, String greeting, String image, int buyRate, boolean active, long revision,
                       List<Line> items, List<Offer> offers) {}

    public record Offer(long entryId, int unitValue) {}

    public record Ping(Long id, String name, Long revision) {}

    public record TradeView(long id, MerchantTrade.Kind kind, String characterName, String itemName, int quantity, int total, Instant createdAt) {}

    public record TradeResult(View merchant, CharacterSheetResponse sheet) {}

    // ---------- Mestre ----------

    @Transactional(readOnly = true)
    public List<View> list() {
        return merchants.findAllByOrderByIdAsc().stream().map(m -> view(m, List.of())).toList();
    }

    @Transactional
    public View create(MerchantRequest request) {
        Merchant m = new Merchant();
        apply(m, request);
        return view(merchants.save(m), List.of());
    }

    @Transactional
    public View update(long id, MerchantRequest request) {
        Merchant m = merchant(id);
        apply(m, request);
        m.setRevision(m.getRevision() + 1);
        return view(m, List.of());
    }

    @Transactional
    public void delete(long id) {
        Merchant m = merchant(id);
        trades.deleteByMerchant(m);
        merchants.delete(m);
    }

    // Abrir um fecha o que estiver aberto: a ficha mostra um mercador por vez.
    @Transactional
    public View setActive(long id, boolean active) {
        Merchant m = merchant(id);
        if (active) {
            merchants.findAllByOrderByIdAsc().stream().filter(o -> o.isActive() && !o.getId().equals(m.getId())).forEach(o -> o.setActive(false));
        }
        m.setActive(active);
        m.setRevision(m.getRevision() + 1);
        return view(m, List.of());
    }

    @Transactional
    public View addItem(long id, ShelfRequest request) {
        Merchant m = merchant(id);
        if (request == null) throw ApiException.badRequest("Escolha um item.");
        MerchantItem line = new MerchantItem();
        line.setMerchant(m);
        if (request.custom() != null) {
            Item item = inventoryService.customItem(request.custom());
            fill(line, item, Boolean.TRUE.equals(request.custom().consumable()) ? "CONSUMABLE" : "OBJECT");
            line.setPrice(price(request.price() != null ? request.price() : request.custom().price() != null ? request.custom().price() : Integer.valueOf(0)));
        } else {
            RuleItem item = EquipmentRules.item(rules.catalog().equipment(), request.catalogId())
                    .orElseThrow(() -> ApiException.badRequest("Item desconhecido no catálogo."));
            if (m.getItems().stream().anyMatch(l -> item.id().equals(l.getCatalogId()))) throw ApiException.badRequest(item.name() + " já está à venda aqui.");
            line.setCatalogId(item.id());
            line.setName(item.name());
            line.setDescription(item.description());
            line.setEffect(StartingEquipmentService.summary(item));
            line.setRarity(Rarity.Common);
            line.setKind(catalogKind(item));
            line.setWeight(item.weight());
            line.setPrice(price(request.price() != null ? request.price() : catalogPrice(item)));
        }
        line.setStock(stock(request.stock()));
        m.getItems().add(shelf.save(line));
        m.setRevision(m.getRevision() + 1);
        return view(m, List.of());
    }

    @Transactional
    public View updateItem(long id, long lineId, ShelfUpdate request) {
        Merchant m = merchant(id);
        MerchantItem line = line(m, lineId);
        line.setPrice(price(request.price()));
        line.setStock(stock(request.stock()));
        m.setRevision(m.getRevision() + 1);
        return view(m, List.of());
    }

    @Transactional
    public View removeItem(long id, long lineId) {
        Merchant m = merchant(id);
        m.getItems().remove(line(m, lineId));
        m.setRevision(m.getRevision() + 1);
        return view(m, List.of());
    }

    @Transactional(readOnly = true)
    public List<TradeView> trades(long id) {
        return trades.findTop50ByMerchantOrderByIdDesc(merchant(id)).stream()
                .map(t -> new TradeView(t.getId(), t.getKind(), t.getCharacterName(), t.getItemName(), t.getQuantity(), t.getTotal(), t.getCreatedAt()))
                .toList();
    }

    // ---------- Jogador ----------

    @Transactional(readOnly = true)
    public Ping ping() {
        return merchants.findFirstByActiveTrueOrderByIdAsc()
                .map(m -> new Ping(m.getId(), m.getName(), m.getRevision()))
                .orElse(new Ping(null, null, null));
    }

    @Transactional(readOnly = true)
    public View active(Account account) {
        Merchant m = merchants.findFirstByActiveTrueOrderByIdAsc().orElseThrow(MerchantService::closed);
        return view(m, offers(m, characterService.findCharacterOf(account).orElse(null)));
    }

    // price: o preço que o jogador viu; se o mestre mudou nesse meio-tempo, nada é cobrado.
    @Transactional
    public TradeResult buy(Account account, Long lineId, Integer quantity, Integer price) {
        Merchant m = merchants.findFirstWithLockByActiveTrueOrderByIdAsc().orElseThrow(MerchantService::closed);
        Character c = characterService.characterOf(account);
        MerchantItem line = m.getItems().stream().filter(l -> l.getId().equals(lineId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Esse item não está mais à venda."));
        int qty = quantity(quantity);
        if (line.getStock() != null && line.getStock() < qty) {
            throw ApiException.badRequest(line.getStock() == 0 ? line.getName() + " esgotou." : "Só restam " + line.getStock() + " de " + line.getName() + ".");
        }
        if (price != null && price != line.getPrice()) throw ApiException.badRequest("O preço de " + line.getName() + " mudou para " + line.getPrice() + " PO.");
        long total = (long) line.getPrice() * qty;
        if (total > c.getGold()) throw ApiException.badRequest("Faltam " + (total - c.getGold()) + " PO: você tem " + c.getGold() + " PO.");
        c.setGold(c.getGold() - (int) total);
        characters.save(c);
        deliver(c, line, qty);
        if (line.getStock() != null) line.setStock(line.getStock() - qty);
        record(m, MerchantTrade.Kind.BUY, c, line.getName(), qty, (int) total);
        return new TradeResult(view(m, offers(m, c)), characterService.getSheet(account));
    }

    @Transactional
    public TradeResult sell(Account account, Long entryId, Integer quantity, Integer unitValue) {
        Merchant m = merchants.findFirstWithLockByActiveTrueOrderByIdAsc().orElseThrow(MerchantService::closed);
        Character c = characterService.characterOf(account);
        PlayerItems entry = inventory.findById(entryId == null ? -1 : entryId).filter(e -> e.getCharacter().getId().equals(c.getId()))
                .orElseThrow(() -> ApiException.notFound("Item não encontrado na sua ficha."));
        int has = entry.getQuantity() == null ? 1 : entry.getQuantity();
        int qty = quantity(quantity);
        if (qty > has) throw ApiException.badRequest("Você tem só " + has + ".");
        int unit = offer(m, entry.getItem());
        if (unit < 1) throw ApiException.badRequest(m.getName() + " não se interessa por " + entry.getItem().getName() + ".");
        if (unitValue != null && unitValue != unit) throw ApiException.badRequest("A oferta por " + entry.getItem().getName() + " mudou para " + unit + " PO.");
        long total = (long) unit * qty;
        if (c.getGold() + total > Integer.MAX_VALUE) throw ApiException.badRequest("Sua bolsa não comporta tanto ouro.");
        InventoryItemResponse sold = InventoryItemResponse.of(entry, inventoryService.consumable(entry.getItem()));
        Item item = entry.getItem();
        toShelf(m, item, sold, qty);
        c.setGold(c.getGold() + (int) total);
        if (qty == has) inventoryService.remove(c, entry);
        else {
            entry.setQuantity(has - qty);
            inventory.save(entry);
            characters.save(c);
        }
        record(m, MerchantTrade.Kind.SELL, c, sold.name(), qty, (int) total);
        return new TradeResult(view(m, offers(m, c)), characterService.getSheet(account));
    }

    // ---------- Apoio ----------

    private void deliver(Character c, MerchantItem line, int qty) {
        if (line.getItem() != null) {
            equipment.add(c, line.getItem(), qty);
            return;
        }
        EquipmentRules.item(rules.catalog().equipment(), line.getCatalogId())
                .orElseThrow(() -> ApiException.badRequest(line.getName() + " saiu do catálogo."));
        equipment.give(c, List.of(new EquipmentLine(line.getCatalogId(), line.getName(), qty, "Mercador")));
    }

    // O item vendido entra no estoque de uma linha igual (sem limite continua sem limite) ou abre uma linha nova.
    private void toShelf(Merchant m, Item item, InventoryItemResponse sold, int qty) {
        MerchantItem line = lineOf(m, item);
        if (line != null) {
            if (line.getStock() != null) line.setStock(Math.min(line.getStock() + qty, InventoryService.MAX_QUANTITY));
            return;
        }
        line = new MerchantItem();
        line.setMerchant(m);
        fill(line, item, sold.kind());
        line.setCatalogId(item.getCatalogId());
        line.setPrice(item.getPrice() == null ? 0 : item.getPrice());
        line.setStock(Math.min(qty, InventoryService.MAX_QUANTITY));
        m.getItems().add(shelf.save(line));
    }

    private static void fill(MerchantItem line, Item item, String kind) {
        line.setItem(item);
        line.setName(item.getName());
        line.setDescription(item.getItemDescription());
        line.setEffect(item.getEffect());
        line.setRarity(item.getRarity());
        line.setKind(kind);
        line.setWeight(item.getWeight());
    }

    private static MerchantItem lineOf(Merchant m, Item item) {
        return m.getItems().stream()
                .filter(l -> (l.getItem() != null && l.getItem().getId().equals(item.getId()))
                        || (l.getCatalogId() != null && l.getCatalogId().equals(item.getCatalogId())))
                .findFirst().orElse(null);
    }

    // Parte do preço que ele cobra pelo item, se o tem na prateleira (assim nunca paga mais do que cobra); senão, do preço do item.
    private static int offer(Merchant m, Item item) {
        MerchantItem line = lineOf(m, item);
        long base = line != null ? line.getPrice() : item.getPrice() == null ? 0 : item.getPrice();
        return (int) (base * m.getBuyRate() / 100);
    }

    private List<Offer> offers(Merchant m, Character c) {
        if (c == null) return List.of();
        return inventory.findByCharacterOrderByIdAsc(c).stream()
                .map(e -> new Offer(e.getId(), offer(m, e.getItem())))
                .filter(o -> o.unitValue() > 0)
                .toList();
    }

    private void record(Merchant m, MerchantTrade.Kind kind, Character c, String itemName, int qty, int total) {
        MerchantTrade t = new MerchantTrade();
        t.setMerchant(m);
        t.setKind(kind);
        t.setCharacterName(c.getCharacterName());
        t.setItemName(itemName);
        t.setQuantity(qty);
        t.setTotal(total);
        t.setCreatedAt(Instant.now());
        trades.save(t);
        m.setRevision(m.getRevision() + 1);
    }

    private static void apply(Merchant m, MerchantRequest r) {
        if (r == null || r.name() == null || r.name().isBlank()) throw ApiException.badRequest("Dê um nome ao mercador.");
        if (r.name().trim().length() > 80) throw ApiException.badRequest("O nome do mercador vai até 80 caracteres.");
        if (r.greeting() != null && r.greeting().length() > 500) throw ApiException.badRequest("A fala do mercador vai até 500 caracteres.");
        if (r.buyRate() != null && (r.buyRate() < 0 || r.buyRate() > 100)) throw ApiException.badRequest("O quanto ele paga vai de 0 a 100%.");
        m.setName(r.name().trim());
        m.setGreeting(r.greeting() == null || r.greeting().isBlank() ? null : r.greeting().trim());
        m.setImage(image(r.image()));
        m.setBuyRate(r.buyRate() == null ? 50 : r.buyRate());
    }

    private static String image(String image) {
        if (image == null || image.isBlank()) return null;
        if (image.length() > Merchant.MAX_IMAGE) throw ApiException.badRequest("A imagem é grande demais.");
        boolean link = image.length() <= 1000 && IMAGE_LINK.matcher(image).matches();
        if (!link && !embedded(image)) throw ApiException.badRequest("A imagem deve ser PNG, JPEG, WebP ou GIF, ou um link http(s).");
        return image;
    }

    private static boolean embedded(String image) {
        var header = IMAGE_HEADER.matcher(image);
        if (!header.find()) return false;
        return image.substring(header.end()).chars()
                .allMatch(ch -> (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '+' || ch == '/' || ch == '=');
    }

    // Em PO inteiros; o que custa menos de 1 PO no livro sai por 1 (o mestre ajusta na prateleira).
    private static int catalogPrice(RuleItem item) {
        return item.priceCp() == null ? 0 : Math.max(1, (int) Math.ceil(item.priceCp() / 100.0));
    }

    private String catalogKind(RuleItem item) {
        if ("WEAPON".equals(item.kind()) || "ARMOR".equals(item.kind())) return item.kind();
        return EquipmentRules.consumable(item) ? "CONSUMABLE" : "OBJECT";
    }

    private static int price(Integer price) {
        if (price == null || price < 0 || price > MAX_PRICE) throw ApiException.badRequest("O preço vai de 0 a " + MAX_PRICE + " PO.");
        return price;
    }

    private static Integer stock(Integer stock) {
        if (stock != null && (stock < 0 || stock > InventoryService.MAX_QUANTITY)) throw ApiException.badRequest("O estoque vai de 0 a " + InventoryService.MAX_QUANTITY + ".");
        return stock;
    }

    private static int quantity(Integer quantity) {
        if (quantity == null || quantity < 1 || quantity > InventoryService.MAX_QUANTITY) throw ApiException.badRequest("A quantidade vai de 1 a " + InventoryService.MAX_QUANTITY + ".");
        return quantity;
    }

    private static ApiException closed() {
        return ApiException.notFound("Nenhum mercador está aberto agora.");
    }

    private Merchant merchant(long id) {
        return merchants.findById(id).orElseThrow(() -> ApiException.notFound("Mercador não encontrado."));
    }

    private static MerchantItem line(Merchant m, long lineId) {
        return m.getItems().stream().filter(l -> l.getId() == lineId).findFirst()
                .orElseThrow(() -> ApiException.notFound("Item não encontrado neste mercador."));
    }

    private static View view(Merchant m, List<Offer> offers) {
        List<Line> items = m.getItems().stream()
                .map(l -> new Line(l.getId(), l.getCatalogId(), l.getName(), l.getDescription(), l.getEffect(), l.getRarity(), l.getKind(), l.getWeight(), l.getPrice(), l.getStock()))
                .toList();
        return new View(m.getId(), m.getName(), m.getGreeting(), m.getImage(), m.getBuyRate(), m.isActive(), m.getRevision(), items, offers);
    }
}
