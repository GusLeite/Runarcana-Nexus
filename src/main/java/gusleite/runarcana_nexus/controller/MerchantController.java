package gusleite.runarcana_nexus.controller;

import gusleite.runarcana_nexus.enums.SkillType;
import gusleite.runarcana_nexus.services.AuthService;
import gusleite.runarcana_nexus.services.MerchantService;
import gusleite.runarcana_nexus.services.MerchantService.HaggleView;
import gusleite.runarcana_nexus.services.MerchantService.MerchantRequest;
import gusleite.runarcana_nexus.services.MerchantService.Ping;
import gusleite.runarcana_nexus.services.MerchantService.ShelfRequest;
import gusleite.runarcana_nexus.services.MerchantService.ShelfUpdate;
import gusleite.runarcana_nexus.services.MerchantService.TradeResult;
import gusleite.runarcana_nexus.services.MerchantService.TradeView;
import gusleite.runarcana_nexus.services.MerchantService.View;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Mercadores. Mestre: /merchants e /merchants/{id}/... (monta, abre e fecha). Jogador: /merchants/active/... (a loja aberta, comprar e vender).
@RestController
@RequestMapping("/merchants")
public class MerchantController {

    private final MerchantService merchants;
    private final AuthService auth;

    public MerchantController(MerchantService merchants, AuthService auth) {
        this.merchants = merchants;
        this.auth = auth;
    }

    public record BuyRequest(Long lineId, Integer quantity, Integer price) {}

    public record SellRequest(Long entryId, Integer quantity, Integer unitValue) {}

    public record HaggleRequest(SkillType skill) {}

    @GetMapping
    public ResponseEntity<List<View>> list(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.list());
    }

    @PostMapping
    public ResponseEntity<View> create(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @RequestBody MerchantRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body(merchants.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<View> update(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id, @RequestBody MerchantRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @PathVariable Long id) {
        auth.requireMaster(authorization);
        merchants.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/open")
    public ResponseEntity<View> open(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                     @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.setActive(id, true));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<View> close(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                      @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.setActive(id, false));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<View> addItem(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                        @PathVariable Long id, @RequestBody ShelfRequest request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.addItem(id, request));
    }

    @PatchMapping("/{id}/items/{lineId}")
    public ResponseEntity<View> updateItem(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                           @PathVariable Long id, @PathVariable Long lineId, @RequestBody ShelfUpdate request) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.updateItem(id, lineId, request));
    }

    @DeleteMapping("/{id}/items/{lineId}")
    public ResponseEntity<View> removeItem(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                           @PathVariable Long id, @PathVariable Long lineId) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.removeItem(id, lineId));
    }

    @GetMapping("/{id}/trades")
    public ResponseEntity<List<TradeView>> trades(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                  @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.trades(id));
    }

    @GetMapping("/{id}/haggles")
    public ResponseEntity<List<HaggleView>> haggles(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                    @PathVariable Long id) {
        auth.requireMaster(authorization);
        return ResponseEntity.ok(merchants.haggles(id));
    }

    // Leve (sem a imagem), para a ficha conferir a cada poucos segundos se a loja abriu, fechou ou mudou.
    @GetMapping("/active/ping")
    public ResponseEntity<Ping> ping(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        auth.authenticate(authorization);
        return ResponseEntity.ok(merchants.ping());
    }

    @GetMapping("/active")
    public ResponseEntity<View> active(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(merchants.active(auth.authenticate(authorization)));
    }

    @PostMapping("/active/buy")
    public ResponseEntity<TradeResult> buy(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                           @RequestBody BuyRequest request) {
        return ResponseEntity.ok(merchants.buy(auth.authenticate(authorization), request.lineId(), request.quantity(), request.price()));
    }

    @PostMapping("/active/sell")
    public ResponseEntity<TradeResult> sell(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                            @RequestBody SellRequest request) {
        return ResponseEntity.ok(merchants.sell(auth.authenticate(authorization), request.entryId(), request.quantity(), request.unitValue()));
    }

    // Pechincha com o mercador aberto (Persuasão ou Enganação), uma vez por abertura. Devolve a loja com os preços dele.
    @PostMapping("/active/haggle")
    public ResponseEntity<View> haggle(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                       @RequestBody HaggleRequest request) {
        return ResponseEntity.ok(merchants.haggle(auth.authenticate(authorization), request.skill()));
    }
}
