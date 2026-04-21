const { readFileSync, existsSync } = require('fs');
const path = require('path');

function loadConfig() {
  const envPath = path.resolve(__dirname, '../../env.json');

  if (!existsSync(envPath)) {
    console.error('❌ Arquivo env.json não encontrado na raiz do projeto.');
    console.error('   Copie env.example.json para env.json e preencha as variáveis.');
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
