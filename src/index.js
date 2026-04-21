const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  Partials,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./utils/config');
const { getDatabase } = require('./database/init');
const { handleComponent, handleModal } = require('./components/handler');
const { Emojis } = require('./utils/constants');

// ==========================================
// INICIALIZAÇÃO DO CLIENT
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
  ],
});

// ==========================================
// CARREGAR COMANDOS
// ==========================================

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`  ${Emojis.CHECK} Comando carregado: /${command.data.name}`);
  }
}

// ==========================================
// EVENTOS
// ==========================================

client.once(Events.ClientReady, (c) => {
  console.log(`\n${Emojis.GAME} Dilo está online como ${c.user.tag}!`);
  console.log(`${Emojis.PLAYERS} Servindo ${c.guilds.cache.size} servidores.`);

  // Inicializar banco de dados
  const db = getDatabase();
  const questionCount = db.prepare('SELECT COUNT(*) as total FROM question_pairs').get().total;
  console.log(`${Emojis.SCROLL} ${questionCount} duplas de perguntas disponíveis.`);

  // Status do bot
  client.user.setActivity('🎭 /jogar para começar!', { type: 4 });
});

// Handler de Slash Commands
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash Commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro no comando /${interaction.commandName}:`, error);
      const reply = {
        embeds: [{
          title: `${Emojis.CROSS} Erro`,
          description: 'Ocorreu um erro ao executar este comando.',
          color: 0xe74c3c,
        }],
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
    return;
  }

  // Botões e Select Menus
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    try {
      await handleComponent(interaction);
    } catch (error) {
      console.error('Erro no componente:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${Emojis.CROSS} Ocorreu um erro. Tente novamente.`,
            ephemeral: true,
          });
        }
      } catch {}
    }
    return;
  }

  // Modais
  if (interaction.isModalSubmit()) {
    try {
      await handleModal(interaction);
    } catch (error) {
      console.error('Erro no modal:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `${Emojis.CROSS} Ocorreu um erro ao processar sua resposta.`,
            ephemeral: true,
          });
        }
      } catch {}
    }
    return;
  }
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando bot...');
  const { closeDatabase } = require('./database/init');
  closeDatabase();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando bot...');
  const { closeDatabase } = require('./database/init');
  closeDatabase();
  client.destroy();
  process.exit(0);
});

// ==========================================
// LOGIN
// ==========================================

client.login(config.token);
