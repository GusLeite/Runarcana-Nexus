package gusleite.runarcana_nexus.services;

import gusleite.runarcana_nexus.exception.ApiException;
import gusleite.runarcana_nexus.model.auth.Account;
import gusleite.runarcana_nexus.model.combat.Combatant;
import gusleite.runarcana_nexus.model.combat.Combatant.Kind;
import gusleite.runarcana_nexus.model.combat.Encounter;
import gusleite.runarcana_nexus.model.combat.Encounter.Status;
import gusleite.runarcana_nexus.model.combat.Enemy;
import gusleite.runarcana_nexus.model.player.Character;
import gusleite.runarcana_nexus.record.CharacterResponse;
import gusleite.runarcana_nexus.record.TableCardResponse;
import gusleite.runarcana_nexus.repository.CharacterRepository;
import gusleite.runarcana_nexus.repository.EncounterRepository;
import gusleite.runarcana_nexus.repository.EnemyRepository;
import gusleite.runarcana_nexus.services.RollService.RollView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.random.RandomGenerator;
import java.util.stream.Collectors;

// Combate: o mestre mantém um bestiário (fichas de inimigo), monta confrontos com inimigos e personagens e ativa um
// por vez. Ativo, a ficha dos jogadores fica presa na aba COMBATE (só Magias e Inventário além dela). A iniciativa é
// sorteada no servidor (d20 + bônus): o mestre rola a dos inimigos (ou de todos) e cada jogador pode rolar a sua;
// o mestre ajusta qualquer número à mão. A ordem é: iniciativa maior, depois o bônus maior, personagens antes de inimigos.
@Service
public class CombatService {

    static final int MAX_COMBATANTS = 40;
    static final int MAX_COPIES = 20;
    static final int MAX_HP = 100_000;
    static final int MAX_AC = 60;
    static final int MAX_INITIATIVE = 99;
    static final int MAX_TEXT = 4000;

    public record EnemyRequest(String name, String image, Integer maxHp, Integer armorClass, Integer initiativeBonus, String speed,
                               Integer str, Integer dex, Integer con, Integer intel, Integer wis, Integer cha, String attacks, String notes) {}

    public record EnemyView(long id, String name, String image, int maxHp, int armorClass, int initiativeBonus, String speed,
                            int str, int dex, int con, int intel, int wis, int cha, String attacks, String notes) {}

    public record EnemyPick(Long enemyId, Integer count) {}

    // characterIds nulo = todos os personagens da mesa.
    public record EncounterRequest(String name, List<EnemyPick> enemies, List<Long> characterIds) {}

    public record AddRequest(Long enemyId, Integer count, Long characterId, Boolean hidden) {}

    // Campos nulos ficam como estão. clearInitiative tira a iniciativa (volta a "não rolou").
    public record CombatantUpdate(Integer initiative, Boolean clearInitiative, Integer currentHp, Boolean hidden, Boolean defeated, String name) {}

    // who: ENEMIES (padrão), PLAYERS, ALL ou MISSING (só quem ainda não tem iniciativa).
    public record InitiativeRequest(String who) {}

    // Para o jogador, inimigo vem sem números (PV, CA, bônus): só o estado ("Ferido"...). Personagens vêm completos.
    public record CombatantView(long id, Kind kind, Long characterId, Long enemyId, String name, String image,
                                Integer initiative, Integer initiativeD20, Integer initiativeBonus,
                                Integer currentHp, Integer maxHp, Integer tempHp, Integer armorClass, String health,
                                boolean hidden, boolean defeated, boolean mine,
                                List<String> conditions, Integer exhaustion, Integer deathSuccesses, Integer deathFailures,
                                String characterClass, String subclass, Integer level) {}

    // order: os combatentes na ordem dos turnos. master: a visão é a do mestre (com escondidos e números).
    public record EncounterView(long id, String name, Status status, int round, Long currentId, long revision,
                                Instant createdAt, Instant startedAt, Instant endedAt, boolean master, List<CombatantView> order) {}

    public record RolledInitiative(long id, String name, int d20, int bonus, int total) {}

    public record InitiativeResult(EncounterView encounter, List<RolledInitiative> rolled) {}

    public record PlayerRoll(EncounterView encounter, RollView roll) {}

    private final EnemyRepository enemies;
    private final EncounterRepository encounters;
    private final CharacterRepository characters;
    private final CharacterService characterService;
    private final RollService rolls;
    private RandomGenerator random = new SecureRandom();

    public CombatService(EnemyRepository enemies, EncounterRepository encounters, CharacterRepository characters,
                         CharacterService characterService, RollService rolls) {
        this.enemies = enemies;
        this.encounters = encounters;
        this.characters = characters;
        this.characterService = characterService;
        this.rolls = rolls;
    }

    // Testes fixam o d20.
    void setRandom(RandomGenerator random) {
        this.random = random;
    }

    // ---------- Bestiário (mestre) ----------

    @Transactional(readOnly = true)
    public List<EnemyView> enemies() {
        return enemies.findAllByOrderByNameAsc().stream().map(CombatService::enemyView).toList();
    }

    @Transactional
    public EnemyView createEnemy(EnemyRequest request) {
        Enemy e = new Enemy();
        apply(e, request);
        return enemyView(enemies.save(e));
    }

    @Transactional
    public EnemyView updateEnemy(long id, EnemyRequest request) {
        Enemy e = enemy(id);
        apply(e, request);
        return enemyView(e);
    }

    // Quem já está num confronto continua lá (é uma cópia); só perde a ligação com a ficha.
    @Transactional
    public void deleteEnemy(long id) {
        Enemy e = enemy(id);
        encounters.findAll().forEach(enc -> enc.getCombatants().stream()
                .filter(c -> e.getId().equals(c.getEnemyId())).forEach(c -> c.setEnemyId(null)));
        enemies.delete(e);
    }

    // ---------- Confrontos (mestre) ----------

    @Transactional(readOnly = true)
    public List<EncounterView> encounters() {
        Map<Long, TableCardResponse> cards = cards();
        return encounters.findTop30ByOrderByIdDesc().stream().map(e -> view(e, null, cards)).toList();
    }

    @Transactional(readOnly = true)
    public EncounterView encounterView(long id) {
        return view(encounter(id), null, cards());
    }

    @Transactional
    public EncounterView create(EncounterRequest request) {
        if (request == null) throw ApiException.badRequest("Monte o confronto.");
        Encounter e = new Encounter();
        e.setName(name(request.name(), "Dê um nome ao confronto."));
        e.setCreatedAt(Instant.now());
        List<Long> ids = request.characterIds() != null ? request.characterIds()
                : characters.findAll().stream().map(Character::getId).toList();
        for (Long characterId : ids) addPlayer(e, characterId);
        if (request.enemies() != null) {
            for (EnemyPick pick : request.enemies()) addEnemies(e, pick.enemyId(), pick.count(), false);
        }
        return view(encounters.save(e), null, cards());
    }

    @Transactional
    public EncounterView rename(long id, String name) {
        Encounter e = encounter(id);
        e.setName(name(name, "Dê um nome ao confronto."));
        return touched(e);
    }

    @Transactional
    public void delete(long id) {
        encounters.delete(encounter(id));
    }

    @Transactional
    public EncounterView add(long id, AddRequest request) {
        Encounter e = encounter(id);
        if (request == null) throw ApiException.badRequest("Escolha quem entra no confronto.");
        if (request.characterId() != null) addPlayer(e, request.characterId());
        else addEnemies(e, request.enemyId(), request.count(), Boolean.TRUE.equals(request.hidden()));
        return touched(e);
    }

    @Transactional
    public EncounterView remove(long id, long combatantId) {
        Encounter e = encounter(id);
        Combatant c = combatant(e, combatantId);
        // Se era a vez dele, passa para o próximo antes de sair.
        if (c.getId().equals(e.getCurrentId())) {
            List<Combatant> order = order(e.getCombatants(), cards());
            Combatant next = order.size() <= 1 ? null : step(order, c, 1).target();
            e.setCurrentId(next == null || next == c ? null : next.getId());
        }
        e.getCombatants().remove(c);
        return touched(e);
    }

    @Transactional
    public EncounterView update(long id, long combatantId, CombatantUpdate u) {
        Encounter e = encounter(id);
        Combatant c = combatant(e, combatantId);
        if (u == null) return view(e, null, cards());
        if (Boolean.TRUE.equals(u.clearInitiative())) {
            c.setInitiative(null);
            c.setInitiativeD20(null);
        } else if (u.initiative() != null) {
            int value = u.initiative();
            if (Math.abs(value) > MAX_INITIATIVE) throw ApiException.badRequest("Iniciativa fora do limite (±" + MAX_INITIATIVE + ").");
            // Ajuste à mão: o d20 que saiu deixa de valer (a não ser que o mestre só confirme o mesmo número).
            if (c.getInitiative() == null || c.getInitiative() != value) c.setInitiativeD20(null);
            c.setInitiative(value);
        }
        if (u.name() != null) c.setName(name(u.name(), "O nome não pode ficar vazio."));
        if (u.currentHp() != null) {
            if (c.getKind() == Kind.PLAYER) throw ApiException.badRequest("Os PV do personagem mudam na ficha dele.");
            c.setCurrentHp(Math.max(0, Math.min(c.getMaxHp(), u.currentHp())));
            if (u.defeated() == null) c.setDefeated(c.getCurrentHp() == 0);
        }
        if (u.defeated() != null) c.setDefeated(u.defeated());
        if (u.hidden() != null) {
            if (c.getKind() == Kind.PLAYER) throw ApiException.badRequest("Só inimigos ficam escondidos.");
            c.setHidden(u.hidden());
        }
        return touched(e);
    }

    // Ativar um fecha o que estiver ativo: a mesa tem um confronto por vez. Volta à rodada 1, na fase de iniciativa.
    @Transactional
    public EncounterView start(long id) {
        Encounter e = encounter(id);
        if (e.getCombatants().isEmpty()) throw ApiException.badRequest("Coloque alguém no confronto antes de ativar.");
        encounters.findByStatus(Status.ACTIVE).stream().filter(o -> !o.getId().equals(e.getId())).forEach(o -> {
            o.setStatus(Status.ENDED);
            o.setEndedAt(Instant.now());
            o.setRevision(o.getRevision() + 1);
        });
        if (e.getStatus() != Status.ACTIVE) {
            e.setStatus(Status.ACTIVE);
            e.setStartedAt(Instant.now());
            e.setEndedAt(null);
            e.setRound(1);
            e.setCurrentId(null);
        }
        return touched(e);
    }

    @Transactional
    public EncounterView end(long id) {
        Encounter e = encounter(id);
        e.setStatus(Status.ENDED);
        e.setEndedAt(Instant.now());
        return touched(e);
    }

    // Volta um confronto encerrado (ou ativo) a rascunho, com a iniciativa zerada, para reaproveitar.
    @Transactional
    public EncounterView reset(long id) {
        Encounter e = encounter(id);
        e.setStatus(Status.DRAFT);
        e.setRound(1);
        e.setCurrentId(null);
        e.setStartedAt(null);
        e.setEndedAt(null);
        e.getCombatants().forEach(c -> {
            c.setInitiative(null);
            c.setInitiativeD20(null);
            c.setDefeated(false);
            if (c.getKind() == Kind.ENEMY) c.setCurrentHp(c.getMaxHp());
        });
        return touched(e);
    }

    @Transactional
    public InitiativeResult rollInitiative(long id, InitiativeRequest request) {
        Encounter e = encounter(id);
        String who = request == null || request.who() == null ? "ENEMIES" : request.who();
        if (!List.of("ENEMIES", "PLAYERS", "ALL", "MISSING").contains(who)) throw ApiException.badRequest("Quem rola: ENEMIES, PLAYERS, ALL ou MISSING.");
        Map<Long, TableCardResponse> cards = cards();
        List<RolledInitiative> rolled = new ArrayList<>();
        for (Combatant c : e.getCombatants()) {
            boolean pick = switch (who) {
                case "ENEMIES" -> c.getKind() == Kind.ENEMY;
                case "PLAYERS" -> c.getKind() == Kind.PLAYER;
                case "MISSING" -> c.getInitiative() == null;
                default -> true;
            };
            if (!pick || c.isDefeated()) continue;
            int bonus = bonus(c, cards);
            int d20 = random.nextInt(1, 21);
            c.setInitiativeD20(d20);
            c.setInitiative(d20 + bonus);
            rolled.add(new RolledInitiative(c.getId(), c.getName(), d20, bonus, d20 + bonus));
        }
        return new InitiativeResult(touched(e), rolled);
    }

    // step 1 = próximo turno, -1 = volta um. Pula derrotados; passar do último abre a rodada seguinte.
    @Transactional
    public EncounterView turn(long id, int step) {
        Encounter e = encounter(id);
        if (e.getStatus() != Status.ACTIVE) throw ApiException.badRequest("Ative o confronto antes de passar os turnos.");
        List<Combatant> order = order(e.getCombatants(), cards()).stream().filter(c -> !c.isDefeated()).toList();
        if (order.isEmpty()) throw ApiException.badRequest("Não sobrou ninguém de pé para jogar o turno.");
        Combatant current = e.getCurrentId() == null ? null
                : e.getCombatants().stream().filter(c -> c.getId().equals(e.getCurrentId())).findFirst().orElse(null);
        if (current == null) {
            e.setCurrentId(order.getFirst().getId());
        } else {
            // O atual pode ter caído: conta a partir da posição dele na ordem completa.
            List<Combatant> all = order(e.getCombatants(), cards());
            Step s = step(all, current, step >= 0 ? 1 : -1);
            e.setCurrentId(s.target().getId());
            if (s.wrapped()) e.setRound(Math.max(1, e.getRound() + (step >= 0 ? 1 : -1)));
        }
        return touched(e);
    }

    // ---------- Mesa (todos) ----------

    // O confronto ativo na visão de quem pede (nulo = nenhum).
    @Transactional(readOnly = true)
    public EncounterView active(Account account) {
        return encounters.findFirstByStatusOrderByIdDesc(Status.ACTIVE).map(e -> view(e, account, cards())).orElse(null);
    }

    // O jogador rola a própria iniciativa uma vez; depois, só o mestre muda o número.
    @Transactional
    public PlayerRoll rollMine(Account account) {
        Encounter e = encounters.findFirstByStatusOrderByIdDesc(Status.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("Não há confronto ativo."));
        Character me = characterService.characterOf(account);
        Combatant c = e.getCombatants().stream().filter(x -> me.getId().equals(x.getCharacterId())).findFirst()
                .orElseThrow(() -> ApiException.badRequest("Seu personagem não está neste confronto."));
        if (c.getInitiative() != null) throw ApiException.badRequest("Você já tem iniciativa. Para mudar, fale com o mestre.");
        Map<Long, TableCardResponse> cards = cards();
        int bonus = bonus(c, cards);
        int d20 = random.nextInt(1, 21);
        c.setInitiativeD20(d20);
        c.setInitiative(d20 + bonus);
        e.setRevision(e.getRevision() + 1);
        RollView roll = rolls.recordCheck(account, "Iniciativa", bonus, d20);
        return new PlayerRoll(view(e, account, cards), roll);
    }

    // ---------- Regras ----------

    private record Step(Combatant target, boolean wrapped) {}

    // Anda na ordem a partir de "from", pulando derrotados (from pode estar derrotado).
    private static Step step(List<Combatant> all, Combatant from, int dir) {
        int n = all.size();
        int at = all.indexOf(from);
        boolean wrapped = false;
        for (int i = 1; i <= n; i++) {
            int raw = at + dir * i;
            if (raw >= n || raw < 0) wrapped = true;
            Combatant c = all.get(Math.floorMod(raw, n));
            if (!c.isDefeated()) return new Step(c, wrapped);
        }
        return new Step(from, false);
    }

    // Iniciativa maior primeiro (quem não rolou vai para o fim), depois o bônus maior, personagens antes, e a ordem de entrada.
    static List<Combatant> order(List<Combatant> list, Map<Long, TableCardResponse> cards) {
        return list.stream().sorted(Comparator
                        .comparing((Combatant c) -> c.getInitiative() == null)
                        .thenComparing(c -> c.getInitiative() == null ? 0 : -c.getInitiative())
                        .thenComparing(c -> -bonus(c, cards))
                        .thenComparing(c -> c.getKind() == Kind.PLAYER ? 0 : 1)
                        .thenComparing(Combatant::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private static int bonus(Combatant c, Map<Long, TableCardResponse> cards) {
        if (c.getKind() == Kind.ENEMY) return c.getInitiativeBonus();
        TableCardResponse card = cards.get(c.getCharacterId());
        return card == null ? 0 : card.character().initiative();
    }

    // Estado do inimigo para os jogadores, sem os números.
    static String health(int current, int max, boolean defeated) {
        if (defeated || current <= 0) return "Derrotado";
        if (current >= max) return "Ileso";
        double ratio = (double) current / max;
        if (ratio > 0.5) return "Ferido";
        if (ratio > 0.25) return "Sangrando";
        return "À beira da morte";
    }

    private void addPlayer(Encounter e, Long characterId) {
        if (characterId == null) throw ApiException.badRequest("Escolha o personagem.");
        Character ch = characters.findById(characterId).orElseThrow(() -> ApiException.notFound("Personagem não encontrado."));
        if (e.getCombatants().stream().anyMatch(c -> characterId.equals(c.getCharacterId())))
            throw ApiException.badRequest(ch.getCharacterName() + " já está no confronto.");
        room(e, 1);
        Combatant c = new Combatant();
        c.setEncounter(e);
        c.setKind(Kind.PLAYER);
        c.setCharacterId(characterId);
        c.setName(ch.getCharacterName());
        e.getCombatants().add(c);
    }

    // Várias cópias da mesma ficha ganham número ("Lobo 1", "Lobo 2"...), contando as que já estão no confronto.
    private void addEnemies(Encounter e, Long enemyId, Integer count, boolean hidden) {
        if (enemyId == null) throw ApiException.badRequest("Escolha o inimigo.");
        Enemy enemy = enemy(enemyId);
        int n = count == null ? 1 : count;
        if (n < 1 || n > MAX_COPIES) throw ApiException.badRequest("De 1 a " + MAX_COPIES + " inimigos de cada vez.");
        room(e, n);
        long already = e.getCombatants().stream().filter(c -> enemyId.equals(c.getEnemyId())).count();
        boolean numbered = n > 1 || already > 0;
        if (already == 1 && n >= 1) {
            // O que estava sozinho vira o "1".
            e.getCombatants().stream().filter(c -> enemyId.equals(c.getEnemyId()) && c.getName().equals(enemy.getName()))
                    .findFirst().ifPresent(c -> c.setName(enemy.getName() + " 1"));
        }
        for (int i = 1; i <= n; i++) {
            Combatant c = new Combatant();
            c.setEncounter(e);
            c.setKind(Kind.ENEMY);
            c.setEnemyId(enemy.getId());
            c.setName(numbered ? enemy.getName() + " " + (already + i) : enemy.getName());
            c.setImage(enemy.getImage());
            c.setMaxHp(enemy.getMaxHp());
            c.setCurrentHp(enemy.getMaxHp());
            c.setArmorClass(enemy.getArmorClass());
            c.setInitiativeBonus(enemy.getInitiativeBonus());
            c.setHidden(hidden);
            e.getCombatants().add(c);
        }
    }

    private static void room(Encounter e, int more) {
        if (e.getCombatants().size() + more > MAX_COMBATANTS) throw ApiException.badRequest("Um confronto tem no máximo " + MAX_COMBATANTS + " combatentes.");
    }

    private static void apply(Enemy e, EnemyRequest r) {
        if (r == null) throw ApiException.badRequest("Preencha a ficha do inimigo.");
        e.setName(name(r.name(), "Dê um nome ao inimigo."));
        e.setImage(ImageRules.clean(r.image()));
        e.setMaxHp(range(r.maxHp(), 1, MAX_HP, 10, "PV"));
        e.setArmorClass(range(r.armorClass(), 0, MAX_AC, 10, "CA"));
        e.setInitiativeBonus(range(r.initiativeBonus(), -20, 40, 0, "Bônus de iniciativa"));
        e.setSpeed(text(r.speed(), 60, "deslocamento"));
        e.setStr(range(r.str(), 1, 40, 10, "FOR"));
        e.setDex(range(r.dex(), 1, 40, 10, "DES"));
        e.setCon(range(r.con(), 1, 40, 10, "CON"));
        e.setIntel(range(r.intel(), 1, 40, 10, "INT"));
        e.setWis(range(r.wis(), 1, 40, 10, "SAB"));
        e.setCha(range(r.cha(), 1, 40, 10, "CAR"));
        e.setAttacks(text(r.attacks(), MAX_TEXT, "ataques"));
        e.setNotes(text(r.notes(), MAX_TEXT, "notas"));
    }

    private static int range(Integer value, int min, int max, int fallback, String label) {
        int v = value == null ? fallback : value;
        if (v < min || v > max) throw ApiException.badRequest(label + " deve ficar entre " + min + " e " + max + ".");
        return v;
    }

    private static String name(String value, String empty) {
        String v = value == null ? "" : value.trim();
        if (v.isEmpty()) throw ApiException.badRequest(empty);
        if (v.length() > 80) throw ApiException.badRequest("O nome pode ter até 80 caracteres.");
        return v;
    }

    private static String text(String value, int max, String label) {
        if (value == null || value.isBlank()) return null;
        if (value.length() > max) throw ApiException.badRequest("O texto de " + label + " pode ter até " + max + " caracteres.");
        return value.trim();
    }

    private EncounterView touched(Encounter e) {
        e.setRevision(e.getRevision() + 1);
        // Flush para os combatentes novos ganharem id antes de montar a visão.
        return view(encounters.saveAndFlush(e), null, cards());
    }

    private Enemy enemy(long id) {
        return enemies.findById(id).orElseThrow(() -> ApiException.notFound("Inimigo não encontrado."));
    }

    private Encounter encounter(long id) {
        return encounters.findById(id).orElseThrow(() -> ApiException.notFound("Confronto não encontrado."));
    }

    private static Combatant combatant(Encounter e, long id) {
        return e.getCombatants().stream().filter(c -> c.getId() != null && c.getId() == id).findFirst()
                .orElseThrow(() -> ApiException.notFound("Combatente não encontrado neste confronto."));
    }

    private Map<Long, TableCardResponse> cards() {
        return characterService.table().stream().collect(Collectors.toMap(t -> t.character().id(), Function.identity(), (a, b) -> a));
    }

    // viewer nulo ou mestre = visão completa. Jogador: sem inimigos escondidos e sem os números dos inimigos;
    // se for a vez de um escondido, a vez aparece como nula.
    private EncounterView view(Encounter e, Account viewer, Map<Long, TableCardResponse> cards) {
        boolean master = viewer == null || viewer.isMaster();
        Long myCharacter = master ? null : characterService.findCharacterOf(viewer).map(Character::getId).orElse(null);
        List<CombatantView> order = order(e.getCombatants(), cards).stream()
                .filter(c -> master || !c.isHidden())
                .map(c -> combatantView(c, cards, master, myCharacter))
                .toList();
        Long current = e.getCurrentId();
        if (!master && current != null && order.stream().noneMatch(c -> c.id() == e.getCurrentId())) current = null;
        return new EncounterView(e.getId(), e.getName(), e.getStatus(), e.getRound(), current, e.getRevision(),
                e.getCreatedAt(), e.getStartedAt(), e.getEndedAt(), master, order);
    }

    private static CombatantView combatantView(Combatant c, Map<Long, TableCardResponse> cards, boolean master, Long myCharacter) {
        if (c.getKind() == Kind.PLAYER) {
            TableCardResponse card = cards.get(c.getCharacterId());
            CharacterResponse ch = card == null ? null : card.character();
            boolean mine = c.getCharacterId() != null && c.getCharacterId().equals(myCharacter);
            String health = ch == null ? "Ileso" : health(ch.currentHp(), ch.maxHp(), false);
            return new CombatantView(c.getId(), c.getKind(), c.getCharacterId(), null, ch == null ? c.getName() : ch.characterName(), null,
                    c.getInitiative(), c.getInitiativeD20(), ch == null ? 0 : ch.initiative(),
                    ch == null ? null : ch.currentHp(), ch == null ? null : ch.maxHp(), ch == null ? null : ch.tempHp(),
                    card == null ? null : card.armorClass(), ch != null && ch.currentHp() == 0 ? "Caído" : health,
                    false, c.isDefeated(), mine,
                    ch == null ? List.of() : ch.conditions(), ch == null ? null : ch.exhaustion(),
                    ch == null ? null : ch.deathSuccesses(), ch == null ? null : ch.deathFailures(),
                    ch == null || ch.characterClass() == null ? null : ch.characterClass().name(), ch == null ? null : ch.subclass(),
                    ch == null ? null : ch.level());
        }
        String health = health(c.getCurrentHp(), c.getMaxHp(), c.isDefeated());
        return new CombatantView(c.getId(), c.getKind(), null, master ? c.getEnemyId() : null, c.getName(), c.getImage(),
                c.getInitiative(), c.getInitiativeD20(), master ? c.getInitiativeBonus() : null,
                master ? c.getCurrentHp() : null, master ? c.getMaxHp() : null, null, master ? c.getArmorClass() : null, health,
                c.isHidden(), c.isDefeated(), false, List.of(), null, null, null, null, null, null);
    }

    private static EnemyView enemyView(Enemy e) {
        return new EnemyView(e.getId(), e.getName(), e.getImage(), e.getMaxHp(), e.getArmorClass(), e.getInitiativeBonus(), e.getSpeed(),
                e.getStr(), e.getDex(), e.getCon(), e.getIntel(), e.getWis(), e.getCha(), e.getAttacks(), e.getNotes());
    }
}
