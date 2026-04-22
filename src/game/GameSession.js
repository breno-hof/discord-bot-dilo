const { EventEmitter } = require('events');
const { Collection } = require('discord.js');
const { getRandomQuestionPair, updateScore, saveMatch } = require('../database/queries');
const { GameConfig, AnswerLabels } = require('../utils/constants');
const DiloEmbeds = require('../utils/embeds');

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

    /** @type {Collection<string, string>} userId -> answer (respostas simultâneas) */
    this.answers = new Collection();

    /**
     * Mapeamento anônimo para votação: letra -> userId
     * Ex: { 'A': '123456', 'B': '789012', ... }
     * @type {Object.<string, string>}
     */
    this.answerLabels = {};

    /**
     * Mapeamento inverso: userId -> letra
     * @type {Object.<string, string>}
     */
    this.userLabels = {};

    /** @type {Collection<string, string>} voterId -> letra votada */
    this.votes = new Collection();

    this.lobbyMessageId = null;
    this.votingMessageId = null;
    this.answeringMessageId = null;

    this._timers = [];
  }

  // ==========================================
  // LOBBY
  // ==========================================

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

  removePlayer(userId) {
    if (this.state !== GameState.LOBBY) {
      return { success: false, reason: 'A partida já começou.' };
    }
    if (!this.players.has(userId)) {
      return { success: false, reason: 'Você não está no lobby.' };
    }
    this.players.delete(userId);
    if (userId === this.hostId && this.players.size > 0) {
      this.hostId = this.players.firstKey();
    }
    return { success: true };
  }

  canStart() {
    return this.players.size >= GameConfig.MIN_PLAYERS;
  }

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
   * Inicia a partida: sorteia impostor, distribui perguntas via DM.
   */
  async startGame() {
    if (this.state !== GameState.LOBBY) {
      throw new Error('O jogo não está no lobby.');
    }
    if (!this.canStart()) {
      throw new Error(`Mínimo de ${GameConfig.MIN_PLAYERS} jogadores necessário.`);
    }

    this.state = GameState.SENDING_QUESTIONS;

    // Sortear impostor
    const playerIds = Array.from(this.players.keys());
    const randomIndex = Math.floor(Math.random() * playerIds.length);
    this.impostorId = playerIds[randomIndex];

    // Sortear dupla de perguntas
    this.questionPair = getRandomQuestionPair();

    // Enviar perguntas via DM (todos ao mesmo tempo)
    const dmResults = await this._sendQuestions();

    this.state = GameState.ANSWERING;

    return { questionPair: this.questionPair, dmResults };
  }

  /**
   * Envia as perguntas via DM para todos os jogadores simultaneamente,
   * incluindo um botão "Responder" em cada DM.
   */
  async _sendQuestions() {
    const results = [];
    const promises = Array.from(this.players.entries()).map(async ([userId]) => {
      const isImpostor = userId === this.impostorId;
      const question = isImpostor
        ? this.questionPair.question_impostor
        : this.questionPair.question_normal;

      try {
        const user = await this.client.users.fetch(userId);
        const { embed, row } = DiloEmbeds.questionDM(question, isImpostor);
        await user.send({ embeds: [embed], components: [row] });
        results.push({ userId, success: true });
      } catch (err) {
        results.push({ userId, success: false, error: err.message });
      }
    });

    await Promise.all(promises);
    return results;
  }

  // ==========================================
  // RESPOSTAS SIMULTÂNEAS
  // ==========================================

  /**
   * Registra a resposta de um jogador.
   * Qualquer jogador pode responder a qualquer momento (sem ordem).
   */
  submitAnswer(userId, answer) {
    if (this.state !== GameState.ANSWERING) {
      return { success: false, reason: 'Não é hora de responder.' };
    }
    if (!this.players.has(userId)) {
      return { success: false, reason: 'Você não está nesta partida.' };
    }
    if (this.answers.has(userId)) {
      return { success: false, reason: 'Você já enviou sua resposta.' };
    }

    this.answers.set(userId, answer);
    const answeredCount = this.answers.size;
    const totalPlayers = this.players.size;
    const allAnswered = answeredCount >= totalPlayers;

    return { success: true, allAnswered, answeredCount, totalPlayers };
  }

  /**
   * Verifica quantos jogadores já responderam.
   */
  getAnswerProgress() {
    return {
      answered: this.answers.size,
      total: this.players.size,
      pending: this.players.filter((_, id) => !this.answers.has(id)),
    };
  }

  /**
   * Força resposta para jogadores que não responderam (timeout).
   */
  forceRemainingAnswers() {
    for (const [userId] of this.players) {
      if (!this.answers.has(userId)) {
        this.answers.set(userId, '*Não respondeu a tempo*');
      }
    }
  }

  // ==========================================
  // VOTAÇÃO ANÔNIMA
  // ==========================================

  /**
   * Inicia a fase de votação e gera o mapeamento anônimo de letras.
   * As letras são embaralhadas para não corresponder à ordem de entrada.
   */
  startVoting() {
    this.state = GameState.VOTING;
    this.votes.clear();

    // Embaralhar a ordem dos jogadores para atribuir letras aleatoriamente
    const shuffledIds = this._shuffle(Array.from(this.players.keys()));

    this.answerLabels = {};
    this.userLabels = {};

    shuffledIds.forEach((userId, index) => {
      const label = AnswerLabels[index];
      this.answerLabels[label] = userId;
      this.userLabels[userId] = label;
    });
  }

  /**
   * Retorna as respostas com suas letras anônimas, em ordem de letra.
   * Ex: [{ label: 'A', answer: 'Manga', userId: '...' }, ...]
   */
  getAnonymousAnswers() {
    return Object.entries(this.answerLabels).map(([label, userId]) => ({
      label,
      answer: this.answers.get(userId) || '*Sem resposta*',
      userId, // usado internamente, não exposto na UI
    }));
  }

  /**
   * Registra o voto de um jogador em uma letra (resposta anônima).
   * @param {string} voterId
   * @param {string} targetLabel - Letra da resposta votada (ex: 'A')
   */
  castVote(voterId, targetLabel) {
    if (this.state !== GameState.VOTING) {
      return { success: false, reason: 'Não é hora de votar.' };
    }
    if (!this.players.has(voterId)) {
      return { success: false, reason: 'Você não está na partida.' };
    }
    if (!this.answerLabels[targetLabel]) {
      return { success: false, reason: 'Opção de voto inválida.' };
    }
    // Impedir voto na própria resposta
    if (this.answerLabels[targetLabel] === voterId) {
      return { success: false, reason: 'Você não pode votar na sua própria resposta.' };
    }
    if (this.votes.has(voterId)) {
      return { success: false, reason: 'Você já votou nesta rodada.' };
    }

    this.votes.set(voterId, targetLabel);

    const allVoted = this.votes.size >= this.players.size;
    return { success: true, allVoted, totalVotes: this.votes.size, totalPlayers: this.players.size };
  }

  allVoted() {
    return this.votes.size >= this.players.size;
  }

  // ==========================================
  // RESULTADOS
  // ==========================================

  calculateResults() {
    this.state = GameState.RESULTS;

    // Contar votos por letra
    const voteCountsByLabel = {};
    for (const [, label] of this.votes) {
      voteCountsByLabel[label] = (voteCountsByLabel[label] || 0) + 1;
    }

    // Encontrar letra mais votada
    let maxVotes = 0;
    let mostVotedLabel = null;
    let isTie = false;

    for (const [label, count] of Object.entries(voteCountsByLabel)) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedLabel = label;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    // Resolver quem foi eliminado
    const eliminatedId = (!isTie && mostVotedLabel)
      ? this.answerLabels[mostVotedLabel]
      : null;

    const impostorCaught = eliminatedId === this.impostorId;
    const impostorWon = !impostorCaught;

    // Salvar pontuações
    for (const [userId] of this.players) {
      updateScore(this.guildId, userId, userId === this.impostorId, impostorWon);
    }

    saveMatch(this.guildId, this.impostorId, impostorWon, this.players.size, this.questionPair.id);

    // Montar revelação: cada letra com sua resposta, dono e votos recebidos
    const labelReveal = Object.entries(this.answerLabels).map(([label, userId]) => ({
      label,
      userId,
      player: this.players.get(userId),
      answer: this.answers.get(userId) || '*Sem resposta*',
      votes: voteCountsByLabel[label] || 0,
      isImpostor: userId === this.impostorId,
    })).sort((a, b) => a.label.localeCompare(b.label));

    return {
      voteCountsByLabel,
      mostVotedLabel,
      maxVotes,
      isTie,
      eliminatedId,
      impostorId: this.impostorId,
      impostorCaught,
      impostorWon,
      impostor: this.players.get(this.impostorId),
      impostorLabel: this.userLabels[this.impostorId],
      questionPair: this.questionPair,
      players: this.getPlayerList(),
      labelReveal,
      votes: Object.fromEntries(this.votes),
    };
  }

  // ==========================================
  // FINALIZAÇÃO
  // ==========================================

  endGame() {
    this.state = GameState.ENDED;
    this._clearTimers();
    this.emit('end');
  }

  forceEnd() {
    this.state = GameState.ENDED;
    this._clearTimers();
    this.emit('end');
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  addTimer(timer) {
    this._timers.push(timer);
  }

  _clearTimers() {
    for (const timer of this._timers) {
      clearTimeout(timer);
    }
    this._timers = [];
  }

  toJSON() {
    return {
      guildId: this.guildId,
      channelId: this.channelId,
      hostId: this.hostId,
      state: this.state,
      playerCount: this.players.size,
      answeredCount: this.answers.size,
    };
  }
}

GameSession.GameState = GameState;
module.exports = GameSession;
