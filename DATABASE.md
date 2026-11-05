# Banco de dados

PostgreSQL (Supabase). As tabelas são criadas automaticamente por [`api/src/database/schema.sql`](api/src/database/schema.sql) na inicialização da API.

## Tabelas

### `users`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador |
| name | TEXT | Nome |
| email | TEXT, UNIQUE | E-mail (login) |
| password_hash | TEXT | Hash bcrypt da senha |
| created_at | TIMESTAMPTZ | Data de criação |

### `water_entries`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador |
| user_id | INTEGER, FK → users(id) | Dono do registro (`ON DELETE CASCADE`) |
| amount_ml | INTEGER (> 0) | Quantidade em mililitros |
| created_at | TIMESTAMPTZ | Data e hora do consumo |
| note | TEXT | Observação opcional |

Índice: `(user_id, created_at DESC)`.

### `user_preferences`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador |
| user_id | INTEGER, UNIQUE, FK → users(id) | Usuário |
| daily_goal_ml | INTEGER | Meta diária (padrão 2000) |
| reminders_enabled | BOOLEAN | Lembretes ativos |
| reminder_interval_minutes | INTEGER (≥ 15) | Intervalo entre lembretes |
| reminder_start_time | TEXT (`HH:MM`) | Início da janela de lembretes |
| reminder_end_time | TEXT (`HH:MM`) | Fim da janela de lembretes |

## Relacionamentos

- `users` 1 — N `water_entries`
- `users` 1 — 1 `user_preferences`

## Datas e fuso horário

Os horários são gravados em UTC (`TIMESTAMPTZ`). Para o resumo diário, o app envia o fuso do aparelho (`?tz=America/Sao_Paulo`) e a API agrupa os registros pelo **dia local do usuário**, evitando contabilizar consumo no dia errado.
