# 🎭 Dilo — Bot de Discord para o Jogo do Impostor

**Dilo** é um bot de Discord multitenant para o jogo de dedução social "Impostor". Os jogadores recebem uma pergunta secreta, mas o impostor recebe uma versão ligeiramente diferente. O objetivo é descobrir quem é o impostor através das respostas de cada jogador.

## Funcionalidades

- **Arquitetura Multitenant** — Suporta múltiplas partidas simultâneas em servidores diferentes, isoladas por Guild ID.
- **200 Duplas de Perguntas** — Banco de dados com perguntas correlatas em português, organizadas em 7 categorias.
- **Interface Visual Profissional** — Embeds estilizados com cores dinâmicas por estado do jogo (Lobby, Em Jogo, Votação, Resultado).
- **Interação por Componentes** — Botões para entrar/sair do lobby, modais para respostas, e menus de seleção para votação.
- **Perguntas via DM** — Garantia de sigilo ao enviar a pergunta secreta por mensagem direta.
- **Placar Persistente** — Ranking de vitórias por servidor com histórico de partidas.

## Comandos

| Comando | Descrição | Permissão |
|---------|-----------|-----------|
| `/jogar` | Inicia um novo lobby de partida | Todos |
| `/configurar` | Define o canal de jogo do servidor | Gerenciar Canais |
| `/regras` | Exibe as regras do jogo | Todos |
| `/placar` | Mostra o ranking de vitórias do servidor | Todos |
| `/cancelar` | Cancela a partida em andamento | Gerenciar Canais |

## Fluxo do Jogo

1. **Lobby** — Um jogador usa `/jogar` e outros entram clicando no botão.
2. **Início** — O anfitrião clica em "Iniciar Partida". O bot sorteia 1 impostor e envia as perguntas por DM.
3. **Respostas** — Cada jogador responde no canal, um por vez, na ordem sorteada.
4. **Votação** — Todos votam em quem acham que é o impostor via menu de seleção.
5. **Resultado** — O bot revela o impostor e quem venceu com um embed visual impactante.

## Requisitos

- **Node.js** 18+ (recomendado 22)
- **Bot do Discord** criado no [Discord Developer Portal](https://discord.com/developers/applications)
  - Intents necessárias: `Guilds`, `Guild Messages`, `Direct Messages`
  - Scopes: `bot`, `applications.commands`
  - Permissões: `Send Messages`, `Embed Links`, `Use External Emojis`, `Read Message History`

## Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/devyor-fun/discord-bot-dilo.git
cd discord-bot-dilo
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp env.example.json env.json
```

Edite `env.json`:

```json
{
  "DISCORD_TOKEN": "seu_token_do_bot",
  "DISCORD_CLIENT_ID": "seu_client_id",
  "DATABASE_PATH": "./data/dilo.db"
}
```

### 4. Popular o banco de dados

```bash
npm run seed
```

### 5. Registrar comandos slash

```bash
npm run deploy-commands
```

### 6. Iniciar o bot

```bash
npm start
```

Para desenvolvimento com hot-reload:

```bash
npm run dev
```

## Deploy com Docker

### Build e execução local

```bash
docker-compose up -d --build
```

### Via GHCR (GitHub Container Registry)

A imagem é publicada automaticamente via GitHub Actions a cada push na branch `main`:

```bash
docker pull ghcr.io/devyor-fun/discord-bot-dilo:main
```

## Estrutura do Projeto

```
discord-bot-dilo/
├── src/
│   ├── commands/           # Slash commands
│   │   ├── cancelar.js
│   │   ├── configurar.js
│   │   ├── jogar.js
│   │   ├── placar.js
│   │   └── regras.js
│   ├── components/         # Handlers de botões, menus e modais
│   │   └── handler.js
│   ├── database/           # Banco de dados SQLite
│   │   ├── init.js
│   │   ├── queries.js
│   │   └── seed.js
│   ├── game/               # Lógica do jogo
│   │   ├── GameManager.js
│   │   └── GameSession.js
│   ├── utils/              # Utilitários
│   │   ├── config.js
│   │   ├── constants.js
│   │   └── embeds.js
│   ├── deploy-commands.js
│   └── index.js
├── data/                   # Banco SQLite (gerado)
├── .github/workflows/      # CI/CD
├── Dockerfile
├── docker-compose.yml
├── env.example.json
├── package.json
└── README.md
```

## Categorias de Perguntas

| Categoria | Quantidade | Exemplo |
|-----------|-----------|---------|
| Comida e Bebida | 30 | Normal: "Qual sua fruta favorita?" / Impostor: "Qual sua sobremesa favorita?" |
| Entretenimento | 30 | Normal: "Qual seu filme favorito?" / Impostor: "Qual sua série favorita?" |
| Viagem e Lugares | 25 | Normal: "Qual país você mais quer visitar?" / Impostor: "Qual cidade do Brasil você mais quer visitar?" |
| Vida Pessoal | 30 | Normal: "Qual seu hobby favorito?" / Impostor: "Qual hobby você gostaria de começar?" |
| Hipotéticos | 30 | Normal: "Se pudesse viajar no tempo, iria ao passado ou futuro?" / Impostor: "Se pudesse teletransportar, iria para qual lugar?" |
| Preferências | 30 | Normal: "Praia ou campo?" / Impostor: "Montanha ou cidade?" |
| Cultura | 25 | Normal: "Qual período da história mais te fascina?" / Impostor: "Qual civilização antiga mais te fascina?" |

## Tecnologias

- **discord.js** v14 — Biblioteca para a API do Discord
- **better-sqlite3** — Banco de dados SQLite embutido
- **Node.js** — Runtime JavaScript

## Licença

MIT — [devyor.fun](https://devyor.fun)
