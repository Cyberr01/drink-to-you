# Arquitetura do Sistema — Drink To You

## Visão Geral

O **Drink To You** é dividido em duas camadas independentes e desacopladas, suportando tanto **Android nativo (APK)** quanto **Web / iOS instalável (PWA)** sobre a mesma base de código e API:

```
[App Android Nativo (.apk) / PWA Instalável iOS & Web]
                          │
                          │  HTTPS + JSON (Authorization: Bearer <JWT>)
                          ▼
       [API REST + Host Estático PWA (Node.js + Express no Render)]
                          │
                          │  Conexão Pool TCP/SSL
                          ▼
            [Banco de Dados PostgreSQL (Supabase)]
```

Além da API própria, o aplicativo consome diretamente a API pública **Open-Meteo** para obter informações meteorológicas contextuais da localização do usuário.

---

## Responsabilidades por Camada

### 1. Aplicativo Mobile e PWA (`/app`)
- **Interface e Experiência (UI/UX):** construída com React Native Paper, `expo-linear-gradient`, `StyleSheet` próprio e SVG (`react-native-svg`) para o anel animado de progresso com celebração ao atingir 100%.
- **Navegação (`src/navigation`):** combina `NativeStackNavigator` (autenticação, onboarding e telas de detalhes parametrizadas `EntryDetails` e `ChallengeDetails`) com `BottomTabNavigator` de 5 abas (`Início`, `Desafios`, `Conquistas`, `Histórico` e `Ajustes`).
- **Estado Global (`src/context`):**
  - `AuthContext`: gerencia usuário logado, token JWT, restauração de sessão e controle de onboarding.
  - `ThemeContext`: gerencia o tema claro/escuro persistido localmente.
- **Persistência Local (`src/services/storage.ts`):** armazena token JWT, preferências e tema via `AsyncStorage` (nunca armazena senhas).
- **Hooks Customizados (`src/hooks`):** `useAuth`, `useAppTheme`, `useFetch`, `useWeather`, `useWaterSummary` (com suporte a *Undo* imediato) e `useSlowHint`.
- **Recursos do Dispositivo (com compatibilidade Web/PWA):**
  - `expo-image-picker` + compressor `<canvas>` Web: captura de foto via câmera ou galeria para comprovação nos desafios.
  - `expo-notifications` + Web Notification API: agendamento local e teste imediato de lembretes.
  - `expo-haptics`: feedback tátil ao registrar consumo, reagir, fazer check-in ou concluir metas.
  - `expo-location`: obtenção de coordenadas para consulta climática contextual (com fallback seguro para São Paulo).

### 2. API Backend (`/api`)
Segue o padrão em camadas ensinado em aula (**routes → controllers → services → database**):

- **Routes (`src/routes`):** definem os endpoints (`auth`, `water-entries`, `preferences`, `challenges`, `achievements`) e aplicam regras de validação com `express-validator`.
- **Middlewares (`src/middlewares`):**
  - `authenticate.js`: valida o token JWT no header `Authorization: Bearer <token>` e injeta `req.userId`.
  - `validate.js`: intercepta erros de validação e devolve HTTP 400 padronizado.
  - `errorHandler.js`: tratamento centralizado de erros (`HttpError` e erros inesperados).
- **Controllers (`src/controllers`):** recebem a requisição HTTP, repassam aos services e devolvem o status HTTP adequado.
- **Services (`src/services`):** concentram as regras de negócio: resumos por fuso horário, cálculo de *streak* individual e **chama coletiva** (estilo Duolingo), validação anti-burla dos check-ins de desafios (meta cumprida + mínimo de 2 registros + foto), ranking e motor das **15 conquistas pessoais + sistema de XP/Nível**.
- **Database (`src/database`):** pool de conexões PostgreSQL (`pg`) e inicialização automática do schema (`schema.sql`).
