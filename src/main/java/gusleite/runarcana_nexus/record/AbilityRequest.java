package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.AbilityType;
import gusleite.runarcana_nexus.enums.Recharge;
import jakarta.validation.constraints.*;

// Cadastro de magia/habilidade pelo mestre. Só nome e tipo são obrigatórios.
public record AbilityRequest(
        @NotBlank(message = "Informe o nome da habilidade.")
        @Size(max = 120, message = "O nome pode ter até 120 caracteres.")
        String name,
        @NotNull(message = "Informe o tipo: SPELL, ABILITY ou PASSIVE.")
        AbilityType type,
        @Min(value = 0, message = "O círculo vai de 0 (truque) a 9.")
        @Max(value = 9, message = "O círculo vai de 0 (truque) a 9.")
        Integer spellLevel,
        String school,
        String castingTime,
        String range,
        String duration,
        String components,
        @Pattern(regexp = "^\\s*\\d+d\\d+(\\s*[+-]\\s*\\d+)?\\s*$", message = "O dano deve ser como 2d6 ou 2d6+4.")
        String damage,
        @Size(max = 4000, message = "A descrição pode ter até 4000 caracteres.")
        String description,
        @Positive(message = "Os usos devem ser maiores que 0.")
        Integer maxUses,
        Recharge recharge,
        @Size(max = AbilityIconRequest.MAX_ICON, message = "A imagem do ícone é grande demais (máx. ~200 KB).")
        @Pattern(regexp = AbilityIconRequest.ICON_PATTERN, message = AbilityIconRequest.ICON_MESSAGE)
        String icon
) {}
