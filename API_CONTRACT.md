# Contrato da API

Base URL: `https://drink-to-you-api.onrender.com/api` (local: `http://localhost:3000/api`)

Formato: JSON. Rotas privadas exigem o header `Authorization: Bearer <token>`.

Erros seguem o formato `{ "message": "texto" }` (validações incluem também `field`).

| Código | Uso |
|---|---|
| 200 / 201 / 204 | Sucesso / criado / sem conteúdo |
| 400 | Dados inválidos |
| 401 | Token ausente, inválido ou credenciais incorretas |
| 404 | Recurso não encontrado (ou de outro usuário) |
| 409 | E-mail já cadastrado |

## Autenticação

| Método | Endpoint | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201 { user, token }` |
| POST | `/auth/login` | `{ email, password }` | `200 { user, token }` |
| GET | `/auth/me` 🔒 | — | `200 { user }` |

Regras: `name` ≥ 2 caracteres, `email` válido, `password` ≥ 6 caracteres.

## Registros de consumo 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/water-entries` | Lista os registros (mais recentes primeiro). Query opcional: `limit`, `offset` |
| POST | `/water-entries` | Cria registro |
| GET | `/water-entries/:id` | Detalha registro |
| PUT | `/water-entries/:id` | Atualiza registro |
| DELETE | `/water-entries/:id` | Exclui registro (`204`) |
| GET | `/water-entries/summary/today?tz=` | Resumo do dia |
| GET | `/water-entries/summary/weekly?tz=` | Últimos 7 dias, média e sequência |

Corpo de criação/edição:

```json
{ "amount_ml": 250, "note": "Manhã" }
```

`amount_ml` entre 1 e 5000; `note` opcional (até 200 caracteres).

Resposta de um registro:

```json
{ "id": 1, "amount_ml": 250, "created_at": "2026-11-04T12:30:00.000Z", "note": "Manhã" }
```

Resumo do dia:

```json
{
  "date": "2026-11-05",
  "goal_ml": 2000,
  "consumed_ml": 400,
  "remaining_ml": 1600,
  "progress": 0.2,
  "entries_count": 2,
  "streak_days": 2
}
```

## Preferências 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/preferences` | Consulta as preferências |
| PUT | `/preferences` | Atualiza as preferências |

```json
{
  "daily_goal_ml": 2000,
  "reminders_enabled": true,
  "reminder_interval_minutes": 60,
  "reminder_start_time": "08:00",
  "reminder_end_time": "22:00"
}
```

Regras: meta entre 500 e 10000; intervalo entre 15 e 720 minutos; horários `HH:MM`.

## Outros

- `GET /health` → `{ "status": "ok" }` (usado pelo Render).
