const Database = require('better-sqlite3');
const path = require('path');
const config = require('../utils/config');

let db = null;

function getDatabase() {
  if (db) return db;

  const dbPath = path.resolve(__dirname, '../../', config.databasePath);
  db = new Database(dbPath);

  // Ativar WAL para melhor performance com concorrência
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Criar tabelas
  db.exec(`
    -- Duplas de perguntas para o jogo
    CREATE TABLE IF NOT EXISTS question_pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_normal TEXT NOT NULL,
      question_impostor TEXT NOT NULL,
      category TEXT DEFAULT 'geral'
    );

    -- Configuração por servidor (multitenant)
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Pontuações por jogador por servidor
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      impostor_wins INTEGER DEFAULT 0,
      impostor_losses INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      UNIQUE(guild_id, user_id)
    );

    -- Histórico de partidas
    CREATE TABLE IF NOT EXISTS match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      impostor_id TEXT,
      impostor_won BOOLEAN,
      player_count INTEGER,
      question_pair_id INTEGER,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_pair_id) REFERENCES question_pairs(id)
    );
  `);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };
