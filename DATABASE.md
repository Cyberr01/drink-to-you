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
| user_id | INTEGER, UNIQUE, FK → users(id) | Usuário (`ON DELETE CASCADE`) |
| daily_goal_ml | INTEGER | Meta diária (padrão 2000) |
| reminders_enabled | BOOLEAN | Lembretes ativos |
| reminder_interval_minutes | INTEGER (≥ 15) | Intervalo entre lembretes |
| reminder_start_time | TEXT (`HH:MM`) | Início da janela de lembretes |
| reminder_end_time | TEXT (`HH:MM`) | Fim da janela de lembretes |

### `challenges`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador da sala de desafio |
| code | TEXT, UNIQUE | Código de convite (ex.: `AGUA-DEMO`) |
| name | TEXT | Nome da sala |
| description | TEXT | Regras ou descrição opcional |
| prize | TEXT | Premiação opcional combinada entre os participantes |
| daily_goal_ml | INTEGER (500..10000) | Meta diária exigida para pontuar no desafio |
| start_date | TEXT (`YYYY-MM-DD`) | Data de início |
| end_date | TEXT (`YYYY-MM-DD`) | Data de término |
| lock_after_start | BOOLEAN | Bloqueia entrada de novos membros após `start_date` |
| creator_id | INTEGER, FK → users(id) | Criador da sala |
| created_at | TIMESTAMPTZ | Data de criação |

### `challenge_members`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador |
| challenge_id | INTEGER, FK → challenges(id) | Sala (`ON DELETE CASCADE`) |
| user_id | INTEGER, FK → users(id) | Participante (`ON DELETE CASCADE`) |
| joined_at | TIMESTAMPTZ | Data de entrada |

Restrição única: `(challenge_id, user_id)`.

### `challenge_checkins`
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL, PK | Identificador do check-in |
| challenge_id | INTEGER, FK → challenges(id) | Sala (`ON DELETE CASCADE`) |
| user_id | INTEGER, FK → users(id) | Autor do check-in (`ON DELETE CASCADE`) |
| checkin_date | TEXT (`YYYY-MM-DD`) | Dia local comprovado (máximo 1 ponto por dia) |
| consumed_ml | INTEGER (> 0) | Volume registrado no momento do check-in |
| photo_data | TEXT | Foto comprimida em Data URI JPEG (`<= 900 KB`) |
| caption | TEXT | Legenda opcional |
| created_at | TIMESTAMPTZ | Horário do envio |

Restrição única: `(challenge_id, user_id, checkin_date)`.

### `challenge_reactions`
| Campo | Tipo | Descrição |
|---|---|---|
| checkin_id | INTEGER, PK, FK → challenge_checkins(id) | Check-in incentivado (`ON DELETE CASCADE`) |
| user_id | INTEGER, PK, FK → users(id) | Participante que reagiu (`ON DELETE CASCADE`) |
| created_at | TIMESTAMPTZ | Horário da reação |

## Relacionamentos

- `users` 1 — N `water_entries`
- `users` 1 — 1 `user_preferences`
- `users` 1 — N `challenges` (criador)
- `challenges` N — N `users` (via `challenge_members`)
- `challenges` 1 — N `challenge_checkins`
- `challenge_checkins` 1 — N `challenge_reactions`

## Datas, fuso horário e conquistas

Os horários são gravados em UTC (`TIMESTAMPTZ`). Para resumos diários, check-ins e cálculo das **15 conquistas pessoais** (e XP/Nível), o app envia o fuso do aparelho (`?tz=America/Sao_Paulo`) e a API agrega os registros pelo **dia local do usuário**.
