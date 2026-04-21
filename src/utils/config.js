const { readFileSync, existsSync } = require('fs');
const path = require('path');

function loadConfig() {
  // Prioridade 1: variáveis de ambiente do processo (Docker / CI)
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_CLIENT_ID) {
    return {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      databasePath: process.env.DATABASE_PATH || './data/dilo.db',
    };
  }

  // Prioridade 2: arquivo env.json (desenvolvimento local)
  const envPath = path.resolve(__dirname, '../../env.json');

  if (!existsSync(envPath)) {
    console.error('❌ Configuração não encontrada.');
    console.error('   Em produção: defina DISCORD_TOKEN e DISCORD_CLIENT_ID como variáveis de ambiente.');
    console.error('   Em desenvolvimento: copie env.example.json para env.json e preencha as variáveis.');
    process.exit(1);
  }

  try {
    const raw = readFileSync(envPath, 'utf-8');
    const config = JSON.parse(raw);

    const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
    for (const key of required) {
      if (!config[key] || config[key].startsWith('YOUR_')) {
        console.error(`❌ Variável "${key}" não configurada no env.json.`);
        process.exit(1);
      }
    }

    return {
      token: config.DISCORD_TOKEN,
      clientId: config.DISCORD_CLIENT_ID,
      databasePath: config.DATABASE_PATH || './data/dilo.db',
    };
  } catch (err) {
    console.error('❌ Erro ao ler env.json:', err.message);
    process.exit(1);
  }
}

module.exports = loadConfig();
