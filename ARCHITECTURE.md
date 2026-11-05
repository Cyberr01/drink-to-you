# Arquitetura do Sistema — Drink To You

## Visão Geral

O **Drink To You** é dividido em duas camadas independentes e desacopladas:

```
[Aplicativo Mobile (React Native / Expo)]
                   │
                   │  HTTPS + JSON (Authorization: Bearer <JWT>)
                   ▼
   [API REST (Node.js + Express no Render)]
                   │
                   │  Conexão Pool TCP/SSL
                   ▼
     [Banco de Dados PostgreSQL (Supabase)]
```

Além da API própria, o aplicativo consome diretamente a API pública **Open-Meteo** para obter informações meteorológicas contextuais da localização do usuário.

---

## Responsabilidades por Camada

### 1. Aplicativo Mobile (`/app`)
- **Interface e Experiência (UI/UX):** construída com React Native Paper, `StyleSheet` próprio e SVG (`react-native-svg`) para o anel animado de progresso.
- **Navegação (`src/navigation`):** combina `NativeStackNavigator` (autenticação, onboarding e tela de detalhes recebendo `entryId`) com `BottomTabNavigator` (Início, Histórico e Ajustes).
- **Estado Global (`src/context`):**
  - `AuthContext`: gerencia usuário logado, token JWT, restauração de sessão e controle de onboarding.
  - `ThemeContext`: gerencia o tema claro/escuro persistido localmente.
- **Persistência Local (`src/services/storage.ts`):** armazena token JWT, preferências e tema via `AsyncStorage` (nunca armazena senhas).
- **Hooks Customizados (`src/hooks`):** `useAuth`, `useAppTheme`, `useFetch`, `useWeather`, `useWaterSummary` e `useSlowHint`.
- **Recursos Nativos do Dispositivo:**
  - `expo-notifications`: agendamento local de lembretes diários dentro da janela de horário escolhida.
  - `expo-haptics`: feedback tátil ao registrar consumo, salvar configurações ou excluir itens.
  - `expo-location`: obtenção de coordenadas para consulta climática contextual (com fallback seguro para São Paulo caso a permissão seja negada).

### 2. API Backend (`/api`)
Segue o padrão em camadas ensinado em aula (**routes → controllers → services → database**):

- **Routes (`src/routes`):** definem os endpoints e aplicam regras de validação com `express-validator`.
- **Middlewares (`src/middlewares`):**
  - `authenticate.js`: valida o token JWT no header `Authorization: Bearer <token>` e injeta `req.userId`.
  - `validate.js`: intercepta erros de validação e devolve HTTP 400 padronizado.
  - `errorHandler.js`: tratamento centralizado de erros (`HttpError` e erros inesperados).
- **Controllers (`src/controllers`):** recebem a requisição HTTP, repassam aos services e devolvem o status HTTP adequado.
- **Services (`src/services`):** concentram as regras de negócio, cálculo de resumo diário/semanal considerando o fuso horário do usuário, cálculo de sequência de dias (*streak*) e isolamento de dados por `user_id`.
- **Database (`src/database`):** pool de conexões PostgreSQL (`pg`) e inicialização automática do schema (`schema.sql`).
