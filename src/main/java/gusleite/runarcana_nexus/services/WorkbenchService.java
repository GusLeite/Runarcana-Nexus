package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.enums.Rarity;
import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.items.Consumable;
import gusleite.runarcana_nexus.model.items.Item;
import gusleite.runarcana_nexus.model.journal.JournalEntry;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.record.CraftResponse;
import gusleite.runarcana_nexus.record.CreationPreview.EquipmentLine;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.ItemRepository;
import gusleite.runarcana_nexus.rules.RuleCatalog;
import gusleite.runarcana_nexus.rules.RuleFormulas;
import gusleite.runarcana_nexus.rules.RuleItem;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

// Bancada de fabricação: as fórmulas que a ficha sabe fazer (as de nível 0 dos ofícios dela, as marcadas pelo mestre e
// as Fórmulas Gerais que citam um ofício dela) e a fabricação em si. Fabricar paga os materiais (metade do valor da
// fórmula, em PO para cima) e rola d20 + bônus do ofício aqui no servidor contra a CD:
//  - d20 na margem de Obra-Prima (20, menos o que Artífice etc. diminuem): Obra-prima, com o texto do 20 natural;
//  - total >= CD: o item vai para a mochila;
//  - falha por menos de 5: metade dos materiais volta;
//  - falha por 5 ou mais (ou 1 natural): os materiais se perdem.
// Fórmula com CD ou valor "*"/variável fica na bancada só para consulta ("combine com o mestre").
@Service
public class WorkbenchService {

    public enum Outcome { MASTERWORK, SUCCESS, FAILED, RUINED }

    // dcs/values: por grau, quando a fórmula tem vários ("13, 15, 17"; o último vale para os graus seguintes);
    // tiers = quantos graus (1 = fórmula comum).
    public record Recipe(String key, String name, String craftId, String craftName, int level, String discipline,
                         String prerequisite, String dcText, String valueText, List<Integer> dcs, List<Integer> values, int tiers,
                         String component, String time, String description, String natural20, Integer bonus,
                         int masterworkAt, boolean consumable, boolean craftable, String note) {}

    public record Workbench(int gold, String rule, List<Recipe> recipes) {}

    public record CraftRequest(String key, Integer tier) {}

    public record CraftResult(String key, String name, int tier, int d20, int bonus, int total, int dc, int masterworkAt,
                              Outcome outcome, int cost, int refund, String item, CharacterSheetResponse sheet) {}

    private static final Pattern NUMBER = Pattern.compile("\\d[\\d.]*");
    private static final Pattern CONSUMABLE_NAME = Pattern.compile(
            "po[cç][aã]o|elixir|frasco|bomba|[oó]leo|veneno|t[oô]nico|ant[ií]doto|flecha|virote|muni[cç][aã]o|ra[cç][aã]o|"
                    + "unguento|b[aá]lsamo|ch[aá]\\b|s[ií]ntese|tinta|explosivo|granada|incenso|cerveja|vinho|hidromel|refei[cç]",
            Pattern.CASE_INSENSITIVE);
    private static final Set<String> CONSUMABLE_CRAFTS = Set.of("alquimista", "apotecario", "cozinheiro", "fermentador");

    private final FormulaService formulas;
    private final RuleCatalogService rules;
    private final CharacterService characterService;
    private final CharacterRepository characters;
    private final ItemRepository items;
    private final StartingEquipmentService equipment;
    private final JournalService journal;
    private final RollService rolls;
    private Random random = new Random();

    public WorkbenchService(FormulaService formulas, RuleCatalogService rules, CharacterService characterService,
                            CharacterRepository characters, ItemRepository items, StartingEquipmentService equipment,
                            JournalService journal, RollService rolls) {
        this.formulas = formulas;
        this.rules = rules;
        this.characterService = characterService;
        this.characters = characters;
        this.items = items;
        this.equipment = equipment;
        this.journal = journal;
        this.rolls = rolls;
    }

    @Transactional(readOnly = true)
    public Workbench of(Account account) {
        Character c = characterService.characterOf(account);
        return new Workbench(c.getGold(), formulas.catalog().rule(), recipes(c, characterService.getSheet(account).crafts()));
    }

    @Transactional
    public CraftResult craft(Account account, CraftRequest request) {
        if (request == null || request.key() == null) throw ApiException.badRequest("Escolha a fórmula.");
        Character c = characterService.characterOf(account);
        Recipe r = recipes(c, characterService.getSheet(account).crafts()).stream()
                .filter(x -> x.key().equals(request.key())).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Você não conhece essa fórmula."));
        if (!r.craftable()) throw ApiException.badRequest(r.note());
        int tier = request.tier() == null ? 0 : request.tier();
        if (tier < 0 || tier >= Math.max(1, r.tiers())) throw ApiException.badRequest("Grau inválido para " + r.name() + ".");
        int dc = r.dcs().get(Math.min(tier, r.dcs().size() - 1));
        int value = r.values().get(Math.min(tier, r.values().size() - 1));
        int cost = materials(value);
        if (cost > c.getGold()) throw ApiException.badRequest("Os materiais custam " + cost + " PO: você tem " + c.getGold() + " PO.");
        int bonus = r.bonus() == null ? 0 : r.bonus();
        int d20 = random.nextInt(1, 21);
        int total = d20 + bonus;
        Outcome outcome = outcome(d20, total, dc, r.masterworkAt());
        int refund = outcome == Outcome.FAILED ? cost / 2 : 0;
        c.setGold(c.getGold() - cost + refund);
        characters.save(c);
        String label = r.name() + (r.tiers() > 1 ? " (grau " + (tier + 1) + ")" : "");
        String made = null;
        if (outcome == Outcome.SUCCESS || outcome == Outcome.MASTERWORK) {
            made = deliver(c, r, tier, label, value, outcome == Outcome.MASTERWORK);
            journal.record(JournalEntry.Kind.LOOT, c, c.getCharacterName() + " fabricou " + made);
        }
        rolls.recordCheck(account, "Fabricação: " + label + " (CD " + dc + ")", bonus, d20);
        return new CraftResult(r.key(), label, tier, d20, bonus, total, dc, r.masterworkAt(), outcome, cost, refund, made,
                characterService.getSheet(account));
    }

    // Só para os testes: um sorteio fixo.
    public void setRandom(Random random) {
        this.random = random;
    }

    // ---------- Regras (puras, testadas à parte) ----------

    static Outcome outcome(int d20, int total, int dc, int masterworkAt) {
        if (d20 >= masterworkAt) return Outcome.MASTERWORK;
        if (d20 != 1 && total >= dc) return Outcome.SUCCESS;
        if (d20 == 1 || total <= dc - 5) return Outcome.RUINED;
        return Outcome.FAILED;
    }

    // Materiais = metade do valor de mercado, em PO para cima.
    static int materials(int value) {
        return (value + 1) / 2;
    }

    // "13" → [13]; "13, 15, 17" → [13, 15, 17]; "*", "Variável", nulo → vazio. "10.000 PO" → 10000.
    static List<Integer> numbers(String text) {
        List<Integer> out = new ArrayList<>();
        if (text == null) return out;
        Matcher m = NUMBER.matcher(text);
        while (m.find()) {
            String digits = m.group().replace(".", "");
            if (digits.isEmpty() || digits.length() > 9) continue;
            out.add(Integer.parseInt(digits));
        }
        return out;
    }

    // Valor em PO, quando começa com o número ("25 PO", "50 PO (10 doses)", "15, 35, 60 PO"). Em PP ou PC vira PO
    // para cima, no mínimo 1 ("5 PP" → 1), porque a bolsa da ficha só guarda PO.
    static List<Integer> values(String text) {
        if (text == null || !text.trim().matches("^\\d.*")) return List.of();
        String head = text.contains("(") ? text.substring(0, text.indexOf('(')) : text;
        if (head.contains("+")) head = head.substring(0, head.indexOf('+'));
        Matcher unit = Pattern.compile("\\b(PO|PP|PC)\\b").matcher(head.toUpperCase(Locale.ROOT));
        if (!unit.find()) return List.of();
        int per = switch (unit.group(1)) {
            case "PP" -> 10;
            case "PC" -> 100;
            default -> 1;
        };
        return numbers(head).stream().map(n -> per == 1 ? n : Math.max(1, (n + per - 1) / per)).toList();
    }

    static String normalize(String s) {
        return s == null ? "" : Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }

    // Fórmula Geral "Chaveiro, joalheiro, artesanato (carpinteiro...)": vale para quem tem um desses ofícios.
    static boolean mentions(String craftsText, String craftName) {
        String text = normalize(craftsText);
        String name = normalize(craftName);
        return !name.isEmpty() && Pattern.compile("\\b" + Pattern.quote(name) + "\\b").matcher(text).find();
    }

    // ---------- Apoio ----------

    private List<Recipe> recipes(Character c, List<CraftResponse> crafts) {
        Map<String, RuleCatalog.Craft> catalogById = rules.catalog().craftsOrEmpty().stream()
                .collect(Collectors.toMap(RuleCatalog.Craft::id, Function.identity(), (a, b) -> a));
        List<Recipe> out = new ArrayList<>();
        for (CraftResponse k : crafts) {
            if (k.id() == null) continue;
            for (RuleFormulas.Formula f : formulas.catalog().craftsOrEmpty().getOrDefault(k.id(), List.of())) {
                String key = k.id() + ":" + f.id();
                if (f.level() != null && f.level() == 0 || c.getFormulas().contains(key)) out.add(recipe(key, f, k));
            }
        }
        for (RuleFormulas.Formula f : formulas.catalog().generalOrEmpty()) {
            crafts.stream().filter(k -> k.id() != null && catalogById.containsKey(k.id()) && mentions(f.crafts(), k.name()))
                    .max(Comparator.comparingInt(k -> k.bonus() == null ? Integer.MIN_VALUE : k.bonus()))
                    .ifPresent(k -> out.add(recipe("general:" + f.id(), f, k)));
        }
        out.sort(Comparator.comparing(Recipe::craftName).thenComparingInt(Recipe::level).thenComparing(Recipe::name));
        return out;
    }

    private static Recipe recipe(String key, RuleFormulas.Formula f, CraftResponse k) {
        List<Integer> dcs = numbers(f.dc());
        List<Integer> values = values(f.value());
        String note = null;
        if (dcs.isEmpty()) note = "A CD de " + f.name() + " varia: combine com o mestre.";
        else if (values.isEmpty()) note = "O valor de " + f.name() + " varia: combine com o mestre.";
        boolean consumable = CONSUMABLE_CRAFTS.contains(k.id()) || CONSUMABLE_NAME.matcher(f.name()).find();
        return new Recipe(key, f.name(), k.id(), k.name(), f.level() == null ? 0 : f.level(), f.discipline(), f.prerequisite(),
                f.dc(), f.value(), dcs, values, Math.max(dcs.size(), values.size()), f.component(), f.time(), f.description(), f.natural20(), k.bonus(),
                20 - Math.max(0, k.masterwork()), consumable, note == null, note);
    }

    // O item fabricado: o do catálogo, se tiver o mesmo nome; senão um item da fórmula (um por fórmula e grau, achado
    // depois pelo catalogId). A Obra-prima é um item à parte, Incomum, com o texto do 20 natural no efeito.
    private String deliver(Character c, Recipe r, int tier, String label, int value, boolean masterwork) {
        if (!masterwork) {
            Optional<RuleItem> same = catalogItem(r.name());
            if (same.isPresent()) {
                equipment.give(c, List.of(new EquipmentLine(same.get().id(), same.get().name(), 1, "Bancada")));
                return same.get().name();
            }
        }
        String name = label + (masterwork ? " (Obra-prima)" : "");
        String id = "formula:" + r.key() + (r.tiers() > 1 ? ":" + (tier + 1) : "") + (masterwork ? ":obra-prima" : "");
        Item item = items.findFirstByCatalogId(id).orElseGet(() -> {
            Item i = r.consumable() ? new Consumable() : new gusleite.runarcana_nexus.model.items.Object();
            i.setCatalogId(id);
            i.setName(name.length() > 120 ? name.substring(0, 120) : name);
            i.setItemDescription(clip(r.description()));
            i.setEffect(masterwork && r.natural20() != null ? clip("Obra-prima: " + r.natural20()) : null);
            i.setPrice(masterwork ? value * 2 : value);
            i.setRarity(masterwork ? Rarity.Uncommon : Rarity.Common);
            return items.save(i);
        });
        equipment.add(c, item, 1);
        return name;
    }

    private Optional<RuleItem> catalogItem(String name) {
        String n = normalize(name);
        if (rules.catalog().equipment() == null) return Optional.empty();
        return rules.catalog().equipment().itemsOrEmpty().stream()
                .filter(i -> !"PACK".equals(i.kind()) && normalize(i.name()).equals(n)).findFirst();
    }

    private static String clip(String s) {
        return s == null ? null : s.length() > 4000 ? s.substring(0, 3997) + "..." : s;
    }
}
