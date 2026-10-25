package gusleite.runarcana_nexus.record;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "Informe a senha atual.") String currentPassword,
    // 72 é o limite de bytes do BCrypt
    @NotBlank(message = "Informe a nova senha.")
    @Size(min = 6, max = 72, message = "A nova senha precisa ter entre 6 e 72 caracteres.")
    String newPassword
) {}
