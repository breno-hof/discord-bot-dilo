const { getPool } = require('./init');

// ==========================================
// Configuração de Servidor (Guild)
// ==========================================

async function getGuildConfig(guildId) {
  const db = getPool();
  const { rows } = await db.query(
    'SELECT * FROM guild_config WHERE guild_id = $1',
    [guildId]
  );
  return rows[0] || null;
}

async function setGuildChannel(guildId, channelId) {
  const db = getPool();
  await db.query(
    `INSERT INTO guild_config (guild_id, channel_id, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (guild_id) DO UPDATE SET
       channel_id = EXCLUDED.channel_id,
       updated_at = NOW()`,
    [guildId, channelId]
  );
}

// ==========================================
// Perguntas
// ==========================================

async function getRandomQuestionPair() {
  const db = getPool();
  const { rows } = await db.query(
    'SELECT * FROM question_pairs ORDER BY RANDOM() LIMIT 1'
  );
  return rows[0] || null;
}

async function getQuestionPairById(id) {
  const db = getPool();
  const { rows } = await db.query(
    'SELECT * FROM question_pairs WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function getQuestionCount() {
  const db = getPool();
  const { rows } = await db.query('SELECT COUNT(*) AS total FROM question_pairs');
  return parseInt(rows[0].total, 10);
}

// ==========================================
// Pontuações
// ==========================================

async function getPlayerScore(guildId, userId) {
  const db = getPool();
  const { rows } = await db.query(
    'SELECT * FROM scores WHERE guild_id = $1 AND user_id = $2',
    [guildId, userId]
  );
  return rows[0] || null;
}

async function getGuildLeaderboard(guildId, limit = 10) {
  const db = getPool();
  // Ordena por winrate real (vitórias / partidas jogadas).
  // NULLIF evita divisão por zero; desempate: vitórias absolutas, depois partidas.
  const { rows } = await db.query(
    `SELECT *,
       (wins + impostor_wins)::FLOAT / NULLIF(games_played, 0) AS win_rate
     FROM scores
     WHERE guild_id = $1
     ORDER BY win_rate DESC NULLS LAST,
              (wins + impostor_wins) DESC,
              games_played DESC
     LIMIT $2`,
    [guildId, limit]
  );
  return rows;
}

async function updateScore(guildId, userId, isImpostor, impostorWon) {
  const db = getPool();

  const wins          = (!isImpostor && !impostorWon) ? 1 : 0;
  const losses        = (!isImpostor &&  impostorWon) ? 1 : 0;
  const impostorWins  = ( isImpostor &&  impostorWon) ? 1 : 0;
  const impostorLoss  = ( isImpostor && !impostorWon) ? 1 : 0;

  await db.query(
    `INSERT INTO scores (guild_id, user_id, wins, losses, impostor_wins, impostor_losses, games_played)
     VALUES ($1, $2, $3, $4, $5, $6, 1)
     ON CONFLICT (guild_id, user_id) DO UPDATE SET
       wins             = scores.wins             + $3,
       losses           = scores.losses           + $4,
       impostor_wins    = scores.impostor_wins    + $5,
       impostor_losses  = scores.impostor_losses  + $6,
       games_played     = scores.games_played     + 1`,
    [guildId, userId, wins, losses, impostorWins, impostorLoss]
  );
}

// ==========================================
// Histórico de Partidas
// ==========================================

async function saveMatch(guildId, impostorId, impostorWon, playerCount, questionPairId) {
  const db = getPool();
  await db.query(
    `INSERT INTO match_history (guild_id, impostor_id, impostor_won, player_count, question_pair_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [guildId, impostorId, impostorWon, playerCount, questionPairId]
  );
}

async function getGuildStats(guildId) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT
       COUNT(*)                                                    AS total_matches,
       SUM(CASE WHEN impostor_won = TRUE  THEN 1 ELSE 0 END)      AS impostor_victories,
       SUM(CASE WHEN impostor_won = FALSE THEN 1 ELSE 0 END)      AS player_victories,
       AVG(player_count)                                          AS avg_players
     FROM match_history
     WHERE guild_id = $1`,
    [guildId]
  );
  return rows[0] || null;
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
