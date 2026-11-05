# Contexto do Projeto — Drink To You

## Identidade
- **Nome:** Drink To You
- **Slogan:** Sua hidratação, sob controle.
- **Disciplina:** Linguagem de Programação VI

## Decisões Técnicas Consolidadas
1. **Estrutura do repositório:** `/app` para o aplicativo mobile (Expo + TypeScript) e `/api` para o backend (Node.js + Express), conforme diretrizes da disciplina.
2. **Banco de Dados em Nuvem (PostgreSQL via Supabase):** adotado para permitir que o aplicativo funcione de qualquer rede sem perder dados quando o servidor gratuito reinicia, mantendo SQL relacional puro (`users`, `water_entries`, `user_preferences`) e chaves estrangeiras.
3. **Hospedagem da API:** publicada no **Render** (`https://drink-to-you-api.onrender.com`), permitindo testes reais em dispositivos físicos sem exigir que o celular esteja na mesma rede Wi-Fi do computador de desenvolvimento.
4. **Distribuição Mobile:**
   - **Android:** pacote instalável (`.apk`) gerado via **EAS Build**.
   - **iOS:** publicação via **EAS Update** acessível pelo aplicativo **Expo Go**.
5. **Fuso Horário:** todas as consultas de resumo diário e semanal recebem o fuso horário do aparelho (`tz`), garantindo que registros feitos à noite sejam contabilizados no dia local correto do usuário.
6. **Limites Éticos e de Escopo:** metas de hidratação são tratadas exclusivamente como configurações pessoais, sem recomendações médicas. Os dados climáticos (Open-Meteo) são apenas contextuais e não alteram a meta automaticamente.
