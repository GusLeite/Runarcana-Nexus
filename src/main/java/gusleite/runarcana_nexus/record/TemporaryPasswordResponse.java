package gusleite.runarcana_nexus.record;

// Senha provisória: só aparece nesta resposta (no banco fica o hash), para o mestre passar ao jogador.
public record TemporaryPasswordResponse(String username, String temporaryPassword) {}
