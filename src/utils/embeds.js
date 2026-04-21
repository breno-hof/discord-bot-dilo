const { EmbedBuilder } = require('discord.js');
const { Colors, Emojis, GameConfig } = require('./constants');

/**
 * Fábrica de Embeds estilizados para o bot Dilo.
 */
const DiloEmbeds = {
  // ==========================================
  // LOBBY
  // ==========================================

  /**
   * Embed do lobby aguardando jogadores.
   */
  lobby(players, hostId, guildName) {
    const playerList = players.length > 0
      ? players.map(p => {
          const prefix = p.id === hostId ? `${Emojis.CROWN} ` : `${Emojis.PLAYER} `;
          return `${prefix}<@${p.id}>`;
        }).join('\n')
      : `*${Emojis.HOURGLASS} Aguardando jogadores...*`;

    const canStart = players.length >= GameConfig.MIN_PLAYERS;
    const statusText = canStart
      ? `${Emojis.CHECK} Pronto para iniciar!`
      : `${Emojis.WARNING} Mínimo de **${GameConfig.MIN_PLAYERS}** jogadores necessário.`;

    return new EmbedBuilder()
      .setTitle(`${Emojis.GAME} Dilo — Lobby`)
      .setDescription(
        `${Emojis.MEGAPHONE} Uma nova partida está sendo formada!\n` +
        `Clique no botão abaixo para entrar.\n\n` +
        `**Jogadores (${players.length}/${GameConfig.MAX_PLAYERS}):**\n${playerList}`
      )
      .addFields(
        { name: `${Emojis.SETTINGS} Status`, value: statusText, inline: true },
        { name: `${Emojis.CROWN} Anfitrião`, value: `<@${hostId}>`, inline: true },
      )
      .setColor(Colors.LOBBY)
      .setFooter({ text: `Dilo — O Jogo do Impostor | ${guildName}` })
      .setTimestamp();
  },

  // ==========================================
  // JOGO EM ANDAMENTO
  // ==========================================

  /**
   * Embed de início da rodada.
   */
  roundStart(playerOrder, players) {
    const orderList = playerOrder.map((id, i) => {
      const player = players.find(p => p.id === id);
      const name = player ? player.displayName : 'Desconhecido';
      return `**${i + 1}.** <@${id}>`;
    }).join('\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.FIRE} Rodada Iniciada!`)
      .setDescription(
        `${Emojis.DM} As perguntas foram enviadas por **DM** para cada jogador.\n` +
        `${Emojis.EYE} Um de vocês é o **Impostor** e recebeu uma pergunta diferente!\n\n` +
        `${Emojis.SCROLL} **Ordem de respostas:**\n${orderList}\n\n` +
        `Cada jogador deve responder **no canal** quando for sua vez.\n` +
        `Prestem atenção nas respostas para descobrir o impostor!`
      )
      .setColor(Colors.IN_GAME)
      .setFooter({ text: 'Dilo — Descubra o Impostor!' })
      .setTimestamp();
  },

  /**
   * Embed indicando de quem é a vez de responder.
   */
  playerTurn(player, turnNumber, totalPlayers) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.QUESTION} Vez de Responder`)
      .setDescription(
        `${Emojis.TARGET} É a vez de <@${player.id}> responder!\n\n` +
        `Responda à pergunta que recebeu na sua DM.\n` +
        `Use o botão abaixo para enviar sua resposta.`
      )
      .addFields(
        { name: `${Emojis.CHART} Progresso`, value: `Jogador **${turnNumber}** de **${totalPlayers}**`, inline: true },
      )
      .setColor(Colors.IN_GAME)
      .setFooter({ text: 'Dilo — Responda com sabedoria!' })
      .setTimestamp();
  },

  /**
   * Embed mostrando a resposta de um jogador.
   */
  playerAnswer(player, answer, turnNumber) {
    return new EmbedBuilder()
      .setDescription(
        `${Emojis.PLAYER} **<@${player.id}>** respondeu:\n\n` +
        `> ${answer}`
      )
      .setColor(Colors.IN_GAME)
      .setFooter({ text: `Resposta ${turnNumber}` });
  },

  // ==========================================
  // DM - PERGUNTA
  // ==========================================

  /**
   * Embed enviado por DM com a pergunta.
   */
  questionDM(question, isImpostor, orderPosition) {
    const roleText = isImpostor
      ? `${Emojis.IMPOSTOR} Você é o **IMPOSTOR**! Sua pergunta é diferente dos outros.`
      : `${Emojis.SHIELD} Você é um **jogador normal**. Responda naturalmente!`;

    const tipText = isImpostor
      ? `**Dica:** Tente responder de forma que pareça natural. Não levante suspeitas!`
      : `**Dica:** Preste atenção nas respostas dos outros para encontrar o impostor.`;

    return new EmbedBuilder()
      .setTitle(`${Emojis.LOCK} Sua Pergunta Secreta`)
      .setDescription(
        `${roleText}\n\n` +
        `${Emojis.QUESTION} **Pergunta:**\n> ${question}\n\n` +
        `${Emojis.SPARKLE} ${tipText}\n\n` +
        `${Emojis.CLOCK} Você é o **${orderPosition}º** a responder.`
      )
      .setColor(isImpostor ? Colors.DEFEAT : Colors.VICTORY)
      .setFooter({ text: 'Dilo — Não mostre esta mensagem a ninguém!' })
      .setTimestamp();
  },

  // ==========================================
  // VOTAÇÃO
  // ==========================================

  /**
   * Embed da fase de votação.
   */
  votingPhase(players, answers) {
    const answerList = players.map(p => {
      const answer = answers[p.id] || '*Não respondeu*';
      return `${Emojis.PLAYER} **<@${p.id}>:**\n> ${answer}`;
    }).join('\n\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.VOTE} Hora de Votar!`)
      .setDescription(
        `${Emojis.EYE} Todas as respostas foram dadas. Revise e vote em quem você acha que é o **Impostor**!\n\n` +
        `**Respostas:**\n\n${answerList}\n\n` +
        `${Emojis.TARGET} Selecione o suspeito no menu abaixo.`
      )
      .setColor(Colors.VOTING)
      .setFooter({ text: 'Dilo — Quem é o Impostor?' })
      .setTimestamp();
  },

  /**
   * Embed de progresso da votação.
   */
  votingProgress(votedCount, totalPlayers) {
    const bar = '█'.repeat(votedCount) + '░'.repeat(totalPlayers - votedCount);
    return new EmbedBuilder()
      .setDescription(
        `${Emojis.VOTE} **Votação em andamento...**\n\n` +
        `\`${bar}\` ${votedCount}/${totalPlayers} votos`
      )
      .setColor(Colors.VOTING);
  },

  // ==========================================
  // RESULTADOS
  // ==========================================

  /**
   * Embed de resultado — Impostor descoberto (vitória dos jogadores).
   */
  resultImpostorCaught(results) {
    const voteDetails = Object.entries(results.votes).map(([voterId, targetId]) => {
      return `<@${voterId}> ${Emojis.TARGET} <@${targetId}>`;
    }).join('\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.CONFETTI} Impostor Descoberto!`)
      .setDescription(
        `${Emojis.TROPHY} Os jogadores venceram!\n\n` +
        `${Emojis.IMPOSTOR} O impostor era: **<@${results.impostorId}>**\n\n` +
        `**Perguntas da rodada:**\n` +
        `${Emojis.PLAYER} Normal: *"${results.questionPair.question_normal}"*\n` +
        `${Emojis.IMPOSTOR} Impostor: *"${results.questionPair.question_impostor}"*\n\n` +
        `**Votos:**\n${voteDetails}`
      )
      .setColor(Colors.VICTORY)
      .setFooter({ text: 'Dilo — Boa jogada!' })
      .setTimestamp();
  },

  /**
   * Embed de resultado — Impostor escapou (vitória do impostor).
   */
  resultImpostorWon(results) {
    const reason = results.isTie
      ? `${Emojis.WARNING} Houve empate na votação! O impostor escapa automaticamente.`
      : `${Emojis.CROSS} Os jogadores votaram em <@${results.mostVotedId}>, que era inocente!`;

    const voteDetails = Object.entries(results.votes).map(([voterId, targetId]) => {
      return `<@${voterId}> ${Emojis.TARGET} <@${targetId}>`;
    }).join('\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.SKULL} O Impostor Escapou!`)
      .setDescription(
        `${Emojis.IMPOSTOR} O impostor venceu!\n\n` +
        `${reason}\n\n` +
        `${Emojis.IMPOSTOR} O impostor era: **<@${results.impostorId}>**\n\n` +
        `**Perguntas da rodada:**\n` +
        `${Emojis.PLAYER} Normal: *"${results.questionPair.question_normal}"*\n` +
        `${Emojis.IMPOSTOR} Impostor: *"${results.questionPair.question_impostor}"*\n\n` +
        `**Votos:**\n${voteDetails}`
      )
      .setColor(Colors.DEFEAT)
      .setFooter({ text: 'Dilo — O impostor enganou todos!' })
      .setTimestamp();
  },

  // ==========================================
  // INFORMATIVOS
  // ==========================================

  /**
   * Embed de regras do jogo.
   */
  rules() {
    return new EmbedBuilder()
      .setTitle(`${Emojis.SCROLL} Regras do Dilo`)
      .setDescription(
        `**${Emojis.GAME} O que é o Dilo?**\n` +
        `Dilo é um jogo de dedução social! Todos recebem uma pergunta, mas o **Impostor** recebe uma pergunta ligeiramente diferente.\n\n` +
        `**${Emojis.TARGET} Como jogar:**\n` +
        `1. Use \`/jogar\` para criar um lobby.\n` +
        `2. Jogadores entram clicando no botão.\n` +
        `3. O anfitrião inicia a partida.\n` +
        `4. Cada jogador recebe uma pergunta por DM.\n` +
        `5. Respondam no canal, um por vez.\n` +
        `6. Votem em quem acham que é o impostor!\n\n` +
        `**${Emojis.IMPOSTOR} O Impostor:**\n` +
        `Recebe uma pergunta parecida, mas diferente. Deve responder de forma convincente para não ser descoberto.\n\n` +
        `**${Emojis.TROPHY} Vitória:**\n` +
        `• Jogadores vencem se votarem corretamente no impostor.\n` +
        `• O impostor vence se não for o mais votado (ou em caso de empate).`
      )
      .addFields(
        { name: `${Emojis.PLAYERS} Jogadores`, value: `${GameConfig.MIN_PLAYERS} a ${GameConfig.MAX_PLAYERS}`, inline: true },
        { name: `${Emojis.CLOCK} Tempo de Voto`, value: `${GameConfig.VOTING_TIMEOUT / 1000}s`, inline: true },
      )
      .setColor(Colors.INFO)
      .setFooter({ text: 'Dilo — O Jogo do Impostor' })
      .setTimestamp();
  },

  /**
   * Embed de configuração do canal.
   */
  channelConfigured(channelId) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.SETTINGS} Canal Configurado`)
      .setDescription(
        `${Emojis.CHECK} O canal de jogo foi definido para <#${channelId}>.\n\n` +
        `Agora use \`/jogar\` neste canal para iniciar uma partida!`
      )
      .setColor(Colors.VICTORY)
      .setFooter({ text: 'Dilo — Configuração' })
      .setTimestamp();
  },

  /**
   * Embed de placar/leaderboard.
   */
  leaderboard(scores, guildName) {
    if (scores.length === 0) {
      return new EmbedBuilder()
        .setTitle(`${Emojis.TROPHY} Placar — ${guildName}`)
        .setDescription(`*Nenhuma partida jogada ainda neste servidor.*`)
        .setColor(Colors.INFO)
        .setFooter({ text: 'Dilo — Placar' })
        .setTimestamp();
    }

    const medals = ['🥇', '🥈', '🥉'];
    const list = scores.map((s, i) => {
      const medal = medals[i] || `**${i + 1}.**`;
      const winRate = s.games_played > 0
        ? Math.round(((s.wins + s.impostor_wins) / s.games_played) * 100)
        : 0;
      return `${medal} <@${s.user_id}> — **${s.wins + s.impostor_wins}** vitórias (${winRate}%) | ${s.games_played} jogos`;
    }).join('\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.TROPHY} Placar — ${guildName}`)
      .setDescription(list)
      .setColor(Colors.INFO)
      .setFooter({ text: 'Dilo — Placar' })
      .setTimestamp();
  },

  /**
   * Embed de erro genérico.
   */
  error(message) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.CROSS} Erro`)
      .setDescription(message)
      .setColor(Colors.DEFEAT);
  },

  /**
   * Embed de sucesso genérico.
   */
  success(message) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.CHECK} Sucesso`)
      .setDescription(message)
      .setColor(Colors.VICTORY);
  },

  /**
   * Embed de DM falhou.
   */
  dmFailed(failedUsers) {
    const list = failedUsers.map(u => `• <@${u}>`).join('\n');
    return new EmbedBuilder()
      .setTitle(`${Emojis.WARNING} Aviso — DMs Bloqueadas`)
      .setDescription(
        `Não foi possível enviar a pergunta para os seguintes jogadores:\n${list}\n\n` +
        `Certifique-se de que suas DMs estão abertas para este servidor.`
      )
      .setColor(Colors.VOTING);
  },

  /**
   * Embed de partida cancelada.
   */
  gameCancelled(reason) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.CROSS} Partida Cancelada`)
      .setDescription(reason || 'A partida foi cancelada.')
      .setColor(Colors.NEUTRAL)
      .setFooter({ text: 'Dilo — Use /jogar para iniciar uma nova partida' })
      .setTimestamp();
  },
};

module.exports = DiloEmbeds;
