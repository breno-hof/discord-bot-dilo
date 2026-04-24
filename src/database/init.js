const { Pool } = require('pg');
const config = require('../utils/config');

let pool = null;

/**
 * Retorna o Pool de conexões PostgreSQL (singleton).
 */
function getPool() {
  if (pool) return pool;

  const dbConfig = config.database;

  pool = dbConfig.connectionString
    ? new Pool({ connectionString: dbConfig.connectionString, ssl: dbConfig.ssl })
    : new Pool({
        host:     dbConfig.host,
        port:     dbConfig.port,
        database: dbConfig.database,
        user:     dbConfig.user,
        password: dbConfig.password,
        ssl:      dbConfig.ssl,
      });

  pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool do PostgreSQL:', err.message);
  });

  return pool;
}

/**
 * Executa as migrations iniciais (CREATE TABLE IF NOT EXISTS).
 * Deve ser chamado uma única vez na inicialização do bot.
 */
async function initDatabase() {
  const db = getPool();

  await db.query(`
    -- Duplas de perguntas para o jogo
    CREATE TABLE IF NOT EXISTS question_pairs (
      id        SERIAL PRIMARY KEY,
      question_normal   TEXT NOT NULL,
      question_impostor TEXT NOT NULL,
      category  TEXT DEFAULT 'geral'
    );

    -- Configuração por servidor (multitenant)
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id   TEXT PRIMARY KEY,
      channel_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Pontuações por jogador por servidor
    CREATE TABLE IF NOT EXISTS scores (
      id               SERIAL PRIMARY KEY,
      guild_id         TEXT NOT NULL,
      user_id          TEXT NOT NULL,
      wins             INTEGER DEFAULT 0,
      losses           INTEGER DEFAULT 0,
      impostor_wins    INTEGER DEFAULT 0,
      impostor_losses  INTEGER DEFAULT 0,
      games_played     INTEGER DEFAULT 0,
      UNIQUE(guild_id, user_id)
    );

    -- Histórico de partidas
    CREATE TABLE IF NOT EXISTS match_history (
      id               SERIAL PRIMARY KEY,
      guild_id         TEXT NOT NULL,
      impostor_id      TEXT,
      impostor_won     BOOLEAN,
      player_count     INTEGER,
      question_pair_id INTEGER REFERENCES question_pairs(id),
      played_at        TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Banco de dados PostgreSQL inicializado.');
}

/**
 * Encerra o pool de conexões (graceful shutdown).
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, initDatabase, closeDatabase };
