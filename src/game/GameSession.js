const { EventEmitter } = require('events');
const { Collection } = require('discord.js');
const { getRandomQuestionPair } = require('../database/queries');
const { updateScore, saveMatch } = require('../database/queries');
const { GameConfig } = require('../utils/constants');
const EmbedBuilder = require('../utils/embeds');

/**
 * Estados possíveis de uma sessão de jogo.
 */
const GameState = {
  LOBBY: 'lobby',
  SENDING_QUESTIONS: 'sending_questions',
  ANSWERING: 'answering',
  VOTING: 'voting',
  RESULTS: 'results',
  ENDED: 'ended',
};

/**
 * GameSession — Representa uma partida individual em um servidor.
 */
class GameSession extends EventEmitter {
  /**
   * @param {string} guildId
   * @param {string} channelId
   * @param {string} hostId
   * @param {import('discord.js').Client} client
   */
  constructor(guildId, channelId, hostId, client) {
    super();
    this.guildId = guildId;
    this.channelId = channelId;
    this.hostId = hostId;
    this.client = client;

    /** @type {Collection<string, { id: string, username: string, displayName: string }>} */
    this.players = new Collection();
    this.state = GameState.LOBBY;
    this.impostorId = null;
    this.questionPair = null;
    this.currentPlayerIndex = 0;
    this.playerOrder = [];

    /** @type {Collection<string, string>} voterId -> votedId */
    this.votes = new Collection();

    /** @type {Collection<string, string>} userId -> answer */
    this.answers = new Collection();

    this.lobbyMessageId = null;
    this.votingMessageId = null;

    this._timers = [];
  }

  // ==========================================
  // LOBBY
  // ==========================================

  /**
   * Adiciona um jogador ao lobby.
   */
  addPlayer(userId, username, displayName) {
    if (this.state !== GameState.LOBBY) {
      return { success: false, reason: 'A partida já começou.' };
    }
    if (this.players.has(userId)) {
      return { success: false, reason: 'Você já está no lobby.' };
    }
    if (this.players.size >= GameConfig.MAX_PLAYERS) {
      return { success: false, reason: `O lobby está cheio (máx. ${GameConfig.MAX_PLAYERS}).` };
    }

    this.players.set(userId, { id: userId, username, displayName });
    return { success: true };
  }

  /**
   * Remove um jogador do lobby.
   */
  removePlayer(userId) {
    if (this.state !== GameState.LOBBY) {
      return { success: false, reason: 'A partida já começou.' };
    }
    if (!this.players.has(userId)) {
      return { success: false, reason: 'Você não está no lobby.' };
    }

    this.players.delete(userId);

    // Se o host saiu, transferir para o próximo
    if (userId === this.hostId && this.players.size > 0) {
      this.hostId = this.players.firstKey();
    }

    return { success: true };
  }

  /**
   * Verifica se o jogo pode começar.
   */
  canStart() {
    return this.players.size >= GameConfig.MIN_PLAYERS;
  }

  /**
   * Retorna a lista de jogadores formatada.
   */
  getPlayerList() {
    return this.players.map(p => ({
      ...p,
      isHost: p.id === this.hostId,
    }));
  }

  // ==========================================
  // INÍCIO DO JOGO
  // ==========================================

  /**
   * Inicia a partida: sorteia impostor e distribui perguntas.
   */
  async startGame() {
    if (this.state !== GameState.LOBBY) {
      throw new Error('O jogo não está no lobby.');
    }
    if (!this.canStart()) {
      throw new Error(`Mínimo de ${GameConfig.MIN_PLAYERS} jogadores necessário.`);
    }

    this.state = GameState.SENDING_QUESTIONS;

    // Sortear impostor aleatoriamente
    const playerIds = Array.from(this.players.keys());
    const randomIndex = Math.floor(Math.random() * playerIds.length);
    this.impostorId = playerIds[randomIndex];

    // Sortear dupla de perguntas
    this.questionPair = getRandomQuestionPair();

    // Embaralhar ordem dos jogadores para responder
    this.playerOrder = this._shuffle([...playerIds]);
    this.currentPlayerIndex = 0;

    // Enviar perguntas via DM
    const dmResults = await this._sendQuestions();

    this.state = GameState.ANSWERING;

    return {
      questionPair: this.questionPair,
      playerOrder: this.playerOrder,
      dmResults,
    };
  }

  /**
   * Envia as perguntas via DM para cada jogador.
   */
  async _sendQuestions() {
    const results = [];

    for (const [userId, player] of this.players) {
      const isImpostor = userId === this.impostorId;
      const question = isImpostor
        ? this.questionPair.question_impostor
        : this.questionPair.question_normal;

      try {
        const user = await this.client.users.fetch(userId);
        const embed = EmbedBuilder.questionDM(question, isImpostor, this.getOrderPosition(userId));
        await user.send({ embeds: [embed] });
        results.push({ userId, success: true });
      } catch (err) {
        results.push({ userId, success: false, error: err.message });
      }
    }

    return results;
  }

  /**
   * Retorna a posição na ordem de resposta de um jogador.
   */
  getOrderPosition(userId) {
    return this.playerOrder.indexOf(userId) + 1;
  }

  /**
   * Retorna o jogador atual que deve responder.
   */
  getCurrentPlayer() {
    if (this.currentPlayerIndex >= this.playerOrder.length) return null;
    const userId = this.playerOrder[this.currentPlayerIndex];
    return this.players.get(userId);
  }

  /**
   * Registra a resposta de um jogador e avança para o próximo.
   */
  submitAnswer(userId, answer) {
    if (this.state !== GameState.ANSWERING) {
      return { success: false, reason: 'Não é hora de responder.' };
    }

    const currentId = this.playerOrder[this.currentPlayerIndex];
    if (userId !== currentId) {
      return { success: false, reason: 'Não é sua vez de responder.' };
    }

    this.answers.set(userId, answer);
    this.currentPlayerIndex++;

    const allAnswered = this.currentPlayerIndex >= this.playerOrder.length;

    return {
      success: true,
      allAnswered,
      nextPlayer: allAnswered ? null : this.getCurrentPlayer(),
    };
  }

  // ==========================================
  // VOTAÇÃO
  // ==========================================

  /**
   * Inicia a fase de votação.
   */
  startVoting() {
    this.state = GameState.VOTING;
    this.votes.clear();
  }

  /**
   * Registra o voto de um jogador.
   */
  castVote(voterId, targetId) {
    if (this.state !== GameState.VOTING) {
      return { success: false, reason: 'Não é hora de votar.' };
    }
    if (!this.players.has(voterId)) {
      return { success: false, reason: 'Você não está na partida.' };
    }
    if (!this.players.has(targetId)) {
      return { success: false, reason: 'Jogador alvo inválido.' };
    }
    if (voterId === targetId) {
      return { success: false, reason: 'Você não pode votar em si mesmo.' };
    }
    if (this.votes.has(voterId)) {
      return { success: false, reason: 'Você já votou nesta rodada.' };
    }

    this.votes.set(voterId, targetId);

    const allVoted = this.votes.size >= this.players.size;

    return { success: true, allVoted, totalVotes: this.votes.size, totalPlayers: this.players.size };
  }

  /**
   * Verifica se todos votaram.
   */
  allVoted() {
    return this.votes.size >= this.players.size;
  }

  // ==========================================
  // RESULTADOS
  // ==========================================

  /**
   * Calcula os resultados da votação.
   */
  calculateResults() {
    this.state = GameState.RESULTS;

    // Contar votos
    const voteCounts = new Collection();
    for (const [, targetId] of this.votes) {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    }

    // Encontrar mais votado
    let maxVotes = 0;
    let mostVotedId = null;
    let isTie = false;

    for (const [targetId, count] of voteCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = targetId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    // Se empate, impostor vence
    const eliminated = isTie ? null : mostVotedId;
    const impostorCaught = eliminated === this.impostorId;
    const impostorWon = !impostorCaught;

    // Salvar pontuações
    for (const [userId] of this.players) {
      const isImpostor = userId === this.impostorId;
      updateScore(this.guildId, userId, isImpostor, impostorWon);
    }

    // Salvar partida no histórico
    saveMatch(
      this.guildId,
      this.impostorId,
      impostorWon,
      this.players.size,
      this.questionPair.id
    );

    const results = {
      voteCounts: Object.fromEntries(voteCounts),
      mostVotedId,
      maxVotes,
      isTie,
      eliminated,
      impostorId: this.impostorId,
      impostorCaught,
      impostorWon,
      impostor: this.players.get(this.impostorId),
      questionPair: this.questionPair,
      players: this.getPlayerList(),
      answers: Object.fromEntries(this.answers),
      votes: Object.fromEntries(this.votes),
    };

    return results;
  }

  // ==========================================
  // FINALIZAÇÃO
  // ==========================================

  /**
   * Encerra a sessão e limpa recursos.
   */
  endGame() {
    this.state = GameState.ENDED;
    this._clearTimers();
    this.emit('end');
  }

  /**
   * Força o encerramento da sessão.
   */
  forceEnd() {
    this.state = GameState.ENDED;
    this._clearTimers();
    this.emit('end');
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Embaralha um array (Fisher-Yates).
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Registra um timer para limpeza posterior.
   */
  addTimer(timer) {
    this._timers.push(timer);
  }

  /**
   * Limpa todos os timers registrados.
   */
  _clearTimers() {
    for (const timer of this._timers) {
      clearTimeout(timer);
    }
    this._timers = [];
  }

  /**
   * Retorna informações resumidas da sessão.
   */
  toJSON() {
    return {
      guildId: this.guildId,
      channelId: this.channelId,
      hostId: this.hostId,
      state: this.state,
      playerCount: this.players.size,
      impostorId: this.state === GameState.RESULTS ? this.impostorId : null,
    };
  }
}

GameSession.GameState = GameState;
module.exports = GameSession;
