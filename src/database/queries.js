const { getDatabase } = require('./init');

// ==========================================
// Configuração de Servidor (Guild)
// ==========================================

function getGuildConfig(guildId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
}

function setGuildChannel(guildId, channelId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO guild_config (guild_id, channel_id, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(guildId, channelId);
}

// ==========================================
// Perguntas
// ==========================================

function getRandomQuestionPair() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM question_pairs ORDER BY RANDOM() LIMIT 1').get();
}

function getQuestionPairById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM question_pairs WHERE id = ?').get(id);
}

function getQuestionCount() {
  const db = getDatabase();
  return db.prepare('SELECT COUNT(*) as total FROM question_pairs').get().total;
}

// ==========================================
// Pontuações
// ==========================================

function getPlayerScore(guildId, userId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM scores WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
}

function getGuildLeaderboard(guildId, limit = 10) {
  const db = getDatabase();
  // Ordena por winrate real (vitórias / partidas jogadas).
  // Mínimo de 1 jogo para evitar divisão por zero.
  // Desempate: total de vitórias absolutas, depois partidas jogadas.
  return db.prepare(`
    SELECT *,
      CAST(wins + impostor_wins AS REAL) / MAX(games_played, 1) AS win_rate
    FROM scores
    WHERE guild_id = ?
    ORDER BY win_rate DESC,
             (wins + impostor_wins) DESC,
             games_played DESC
    LIMIT ?
  `).all(guildId, limit);
}

function updateScore(guildId, userId, isImpostor, impostorWon) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO scores (guild_id, user_id, wins, losses, impostor_wins, impostor_losses, games_played)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      wins = wins + ?,
      losses = losses + ?,
      impostor_wins = impostor_wins + ?,
      impostor_losses = impostor_losses + ?,
      games_played = games_played + 1
  `);

  if (isImpostor) {
    const w = impostorWon ? 1 : 0;
    const l = impostorWon ? 0 : 1;
    stmt.run(guildId, userId, 0, 0, w, l, 0, 0, w, l);
  } else {
    const w = impostorWon ? 0 : 1;
    const l = impostorWon ? 1 : 0;
    stmt.run(guildId, userId, w, l, 0, 0, w, l, 0, 0);
  }
}

// ==========================================
// Histórico de Partidas
// ==========================================

function saveMatch(guildId, impostorId, impostorWon, playerCount, questionPairId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO match_history (guild_id, impostor_id, impostor_won, player_count, question_pair_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(guildId, impostorId, impostorWon ? 1 : 0, playerCount, questionPairId);
}

function getGuildStats(guildId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      COUNT(*) as total_matches,
      SUM(CASE WHEN impostor_won = 1 THEN 1 ELSE 0 END) as impostor_victories,
      SUM(CASE WHEN impostor_won = 0 THEN 1 ELSE 0 END) as player_victories,
      AVG(player_count) as avg_players
    FROM match_history
    WHERE guild_id = ?
  `).get(guildId);
}

module.exports = {
  getGuildConfig,
  setGuildChannel,
  getRandomQuestionPair,
  getQuestionPairById,
  getQuestionCount,
  getPlayerScore,
  getGuildLeaderboard,
  updateScore,
  saveMatch,
  getGuildStats,
};
