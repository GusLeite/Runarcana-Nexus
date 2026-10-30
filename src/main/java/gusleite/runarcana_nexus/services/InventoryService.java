package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.items.Consumable;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CreationPreview.EquipmentLine;
import gusleite.runarcana_nexus.record.InventoryItemResponse;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.ItemRepository;
import gusleite.runarcana_nexus.repository.PlayerItemsRepository;
import gusleite.runarcana_nexus.rules.RuleItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Inventário, ouro e inspiração da ficha pronta (decisão da mesa): o mestre dá e tira itens e ouro e liga a inspiração;
// o jogador só gasta (1 de um consumível, ouro, a inspiração acesa).
@Service
public class InventoryService {

    static final int MAX_QUANTITY = 9999;

    private final CharacterRepository characters;
    private final PlayerItemsRepository inventory;
    private final ItemRepository items;
    private final StartingEquipmentService equipment;
    private final CharacterService characterService;
    private final RuleCatalogService rules;

    public InventoryService(CharacterRepository characters, PlayerItemsRepository inventory, ItemRepository items,
                            StartingEquipmentService equipment, CharacterService characterService, RuleCatalogService rules) {
        this.characters = characters;
        this.inventory = inventory;
        this.items = items;
        this.equipment = equipment;
        this.characterService = characterService;
        this.rules = rules;
    }

    // O que o mestre vê e edita de uma ficha.
    public record MasterInventory(long characterId, String characterName, int gold, boolean inspiration, List<InventoryItemResponse> items) {}

    // Item livre (loot fora do catálogo).
    public record CustomItem(String name, String description, String effect, Double weight, Integer price, Rarity rarity,
                             Integer quantity, Boolean consumable) {}

    // ---------- Mestre ----------

    @Transactional(readOnly = true)
    public MasterInventory of(long characterId) {
        return view(character(characterId));
    }

    // Item do rules/itens.json; conjunto de equipamento entra aberto, e item que a ficha já tem soma na mesma linha.
    @Transactional
    public MasterInventory addCatalog(long characterId, String catalogId, Integer quantity) {
        Character c = character(characterId);
        RuleItem item = EquipmentRules.item(rules.catalog().equipment(), catalogId)
                .orElseThrow(() -> ApiException.badRequest("Item desconhecido no catálogo."));
        equipment.give(c, List.of(new EquipmentLine(item.id(), item.name(), quantity(quantity), "Mestre")));
        return view(c);
    }

    @Transactional
    public MasterInventory addCustom(long characterId, CustomItem request) {
        Character c = character(characterId);
        if (request == null || request.name() == null || request.name().isBlank()) throw ApiException.badRequest("Dê um nome ao item.");
        if (request.name().trim().length() > 120) throw ApiException.badRequest("O nome do item vai até 120 caracteres.");
        if (request.weight() != null && request.weight() < 0) throw ApiException.badRequest("O peso não pode ser negativo.");
        if (request.price() != null && request.price() < 0) throw ApiException.badRequest("O preço não pode ser negativo.");
        if (tooLong(request.description()) || tooLong(request.effect())) throw ApiException.badRequest("Descrição e efeito vão até 4000 caracteres.");
        Item item = Boolean.TRUE.equals(request.consumable()) ? new Consumable() : new gusleite.runarcana_nexus.model.items.Object();
        item.setName(request.name().trim());
        item.setItemDescription(blankToNull(request.description()));
        item.setEffect(blankToNull(request.effect()));
        item.setWeight(request.weight());
        item.setPrice(request.price());
        item.setRarity(request.rarity() == null ? Rarity.Common : request.rarity());
        PlayerItems entry = new PlayerItems();
        entry.setCharacter(c);
        entry.setItem(items.save(item));
        entry.setQuantity(quantity(request.quantity()));
        inventory.save(entry);
        return view(c);
    }

    // Quantidade nova; 0 tira o item da ficha.
    @Transactional
    public MasterInventory setQuantity(long characterId, long entryId, Integer quantity) {
        Character c = character(characterId);
        PlayerItems entry = entry(c, entryId);
        if (quantity == null || quantity < 0 || quantity > MAX_QUANTITY) throw ApiException.badRequest("A quantidade vai de 0 a " + MAX_QUANTITY + ".");
        if (quantity == 0) remove(c, entry);
        else {
            entry.setQuantity(quantity);
            inventory.save(entry);
        }
        return view(c);
    }

    @Transactional
    public MasterInventory delete(long characterId, long entryId) {
        Character c = character(characterId);
        remove(c, entry(c, entryId));
        return view(c);
    }

    @Transactional
    public MasterInventory setGold(long characterId, Integer gold) {
        Character c = character(characterId);
        if (gold == null || gold < 0) throw ApiException.badRequest("O ouro não pode ser negativo.");
        c.setGold(gold);
        characters.save(c);
        return view(c);
    }

    @Transactional
    public MasterInventory setInspiration(long characterId, Boolean inspiration) {
        Character c = character(characterId);
        if (inspiration == null) throw ApiException.badRequest("Informe se o personagem tem inspiração.");
        c.setInspiration(inspiration ? 1 : 0);
        characters.save(c);
        return view(c);
    }

    // ---------- Jogador ----------

    @Transactional
    public CharacterSheetResponse use(Account account, long entryId) {
        Character c = characterService.characterOf(account);
        PlayerItems entry = entry(c, entryId);
        if (!consumable(entry.getItem())) throw ApiException.badRequest("Esse item não é consumível.");
        int left = (entry.getQuantity() == null ? 1 : entry.getQuantity()) - 1;
        if (left <= 0) remove(c, entry);
        else {
            entry.setQuantity(left);
            inventory.save(entry);
        }
        return characterService.getSheet(account);
    }

    @Transactional
    public CharacterSheetResponse spendGold(Account account, Integer amount) {
        Character c = characterService.characterOf(account);
        if (amount == null || amount < 1) throw ApiException.badRequest("Informe quanto ouro gastar (1 ou mais).");
        if (amount > c.getGold()) throw ApiException.badRequest("Você tem só " + c.getGold() + " PO.");
        c.setGold(c.getGold() - amount);
        characters.save(c);
        return characterService.getSheet(account);
    }

    @Transactional
    public CharacterSheetResponse useInspiration(Account account) {
        Character c = characterService.characterOf(account);
        if (c.getInspiration() < 1) throw ApiException.badRequest("Você não tem inspiração para gastar.");
        c.setInspiration(0);
        characters.save(c);
        return characterService.getSheet(account);
    }

    // ---------- Apoio ----------

    // Consumível: criado como Consumable (item livre, ou do catálogo depois desta mudança) ou marcado no catálogo
    // (as linhas de Item antigas foram criadas como objeto comum).
    boolean consumable(Item item) {
        return EquipmentRules.consumable(rules.catalog().equipment(), item);
    }

    // Tira a linha e, se era a armadura ou o escudo em uso, a ficha volta ao padrão (a maior CA, o maior escudo).
    private void remove(Character c, PlayerItems entry) {
        String key = "ITEM:" + entry.getId();
        if (key.equals(c.getDefense())) c.setDefense(null);
        if (key.equals(c.getShield())) c.setShield(null);
        characters.save(c);
        inventory.delete(entry);
    }

    private Character character(long id) {
        return characters.findById(id).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
    }

    private PlayerItems entry(Character c, long entryId) {
        return inventory.findById(entryId).filter(e -> e.getCharacter().getId().equals(c.getId()))
                .orElseThrow(() -> ApiException.notFound("Item não encontrado nesta ficha."));
    }

    private MasterInventory view(Character c) {
        List<InventoryItemResponse> list = inventory.findByCharacterOrderByIdAsc(c).stream()
                .map(e -> InventoryItemResponse.of(e, consumable(e.getItem())))
                .toList();
        return new MasterInventory(c.getId(), c.getCharacterName(), c.getGold(), c.getInspiration() > 0, list);
    }

    private static int quantity(Integer quantity) {
        if (quantity == null) return 1;
        if (quantity < 1 || quantity > MAX_QUANTITY) throw ApiException.badRequest("A quantidade vai de 1 a " + MAX_QUANTITY + ".");
        return quantity;
    }

    private static boolean tooLong(String s) {
        return s != null && s.length() > 4000;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
