# Runarcana-Nexus
Plataforma de apoio a mestres e jogadores de RPG, desenvolvida inicialmente para o sistema Runarcana. O projeto busca centralizar funcionalidades como gerenciamento de inventários, fichas de personagens, consulta à lore e ferramentas para organização de campanhas, com foco em acessibilidade, modularidade e expansão futura.

## Backend (Spring Boot)

- Java 17 + Spring Boot 3
- Arquitetura de monólito modular com pacote base `com.runarcana.nexus`
- Módulo inicial implementado: `inventory`

### Configuração de banco

As credenciais são externas via variáveis de ambiente:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DRIVER_CLASS_NAME` (opcional, padrão PostgreSQL)

Há um exemplo em `.env.example`.

`spring.jpa.hibernate.ddl-auto` está como `update` para desenvolvimento local controlado. Em produção, o ideal é migrar para versionamento via Flyway.

### Regra de inventário

Ao adicionar um item em `POST /api/v1/characters/{id}/inventory`, se já existir uma entrada para o mesmo personagem e mesmo modelo de item, a quantidade é somada na mesma entrada.

### Endpoints iniciais

- `POST /api/v1/items`
- `GET /api/v1/items`
- `GET /api/v1/items/{id}`
- `PUT /api/v1/items/{id}`
- `DELETE /api/v1/items/{id}`
- `POST /api/v1/characters`
- `GET /api/v1/characters`
- `GET /api/v1/characters/{id}`
- `GET /api/v1/characters/{id}/inventory`
- `POST /api/v1/characters/{id}/inventory`
- `PATCH /api/v1/characters/{id}/inventory/{entryId}`
- `DELETE /api/v1/characters/{id}/inventory/{entryId}`
