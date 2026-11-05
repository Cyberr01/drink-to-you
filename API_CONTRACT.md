# Contrato da API

Base URL: `https://drink-to-you-api.onrender.com/api` (local: `http://localhost:3000/api`)

Formato: JSON. Rotas privadas exigem o header `Authorization: Bearer <token>`.

Erros seguem o formato `{ "message": "texto" }` (validações incluem também `field`).

| Código | Uso |
|---|---|
| 200 / 201 / 204 | Sucesso / criado / sem conteúdo |
| 400 | Dados inválidos ou regra anti-burla não atendida |
| 401 | Token ausente, inválido ou credenciais incorretas |
| 403 | Entrada bloqueada após início da sala |
| 404 | Recurso não encontrado (ou de outro usuário) |
| 409 | E-mail já cadastrado ou check-in já realizado no dia |

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

## Preferências 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/preferences` | Consulta as preferências |
| PUT | `/preferences` | Atualiza as preferências |

## Salas de Desafio e Duplas (GymRats + Duolingo) 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/challenges?tz=` | Lista as salas do usuário com pontuação, colocação e chama coletiva |
| POST | `/challenges` | Cria nova sala e gera código de convite único (`AGUA-XXXX`) |
| POST | `/challenges/join` | Entra em uma sala pelo `{ code }` (respeitando `lock_after_start`) |
| GET | `/challenges/:id?tz=` | Detalha sala, ranking de membros, chama coletiva, elegibilidade do dia e mural de fotos |
| POST | `/challenges/:id/checkins` | Registra check-in diário (+1 ponto) validando meta batida, ≥ 2 registros no dia e foto |
| POST | `/challenges/:id/checkins/:checkinId/react` | Alterna reação de incentivo (`💧`) em um check-in |
| DELETE | `/challenges/:id/leave` | Sai da sala a qualquer momento (`204`) |

Corpo de criação de sala:

```json
{
  "name": "Desafio 60 Dias Firma",
  "description": "Meta diária comprovada com foto!",
  "prize": "Almoço pago para o 1º lugar (combinado entre amigos)",
  "daily_goal_ml": 2500,
  "start_date": "2026-11-05",
  "end_date": "2027-01-04",
  "lock_after_start": true
}
```

Corpo de check-in:

```json
{
  "photo_data": "data:image/jpeg;base64,...",
  "caption": "Garrafa da tarde concluída!",
  "tz": "America/Sao_Paulo"
}
```

## Conquistas Pessoais e Nível 🔒

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/achievements?tz=` | Calcula nível, XP, estatísticas globais e progresso nas 15 conquistas (Bronze a Diamante/Lendária) |

## Outros

- `GET /health` → `{ "status": "ok" }` (usado pelo Render).
- `GET /*` (exceto `/api/*` e arquivos estáticos) → entrega o Web App / PWA instalável.
