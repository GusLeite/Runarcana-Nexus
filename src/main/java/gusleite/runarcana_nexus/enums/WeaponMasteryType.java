package gusleite.runarcana_nexus.enums;

import lombok.Getter;

@Getter
public enum WeaponMasteryType {

    CLEAVE("Corte"),
    GRAZE("Raspar"),
    NICK("Rápida"),
    PUSH("Empurrar"),
    SAP("Debilitar"),
    SLOW("Lentidão"),
    TOPPLE("Derrubar"),
    VEX("Distrair");

    private final String description;

    WeaponMasteryType(String description) {
        this.description = description;
    }

}
