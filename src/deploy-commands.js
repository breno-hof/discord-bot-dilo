const { REST, Routes } = require('discord.js');
const config = require('./utils/config');
const fs = require('fs');
const path = require('path');

async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(`  📦 Comando carregado: /${command.data.name}`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log(`\n🔄 Registrando ${commands.length} comandos globais...`);

    const data = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );

    console.log(`✅ ${data.length} comandos registrados com sucesso!\n`);
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
}

deployCommands();
