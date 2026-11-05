# Drink To You

> Sua hidratação, sob controle.

Aplicativo mobile (React Native + Expo) com API própria (Node.js + Express) para acompanhar e incentivar a hidratação diária.

Projeto da disciplina de Linguagem de Programação VI.

**Status:** em desenvolvimento. Veja [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md).

## Estrutura

```
drink-to-you/
├── app/   # Aplicativo React Native (Expo)
└── api/   # API Node.js + Express
```

## Segurança e boas práticas

- O arquivo `.gitignore` impede o versionamento de `node_modules`, `.env`, chaves, builds e bancos locais.
- Segredos ficam em variáveis de ambiente; a API traz um `.env.example` sem valores reais.
