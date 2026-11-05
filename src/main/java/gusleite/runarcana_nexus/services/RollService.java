package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.rolls.TableRoll;
import gusleite.runarcana_nexus.model.rolls.TableRoll.Kind;
import gusleite.runarcana_nexus.model.rolls.TableRoll.Visibility;
import gusleite.runarcana_nexus.repository.TableRollRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.random.RandomGenerator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

// Rolagens da mesa: o servidor sorteia (ninguém "rola de novo" no console), guarda e avisa o canal ao vivo (tópico rolls).
@Service
public class RollService {

    public static final int DEFAULT_LIMIT = 30;
    public static final int MAX_LIMIT = 100;
    static final int MAX_DICE = 100;
    static final int MAX_SIDES = 1000;
    static final int MAX_BONUS = 1000;
    static final int MAX_MOD = 100;
    private static final Pattern DICE = Pattern.compile("^\\s*(\\d{1,3})\\s*d\\s*(\\d{1,4})\\s*(?:([+-])\\s*(\\d{1,4}))?\\s*$", Pattern.CASE_INSENSITIVE);

    public record RollRequest(String label, String kind, Integer mod, String mode, Integer critRange, String expr, String visibility) {}

    // hidden: rolagem secreta de outro (só quem rolou e o mestre veem os números); aí só vêm id, who, mine, hidden e createdAt.
    public record RollView(long id, String who, String username, boolean mine, boolean hidden, String visibility,
                           String kind, String label, String mode, Integer mod, Integer d20, Integer other, Integer critRange,
                           String expr, Integer count, Integer sides, Integer bonus, List<Integer> rolls, Integer total, Instant createdAt) {}

    private final TableRollRepository rolls;
    private final JournalService journal;
    private final LiveHub hub;
    private final RandomGenerator random = new SecureRandom();

    public RollService(TableRollRepository rolls, JournalService journal, LiveHub hub) {
        this.rolls = rolls;
        this.journal = journal;
        this.hub = hub;
    }

    @Transactional
    public RollView roll(Account account, RollRequest r) {
        String label = r.label() == null ? "" : r.label().trim();
        if (label.isEmpty()) throw ApiException.badRequest("Diga o que está sendo rolado.");
        if (label.length() > 120) throw ApiException.badRequest("O nome da rolagem pode ter até 120 caracteres.");
        Visibility visibility = parse(Visibility.class, r.visibility(), Visibility.TABLE, "Visibilidade inválida: TABLE ou PRIVATE.");
        Kind kind = parse(Kind.class, r.kind(), null, "Tipo de rolagem inválido: CHECK ou DICE.");
        TableRoll roll = base(account, label, kind, visibility);
        if (kind == Kind.CHECK) {
            int mod = r.mod() == null ? 0 : r.mod();
            if (Math.abs(mod) > MAX_MOD) throw ApiException.badRequest("Modificador fora do limite (±" + MAX_MOD + ").");
            String mode = r.mode() == null ? "normal" : r.mode();
            if (!mode.equals("normal") && !mode.equals("adv") && !mode.equals("dis")) throw ApiException.badRequest("Modo inválido: normal, adv ou dis.");
            int crit = r.critRange() == null ? 20 : r.critRange();
            if (crit < 2 || crit > 20) throw ApiException.badRequest("Margem de crítico inválida (2 a 20).");
            int a = d(20);
            Integer other = null;
            int keep = a;
            if (!mode.equals("normal")) {
                int b = d(20);
                keep = mode.equals("adv") ? Math.max(a, b) : Math.min(a, b);
                other = keep == a ? b : a;
            }
            fillCheck(roll, mod, mode, crit, keep, other);
        } else {
            Matcher m = DICE.matcher(r.expr() == null ? "" : r.expr());
            if (!m.matches()) throw ApiException.badRequest("Expressão de dados inválida (ex.: 2d6+3).");
            int count = Integer.parseInt(m.group(1));
            int sides = Integer.parseInt(m.group(2));
            int bonus = m.group(3) == null ? 0 : ("-".equals(m.group(3)) ? -1 : 1) * Integer.parseInt(m.group(4));
            if (count < 1 || count > MAX_DICE) throw ApiException.badRequest("São de 1 a " + MAX_DICE + " dados por rolagem.");
            if (sides < 2 || sides > MAX_SIDES) throw ApiException.badRequest("O dado precisa ter de 2 a " + MAX_SIDES + " faces.");
            if (Math.abs(bonus) > MAX_BONUS) throw ApiException.badRequest("Bônus fora do limite (±" + MAX_BONUS + ").");
            int[] dice = IntStream.range(0, count).map(i -> d(sides)).toArray();
            roll.setExpr(count + "d" + sides + (bonus == 0 ? "" : (bonus > 0 ? "+" : "-") + Math.abs(bonus)));
            roll.setDiceCount(count);
            roll.setDiceSides(sides);
            roll.setBonus(bonus);
            roll.setDice(Arrays.stream(dice).mapToObj(String::valueOf).collect(Collectors.joining(",")));
            roll.setTotal(Arrays.stream(dice).sum() + bonus);
        }
        return save(account, roll);
    }

    // Rolagem que outra regra já sorteou (ex.: pechincha), para entrar no histórico da mesa do mesmo jeito.
    @Transactional
    public RollView recordCheck(Account account, String label, int mod, int d20) {
        TableRoll roll = base(account, label, Kind.CHECK, Visibility.TABLE);
        fillCheck(roll, mod, "normal", 20, d20, null);
        return save(account, roll);
    }

    @Transactional(readOnly = true)
    public List<RollView> recent(Account viewer, Integer limit) {
        int size = limit == null ? DEFAULT_LIMIT : Math.max(1, Math.min(MAX_LIMIT, limit));
        return rolls.findByOrderByIdDesc(PageRequest.of(0, size)).stream().map(r -> view(viewer, r)).toList();
    }

    private TableRoll base(Account account, String label, Kind kind, Visibility visibility) {
        TableRoll roll = new TableRoll();
        roll.setAccount(account);
        roll.setWho(journal.nameOf(account));
        roll.setLabel(label);
        roll.setKind(kind);
        roll.setVisibility(visibility);
        roll.setCreatedAt(Instant.now());
        return roll;
    }

    private static void fillCheck(TableRoll roll, int mod, String mode, int crit, int d20, Integer other) {
        roll.setModifier(mod);
        roll.setMode(mode);
        roll.setCritRange(crit);
        roll.setD20(d20);
        roll.setOtherD20(other);
        roll.setTotal(d20 + mod);
    }

    private RollView save(Account account, TableRoll roll) {
        rolls.save(roll);
        // Avisa só depois do commit: quem recebe o aviso busca de novo e precisa achar a rolagem.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    hub.publish("rolls");
                }
            });
        } else {
            hub.publish("rolls");
        }
        return view(account, roll);
    }

    private int d(int sides) {
        return random.nextInt(1, sides + 1);
    }

    static RollView view(Account viewer, TableRoll r) {
        boolean mine = r.getAccount().getId().equals(viewer.getId());
        String username = r.getAccount().getUsername();
        if (r.getVisibility() == Visibility.PRIVATE && !mine && !viewer.isMaster()) {
            return new RollView(r.getId(), r.getWho(), username, false, true, r.getVisibility().name(),
                    null, null, null, null, null, null, null, null, null, null, null, null, null, r.getCreatedAt());
        }
        List<Integer> dice = r.getDice() == null || r.getDice().isEmpty() ? null
                : Arrays.stream(r.getDice().split(",")).map(Integer::valueOf).toList();
        boolean check = r.getKind() == Kind.CHECK;
        return new RollView(r.getId(), r.getWho(), username, mine, false, r.getVisibility().name(),
                r.getKind().name(), r.getLabel(), r.getMode(), check ? r.getModifier() : null, r.getD20(), r.getOtherD20(), r.getCritRange(),
                r.getExpr(), r.getDiceCount(), r.getDiceSides(), check ? null : r.getBonus(), dice, r.getTotal(), r.getCreatedAt());
    }

    private static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback, String error) {
        if (value == null || value.isBlank()) {
            if (fallback != null) return fallback;
            throw ApiException.badRequest(error);
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest(error);
        }
    }
}
