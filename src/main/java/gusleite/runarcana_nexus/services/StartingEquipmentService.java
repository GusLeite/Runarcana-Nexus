package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.ArmorWeight;
import gusleite.runarcana_nexus.enums.Attribute;
import gusleite.runarcana_nexus.enums.DamageType;
import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.enums.WeaponCategory;
import gusleite.runarcana_nexus.enums.WeaponProperty;
import gusleite.runarcana_nexus.model.items.Armor;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.items.Weapon;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.model.player.PlayerItems;
import gusleite.runarcana_nexus.record.CreationPreview.EquipmentLine;
import gusleite.runarcana_nexus.repository.ItemRepository;
import gusleite.runarcana_nexus.repository.PlayerItemsRepository;
import gusleite.runarcana_nexus.rules.RuleItem;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Coloca o equipamento inicial da criação no inventário. Cada item do catálogo (rules/itens.json) vira uma linha de
// Item (Weapon, Armor ou um objeto comum) na primeira vez, achada depois pelo catalogId; os conjuntos de equipamento
// entram abertos (o que vem dentro deles). Armaduras viram opção de defesa da ficha (ArmorClassCalculator).
@Service
public class StartingEquipmentService {

    // "1d8 r/ 1d6 p" → 1, 8, cortante (o primeiro dano da arma).
    private static final Pattern FIRST_DAMAGE = Pattern.compile("^(\\d+)d(\\d+)\\s*([rpc])?", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEADING_INT = Pattern.compile("^(\\d+)");
    private static final Map<String, WeaponProperty> PROPERTIES = Map.ofEntries(
            Map.entry("acuidade", WeaponProperty.FINESSE), Map.entry("arremesso", WeaponProperty.THROWN),
            Map.entry("duas mãos", WeaponProperty.TWO_HANDED), Map.entry("leve", WeaponProperty.LIGHT),
            Map.entry("pesada", WeaponProperty.HEAVY), Map.entry("pesado", WeaponProperty.HEAVY),
            Map.entry("versátil", WeaponProperty.VERSATILE), Map.entry("munição", WeaponProperty.AMMUNITION),
            Map.entry("recarga", WeaponProperty.RELOAD), Map.entry("explosivo", WeaponProperty.EXPLOSIVE),
            Map.entry("dispersão", WeaponProperty.SCATTER), Map.entry("extensão", WeaponProperty.REACH));

    private final RuleCatalogService rules;
    private final ItemRepository items;
    private final PlayerItemsRepository inventory;

    public StartingEquipmentService(RuleCatalogService rules, ItemRepository items, PlayerItemsRepository inventory) {
        this.rules = rules;
        this.items = items;
        this.inventory = inventory;
    }

    public void give(Character character, List<EquipmentLine> equipment) {
        // Mesmo item de fontes diferentes (duas tochas do conjunto + tochas avulsas) vira uma linha só.
        Map<String, Integer> totals = new LinkedHashMap<>();
        Map<String, String> loose = new LinkedHashMap<>();
        for (EquipmentLine line : equipment) open(line.item(), line.quantity(), totals, loose);
        totals.forEach((id, qty) -> EquipmentRules.item(rules.catalog().equipment(), id)
                .ifPresent(item -> add(character, itemFor(item), qty)));
        loose.forEach((name, qty) -> add(character, looseItem(name), Integer.parseInt(qty)));
    }

    private void open(String id, int quantity, Map<String, Integer> totals, Map<String, String> loose) {
        RuleItem item = EquipmentRules.item(rules.catalog().equipment(), id).orElse(null);
        if (item == null) return;
        if (!"PACK".equals(item.kind())) {
            totals.merge(id, quantity, Integer::sum);
            return;
        }
        for (RuleItem.Content c : item.contentsOrEmpty()) {
            int n = c.quantityOrOne() * quantity;
            if (c.item() != null) open(c.item(), n, totals, loose);
            else loose.merge(c.name(), String.valueOf(n), (a, b) -> String.valueOf(Integer.parseInt(a) + Integer.parseInt(b)));
        }
    }

    private void add(Character character, Item item, int quantity) {
        PlayerItems entry = new PlayerItems();
        entry.setCharacter(character);
        entry.setItem(item);
        entry.setQuantity(quantity);
        inventory.save(entry);
    }

    // O que vem num conjunto sem estar nas tabelas ("Caixa de esmolas"): objeto comum, um por nome.
    private Item looseItem(String name) {
        String key = "nome:" + name;
        return items.findFirstByCatalogId(key).orElseGet(() -> {
            Item item = new gusleite.runarcana_nexus.model.items.Object();
            item.setCatalogId(key);
            item.setName(name);
            item.setRarity(Rarity.Common);
            return items.save(item);
        });
    }

    private Item itemFor(RuleItem r) {
        return items.findFirstByCatalogId(r.id()).orElseGet(() -> items.save(build(r)));
    }

    private static Item build(RuleItem r) {
        Item item;
        switch (r.kind()) {
            case "WEAPON" -> {
                Weapon w = new Weapon();
                Matcher m = FIRST_DAMAGE.matcher(r.damage() == null ? "" : r.damage().trim());
                if (m.find()) {
                    w.setHitDiceQuantity(Integer.parseInt(m.group(1)));
                    w.setHitDice(Integer.parseInt(m.group(2)));
                    if (m.group(3) != null) w.setDamageType(switch (m.group(3).toLowerCase()) {
                        case "r" -> DamageType.S;
                        case "p" -> DamageType.P;
                        default -> DamageType.B;
                    });
                }
                List<String> groups = r.groupsOrEmpty();
                w.setCategory(groups.contains("arma-de-fogo") ? WeaponCategory.FIREARM : groups.contains("arma-marcial") ? WeaponCategory.MARTIAL
                        : groups.contains("arma-simples") ? WeaponCategory.SIMPLE : WeaponCategory.IMPROVISED);
                String props = r.properties() == null ? "" : r.properties().toLowerCase();
                PROPERTIES.forEach((word, p) -> { if (props.contains(word)) w.getProperties().add(p); });
                item = w;
            }
            case "ARMOR" -> {
                Armor a = new Armor();
                a.setArmorWeight(ArmorWeight.valueOf(r.armorWeight()));
                a.setArmorClass(r.armorClass());
                a.setModifierAttribute("NONE".equals(r.dexterity()) ? null : Attribute.DEXTERITY);
                Matcher rd = LEADING_INT.matcher(r.damageReduction() == null ? "" : r.damageReduction());
                a.setDamageReduction(rd.find() ? Integer.parseInt(rd.group(1)) : null);
                a.setNerfStealth(Boolean.TRUE.equals(r.stealthDisadvantage()));
                item = a;
            }
            default -> item = new gusleite.runarcana_nexus.model.items.Object();
        }
        item.setCatalogId(r.id());
        item.setName(r.name());
        item.setItemDescription(r.description());
        item.setEffect(summary(r));
        item.setRarity(Rarity.Common);
        item.setPrice(r.priceCp() == null ? null : Math.round(r.priceCp() / 100f));
        item.setWeight(r.weight());
        return item;
    }

    // As colunas da tabela do livro em uma linha ("1d8 r/ 1d6 p · Crítico x2 · Tontear · Versátil (1d10 r/ 1d8 p)").
    static String summary(RuleItem r) {
        List<String> parts = new ArrayList<>();
        switch (r.kind()) {
            case "WEAPON" -> {
                if (r.damage() != null) parts.add(r.damage());
                if (r.critical() != null) parts.add("Crítico " + r.critical());
                if (r.mastery() != null) parts.add("Maestria: " + r.mastery());
                if (r.misfire() != null) parts.add("Erro " + r.misfire());
                if (r.range() != null) parts.add("Alcance " + r.range());
                if (r.properties() != null) parts.add(r.properties());
            }
            case "ARMOR", "SHIELD" -> {
                if (r.armorClassText() != null) parts.add("CA " + r.armorClassText());
                if (r.damageReduction() != null) parts.add("RD " + r.damageReduction());
                if (r.exception() != null) parts.add("Exceção: " + r.exception());
                if (r.strength() != null) parts.add("Força " + r.strength());
                if (Boolean.TRUE.equals(r.stealthDisadvantage())) parts.add("Furtividade: desvantagem");
            }
            case "MOUNT", "VEHICLE" -> {
                if (r.speed() != null) parts.add("Deslocamento " + r.speed());
                if (r.capacity() != null) parts.add("Carga " + r.capacity());
            }
            default -> { }
        }
        if (r.quantity() != null) parts.add(r.quantity() + " unidades");
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }
}
