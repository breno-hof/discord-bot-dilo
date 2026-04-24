const { readFileSync, existsSync } = require('fs');
const path = require('path');

function loadConfig() {
  // Prioridade 1: variáveis de ambiente do processo (Docker / CI)
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_CLIENT_ID) {
    return {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      database: {
        connectionString: process.env.DATABASE_URL || null,
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME     || 'dilo',
        user:     process.env.DB_USER     || 'dilo',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    };
  }

  // Prioridade 2: arquivo env.json (desenvolvimento local)
  const envPath = path.resolve(__dirname, '../../env.json');

  if (!existsSync(envPath)) {
    console.error('❌ Configuração não encontrada.');
    console.error('   Em produção: defina DISCORD_TOKEN, DISCORD_CLIENT_ID e DATABASE_URL (ou DB_*) como variáveis de ambiente.');
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
      database: {
        connectionString: config.DATABASE_URL || null,
        host:     config.DB_HOST     || 'localhost',
        port:     parseInt(config.DB_PORT || '5432', 10),
        database: config.DB_NAME     || 'dilo',
        user:     config.DB_USER     || 'dilo',
        password: config.DB_PASSWORD || '',
        ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    };
  } catch (err) {
    console.error('❌ Erro ao ler env.json:', err.message);
    process.exit(1);
  }
}

module.exports = loadConfig();
