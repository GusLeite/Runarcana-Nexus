package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.record.CharacterSheetResponse;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.InventoryService;
import gusleite.runarcana_nexus.services.InventoryService.CustomItem;
import gusleite.runarcana_nexus.services.InventoryService.MasterInventory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Inventário, ouro e inspiração da ficha pronta. Mestre: /character/{id}/... (dá, tira, ajusta). Jogador:
// /character/me/... (só gasta: 1 de um consumível, ouro, a inspiração). As do jogador devolvem a ficha inteira.
@RestController
@RequestMapping("/character")
public class InventoryController {

    private final InventoryService inventory;
    private final AuthService auth;

    public InventoryController(InventoryService inventory, AuthService auth) {
        this.inventory = inventory;
        this.auth = auth;
    }

    public record CatalogItemRequest(String catalogId, Integer quantity) {}

    public record QuantityRequest(Integer quantity) {}

    public record GoldRequest(Integer gold) {}

    public record InspirationRequest(Boolean inspiration) {}

    public record SpendRequest(Integer amount) {}

    @GetMapping("/{characterId}/items")
    public ResponseEntity<MasterInventory> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                @PathVariable Long characterId) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.of(characterId));
    }

    // Item do catálogo (rules/itens.json).
    @PostMapping("/{characterId}/items")
    public ResponseEntity<MasterInventory> addCatalog(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                      @PathVariable Long characterId, @RequestBody CatalogItemRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.addCatalog(characterId, request.catalogId(), request.quantity()));
    }

    // Item livre (loot fora do catálogo).
    @PostMapping("/{characterId}/items/custom")
    public ResponseEntity<MasterInventory> addCustom(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                     @PathVariable Long characterId, @RequestBody CustomItem request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.addCustom(characterId, request));
    }

    @PatchMapping("/{characterId}/items/{entryId}")
    public ResponseEntity<MasterInventory> setQuantity(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                       @PathVariable Long characterId, @PathVariable Long entryId,
                                                       @RequestBody QuantityRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.setQuantity(characterId, entryId, request.quantity()));
    }

    @DeleteMapping("/{characterId}/items/{entryId}")
    public ResponseEntity<MasterInventory> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                  @PathVariable Long characterId, @PathVariable Long entryId) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.delete(characterId, entryId));
    }

    @PatchMapping("/{characterId}/gold")
    public ResponseEntity<MasterInventory> setGold(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                   @PathVariable Long characterId, @RequestBody GoldRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.setGold(characterId, request.gold()));
    }

    @PatchMapping("/{characterId}/inspiration")
    public ResponseEntity<MasterInventory> setInspiration(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                          @PathVariable Long characterId, @RequestBody InspirationRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(inventory.setInspiration(characterId, request.inspiration()));
    }

    @PostMapping("/me/items/{entryId}/use")
    public ResponseEntity<CharacterSheetResponse> use(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                      @PathVariable Long entryId) {
        return ResponseEntity.ok(inventory.use(auth.authenticate(authorization), entryId));
    }

    @PostMapping("/me/gold/spend")
    public ResponseEntity<CharacterSheetResponse> spendGold(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                            @RequestBody SpendRequest request) {
        return ResponseEntity.ok(inventory.spendGold(auth.authenticate(authorization), request.amount()));
    }

    @PostMapping("/me/inspiration/use")
    public ResponseEntity<CharacterSheetResponse> useInspiration(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(inventory.useInspiration(auth.authenticate(authorization)));
    }
}
