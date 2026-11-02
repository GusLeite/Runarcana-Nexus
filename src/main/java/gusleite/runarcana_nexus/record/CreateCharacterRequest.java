package gusleite.runarcana_nexus.record;

import gusleite.runarcana_nexus.enums.Alignment;
import gusleite.runarcana_nexus.enums.CharacterClassType;
import gusleite.runarcana_nexus.enums.Region;
import gusleite.runarcana_nexus.enums.SkillType;
import jakarta.validation.constraints.*;

import java.util.List;

// Ficha nova: classe pelo tipo, antecedente pelo nome e perícias proficientes pela lista de SkillType.
public record CreateCharacterRequest(
        @NotBlank(message = "Informe o nome do jogador.")
        String playerName,
        @NotBlank(message = "Informe o nome do personagem.")
        String characterName,
        @Min(value = 1, message = "O nível deve estar entre 1 e 20.")
        @Max(value = 20, message = "O nível deve estar entre 1 e 20.")
        int level,
        @PositiveOrZero(message = "O ouro não pode ser negativo.")
        int gold,
        @Min(value = 1, message = "A idade deve ser pelo menos 1.")
        int age,
        @Positive(message = "A altura deve ser maior que 0.")
        double height,
        @NotNull(message = "Informe a classe do personagem.")
        CharacterClassType characterClass,
        @Positive(message = "Os PV máximos devem ser maiores que 0.")
        int maxHp,
        @PositiveOrZero(message = "Os PV atuais não podem ser negativos.")
        int currentHp,
        @Positive(message = "A Força deve ser maior que 0.")
        int str,
        @Positive(message = "A Destreza deve ser maior que 0.")
        int dex,
        @Positive(message = "A Inteligência deve ser maior que 0.")
        int intel,
        @Positive(message = "A Sabedoria deve ser maior que 0.")
        int wis,
        @Positive(message = "O Carisma deve ser maior que 0.")
        int cha,
        @Positive(message = "A Constituição deve ser maior que 0.")
        int con,
        List<SkillType> skills,
        Region region,
        String background,
        Alignment alignment,
        @PositiveOrZero(message = "A inspiração não pode ser negativa.")
        int inspiration
) {}
