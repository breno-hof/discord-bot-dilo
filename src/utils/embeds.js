const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Emojis, GameConfig } = require('./constants');

/**
 * Fábrica de Embeds estilizados para o bot Dilo.
 */
const DiloEmbeds = {
  // ==========================================
  // LOBBY
  // ==========================================

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
  // INÍCIO DA RODADA
  // ==========================================

  roundStart(playerCount) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.FIRE} Rodada Iniciada!`)
      .setDescription(
        `${Emojis.DM} As perguntas foram enviadas por **DM** para todos os **${playerCount}** jogadores.\n\n` +
        `${Emojis.EYE} Um de vocês é o **Impostor** e recebeu uma pergunta diferente!\n\n` +
        `${Emojis.PENCIL} Cada jogador deve responder **na sua DM**.\n` +
        `Quando todos responderem, a votação começará automaticamente.`
      )
      .setColor(Colors.IN_GAME)
      .setFooter({ text: 'Dilo — Responda na sua DM!' })
      .setTimestamp();
  },

  // ==========================================
  // AGUARDANDO RESPOSTAS (mensagem no canal)
  // ==========================================

  awaitingAnswers(answeredCount, totalPlayers) {
    const remaining = totalPlayers - answeredCount;
    const bar = '█'.repeat(answeredCount) + '░'.repeat(remaining);

    return new EmbedBuilder()
      .setTitle(`${Emojis.HOURGLASS} Aguardando Respostas`)
      .setDescription(
        `\`${bar}\` **${answeredCount}/${totalPlayers}** responderam\n\n` +
        `${Emojis.DM} Verifique sua DM e clique em **Responder**!`
      )
      .setColor(Colors.IN_GAME)
      .setFooter({ text: 'Dilo — A votação começa quando todos responderem' })
      .setTimestamp();
  },

  // ==========================================
  // DM — PERGUNTA + BOTÃO RESPONDER
  // ==========================================

  /**
   * Retorna { embed, row } para enviar via DM com botão de resposta.
   */
  questionDM(question, isImpostor) {
    const roleText = isImpostor
      ? `${Emojis.IMPOSTOR} Você é o **IMPOSTOR**! Sua pergunta é diferente dos outros.`
      : `${Emojis.SHIELD} Você é um **jogador normal**. Responda naturalmente!`;

    const tipText = isImpostor
      ? `**Dica:** Responda de forma convincente para não levantar suspeitas!`
      : `**Dica:** Preste atenção nas respostas dos outros para encontrar o impostor.`;

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.LOCK} Sua Pergunta Secreta`)
      .setDescription(
        `${roleText}\n\n` +
        `${Emojis.QUESTION} **Pergunta:**\n> ${question}\n\n` +
        `${Emojis.SPARKLE} ${tipText}\n\n` +
        `${Emojis.PENCIL} Clique no botão abaixo para enviar sua resposta.`
      )
      .setColor(isImpostor ? Colors.DEFEAT : Colors.VICTORY)
      .setFooter({ text: 'Dilo — Não mostre esta mensagem a ninguém!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('dilo_dm_answer')
        .setLabel('Responder')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✍️'),
    );

    return { embed, row };
  },

  // ==========================================
  // VOTAÇÃO ANÔNIMA
  // ==========================================

  /**
   * Exibe as respostas anônimas por letra para votação.
   * @param {Array<{label, answer}>} anonymousAnswers
   */
  votingPhase(anonymousAnswers) {
    const answerList = anonymousAnswers.map(({ label, answer }) =>
      `**Resposta ${label}:**\n> ${answer}`
    ).join('\n\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.VOTE} Hora de Votar!`)
      .setDescription(
        `${Emojis.EYE} Todas as respostas foram recebidas. Analise e vote em qual você acha que é do **Impostor**!\n\n` +
        `${answerList}\n\n` +
        `${Emojis.TARGET} Selecione a resposta suspeita no menu abaixo.`
      )
      .setColor(Colors.VOTING)
      .setFooter({ text: 'Dilo — As respostas são anônimas. Vote com sabedoria!' })
      .setTimestamp();
  },

  /**
   * Atualiza o progresso de votos na mensagem de votação.
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
   * @param {object} results
   */
  resultImpostorCaught(results) {
    const revealList = results.labelReveal.map(({ label, player, answer, votes, isImpostor }) => {
      const tag = isImpostor ? ` ${Emojis.IMPOSTOR} **IMPOSTOR**` : '';
      return (
        `**Resposta ${label}** — <@${player.id}>${tag}\n` +
        `> ${answer}\n` +
        `${Emojis.VOTE} ${votes} voto(s)`
      );
    }).join('\n\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.CONFETTI} Impostor Descoberto!`)
      .setDescription(
        `${Emojis.TROPHY} Os jogadores venceram!\n\n` +
        `${Emojis.IMPOSTOR} O impostor era **<@${results.impostorId}>** (Resposta **${results.impostorLabel}**)\n\n` +
        `**Perguntas da rodada:**\n` +
        `${Emojis.PLAYER} Normal: *"${results.questionPair.question_normal}"*\n` +
        `${Emojis.IMPOSTOR} Impostor: *"${results.questionPair.question_impostor}"*\n\n` +
        `**Revelação das respostas:**\n\n${revealList}`
      )
      .setColor(Colors.VICTORY)
      .setFooter({ text: 'Dilo — Boa jogada!' })
      .setTimestamp();
  },

  /**
   * Embed de resultado — Impostor escapou (vitória do impostor).
   * @param {object} results
   */
  resultImpostorWon(results) {
    const reason = results.isTie
      ? `${Emojis.WARNING} Houve empate na votação! O impostor escapa automaticamente.`
      : `${Emojis.CROSS} A Resposta **${results.mostVotedLabel}** foi a mais votada, mas era de um jogador inocente!`;

    const revealList = results.labelReveal.map(({ label, player, answer, votes, isImpostor }) => {
      const tag = isImpostor ? ` ${Emojis.IMPOSTOR} **IMPOSTOR**` : '';
      return (
        `**Resposta ${label}** — <@${player.id}>${tag}\n` +
        `> ${answer}\n` +
        `${Emojis.VOTE} ${votes} voto(s)`
      );
    }).join('\n\n');

    return new EmbedBuilder()
      .setTitle(`${Emojis.SKULL} O Impostor Escapou!`)
      .setDescription(
        `${Emojis.IMPOSTOR} O impostor venceu!\n\n` +
        `${reason}\n\n` +
        `${Emojis.IMPOSTOR} O impostor era **<@${results.impostorId}>** (Resposta **${results.impostorLabel}**)\n\n` +
        `**Perguntas da rodada:**\n` +
        `${Emojis.PLAYER} Normal: *"${results.questionPair.question_normal}"*\n` +
        `${Emojis.IMPOSTOR} Impostor: *"${results.questionPair.question_impostor}"*\n\n` +
        `**Revelação das respostas:**\n\n${revealList}`
      )
      .setColor(Colors.DEFEAT)
      .setFooter({ text: 'Dilo — O impostor enganou todos!' })
      .setTimestamp();
  },

  // ==========================================
  // INFORMATIVOS
  // ==========================================

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
        `4. Cada jogador recebe uma pergunta por DM e responde **na DM** (todos ao mesmo tempo).\n` +
        `5. Quando todos responderem, as respostas aparecem no canal de forma **anônima** (Resposta A, B, C...).\n` +
        `6. Votem em qual resposta acham que é do impostor!\n\n` +
        `**${Emojis.IMPOSTOR} O Impostor:**\n` +
        `Recebe uma pergunta parecida, mas diferente. Deve responder de forma convincente para não ser descoberto.\n\n` +
        `**${Emojis.TROPHY} Vitória:**\n` +
        `• Jogadores vencem se votarem na resposta do impostor.\n` +
        `• O impostor vence se não for o mais votado (ou em caso de empate).`
      )
      .addFields(
        { name: `${Emojis.PLAYERS} Jogadores`, value: `${GameConfig.MIN_PLAYERS} a ${GameConfig.MAX_PLAYERS}`, inline: true },
        { name: `${Emojis.CLOCK} Tempo de Voto`, value: `${GameConfig.VOTING_TIMEOUT / 1000}s`, inline: true },
        { name: `${Emojis.CLOCK} Tempo de Resposta`, value: `${GameConfig.ANSWERING_TIMEOUT / 1000}s`, inline: true },
      )
      .setColor(Colors.INFO)
      .setFooter({ text: 'Dilo — O Jogo do Impostor' })
      .setTimestamp();
  },

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

  error(message) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.CROSS} Erro`)
      .setDescription(message)
      .setColor(Colors.DEFEAT);
  },

  success(message) {
    return new EmbedBuilder()
      .setTitle(`${Emojis.CHECK} Sucesso`)
      .setDescription(message)
      .setColor(Colors.VICTORY);
  },

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
