const { Collection } = require('discord.js');
const GameSession = require('./GameSession');

/**
 * GameManager — Gerenciador multitenant de partidas.
 * Usa o Guild ID como chave de isolamento, garantindo que
 * múltiplas partidas em servidores diferentes não conflitem.
 */
class GameManager {
  constructor() {
    /** @type {Collection<string, GameSession>} guildId -> GameSession */
    this.sessions = new Collection();
  }

  /**
   * Verifica se existe uma sessão ativa para o servidor.
   */
  hasSession(guildId) {
    return this.sessions.has(guildId);
  }

  /**
   * Retorna a sessão ativa do servidor, se existir.
   */
  getSession(guildId) {
    return this.sessions.get(guildId);
  }

  /**
   * Cria uma nova sessão de jogo para o servidor.
   * @param {string} guildId
   * @param {string} channelId - Canal onde o jogo acontece
   * @param {string} hostId - ID do jogador que iniciou
   * @param {import('discord.js').Client} client
   * @returns {GameSession}
   */
  createSession(guildId, channelId, hostId, client) {
    if (this.sessions.has(guildId)) {
      throw new Error('Já existe uma partida em andamento neste servidor.');
    }

    const session = new GameSession(guildId, channelId, hostId, client);
    this.sessions.set(guildId, session);

    // Auto-limpeza quando a sessão terminar
    session.on('end', () => {
      this.sessions.delete(guildId);
    });

    return session;
  }

  /**
   * Remove forçadamente uma sessão (para comandos de admin).
   */
  forceEndSession(guildId) {
    const session = this.sessions.get(guildId);
    if (session) {
      session.forceEnd();
      this.sessions.delete(guildId);
    }
  }

  /**
   * Retorna estatísticas do gerenciador.
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      guilds: Array.from(this.sessions.keys()),
    };
  }
}

// Singleton
module.exports = new GameManager();
