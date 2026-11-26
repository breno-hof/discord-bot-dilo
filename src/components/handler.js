const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const gameManager = require('../game/GameManager');
const DiloEmbeds = require('../utils/embeds');
const { Emojis, GameConfig } = require('../utils/constants');

/**
 * Handler principal para interações de componentes (botões e menus).
 */
async function handleComponent(interaction) {
  const customId = interaction.customId;

  if (customId === 'dilo_join')        return handleJoin(interaction);
  if (customId === 'dilo_leave')       return handleLeave(interaction);
  if (customId === 'dilo_start')       return handleStart(interaction);
  if (customId === 'dilo_dm_answer')   return handleDmAnswerButton(interaction);
  if (customId === 'dilo_vote')        return handleVote(interaction);
  if (customId === 'dilo_play_again')  return handlePlayAgain(interaction);
}

/**
 * Handler para modais.
 */
async function handleModal(interaction) {
  if (interaction.customId === 'dilo_answer_modal') {
    return handleAnswerSubmit(interaction);
  }
}

// ==========================================
// LOBBY
// ==========================================

async function handleJoin(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'lobby') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há lobby ativo no momento.')],
      ephemeral: true,
    });
  }

  const result = session.addPlayer(
    interaction.user.id,
    interaction.user.username,
    interaction.member.displayName
  );

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  await updateLobbyEmbed(interaction, session);
  await interaction.reply({
    content: `${Emojis.CHECK} <@${interaction.user.id}> entrou no lobby!`,
    ephemeral: true,
  });
}

async function handleLeave(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'lobby') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há lobby ativo no momento.')],
      ephemeral: true,
    });
  }

  const result = session.removePlayer(interaction.user.id);

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  if (session.players.size === 0) {
    gameManager.forceEndSession(interaction.guildId);
    await interaction.update({
      embeds: [DiloEmbeds.gameCancelled('Todos os jogadores saíram do lobby.')],
      components: [],
    });
    return;
  }

  await updateLobbyEmbed(interaction, session);
  await interaction.reply({
    content: `${Emojis.CROSS} <@${interaction.user.id}> saiu do lobby.`,
    ephemeral: true,
  });
}

// ==========================================
// INÍCIO DA PARTIDA
// ==========================================

async function handleStart(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'lobby') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há lobby ativo no momento.')],
      ephemeral: true,
    });
  }

  if (interaction.user.id !== session.hostId) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(`Apenas o anfitrião (<@${session.hostId}>) pode iniciar a partida.`)],
      ephemeral: true,
    });
  }

  if (!session.canStart()) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(`Mínimo de **${GameConfig.MIN_PLAYERS}** jogadores necessário para iniciar.`)],
      ephemeral: true,
    });
  }

  await interaction.deferUpdate();

  try {
    const { dmResults } = await session.startGame();
    const failedDMs = dmResults.filter(r => !r.success).map(r => r.userId);

    // Fechar lobby
    await interaction.editReply({
      embeds: [DiloEmbeds.lobby(session.getPlayerList(), session.hostId, interaction.guild.name)],
      components: [],
    });

    const channel = await interaction.client.channels.fetch(session.channelId);

    // Aviso de DMs bloqueadas
    if (failedDMs.length > 0) {
      await channel.send({ embeds: [DiloEmbeds.dmFailed(failedDMs)] });
    }

    // Anunciar início e aguardar respostas
    await channel.send({ embeds: [DiloEmbeds.roundStart(session.players.size)] });
    await sleep(GameConfig.ROUND_DELAY);

    // Enviar mensagem de progresso no canal
    const progressMsg = await channel.send({
      embeds: [DiloEmbeds.awaitingAnswers(0, session.players.size)],
    });
    session.answeringMessageId = progressMsg.id;

    // Timer global de respostas
    const timer = setTimeout(async () => {
      if (session.state === 'answering') {
        session.forceRemainingAnswers();
        await startVotingPhase(channel, session);
      }
    }, GameConfig.ANSWERING_TIMEOUT);

    session.addTimer(timer);

  } catch (err) {
    console.error('Erro ao iniciar partida:', err);
    gameManager.forceEndSession(interaction.guildId);
    try {
      const channel = await interaction.client.channels.fetch(session.channelId);
      await channel.send({
        embeds: [DiloEmbeds.gameCancelled('Ocorreu um erro ao iniciar a partida. Tente novamente.')],
      });
    } catch {}
  }
}

// ==========================================
// RESPOSTAS VIA DM
// ==========================================

/**
 * Jogador clica no botão "Responder" na DM — abre o modal.
 * Esta interação vem de uma DM, não de um servidor.
 */
async function handleDmAnswerButton(interaction) {
  // Buscar a sessão do jogador (percorre todas as sessões ativas)
  const session = findSessionByPlayer(interaction.user.id);

  if (!session) {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há partida ativa para você no momento.')],
      ephemeral: true,
    });
  }

  if (session.state !== 'answering') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('A fase de respostas já encerrou.')],
      ephemeral: true,
    });
  }

  if (session.answers.has(interaction.user.id)) {
    return interaction.reply({
      content: `${Emojis.CHECK} Você já enviou sua resposta! Aguarde os outros jogadores.`,
      ephemeral: true,
    });
  }

  // Abrir modal
  const modal = new ModalBuilder()
    .setCustomId('dilo_answer_modal')
    .setTitle(`${Emojis.QUESTION} Sua Resposta`);

  const answerInput = new TextInputBuilder()
    .setCustomId('answer_text')
    .setLabel('Digite sua resposta')
    .setPlaceholder('Responda à pergunta que recebeu acima...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder().addComponents(answerInput));
  await interaction.showModal(modal);
}

/**
 * Jogador submete o modal de resposta (vindo da DM).
 */
async function handleAnswerSubmit(interaction) {
  const session = findSessionByPlayer(interaction.user.id);

  if (!session) {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há partida ativa para você.')],
      ephemeral: true,
    });
  }

  if (session.state !== 'answering') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('A fase de respostas já encerrou.')],
      ephemeral: true,
    });
  }

  const answer = interaction.fields.getTextInputValue('answer_text');
  const result = session.submitAnswer(interaction.user.id, answer);

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  // Confirmar para o jogador na DM
  await interaction.reply({
    content: `${Emojis.CHECK} Resposta enviada! Aguarde os outros jogadores...`,
    ephemeral: true,
  });

  // Atualizar barra de progresso no canal do servidor
  try {
    const channel = await interaction.client.channels.fetch(session.channelId);
    const progressMsg = await channel.messages.fetch(session.answeringMessageId);
    await progressMsg.edit({
      embeds: [DiloEmbeds.awaitingAnswers(result.answeredCount, result.totalPlayers)],
    });

    // Se todos responderam, iniciar votação
    if (result.allAnswered) {
      await sleep(GameConfig.ROUND_DELAY);
      await startVotingPhase(channel, session);
    }
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err);
    // Tentar iniciar votação mesmo assim se todos responderam
    if (result.allAnswered && session.state === 'answering') {
      try {
        const channel = await interaction.client.channels.fetch(session.channelId);
        await startVotingPhase(channel, session);
      } catch {}
    }
  }
}

// ==========================================
// VOTAÇÃO ANÔNIMA
// ==========================================

async function handleVote(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'voting') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não é hora de votar.')],
      ephemeral: true,
    });
  }

  const targetLabel = interaction.values[0]; // letra: 'A', 'B', etc.
  const result = session.castVote(interaction.user.id, targetLabel);

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `${Emojis.CHECK} Voto na **Resposta ${targetLabel}** registrado!`,
    ephemeral: true,
  });

  const channel = await interaction.client.channels.fetch(session.channelId);

  if (result.allVoted) {
    await revealResults(channel, session);
  } else {
    // Atualizar embed de progresso de votos
    try {
      const votingMsg = await channel.messages.fetch(session.votingMessageId);
      const anonymousAnswers = session.getAnonymousAnswers();
      await votingMsg.edit({
        embeds: [
          DiloEmbeds.votingPhase(anonymousAnswers),
          DiloEmbeds.votingProgress(result.totalVotes, result.totalPlayers),
        ],
        components: votingMsg.components,
      });
    } catch {}
  }
}

// ==========================================
// JOGAR NOVAMENTE
// ==========================================

async function handlePlayAgain(interaction) {
  const { getGuildConfig } = require('../database/queries');

  const config = await getGuildConfig(interaction.guildId);
  if (config && config.channel_id && config.channel_id !== interaction.channelId) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(`Use \`/jogar\` no canal configurado: <#${config.channel_id}>`)],
      ephemeral: true,
    });
  }

  if (gameManager.hasSession(interaction.guildId)) {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Já existe uma partida em andamento.')],
      ephemeral: true,
    });
  }

  const session = gameManager.createSession(
    interaction.guildId,
    interaction.channelId,
    interaction.user.id,
    interaction.client
  );

  session.addPlayer(
    interaction.user.id,
    interaction.user.username,
    interaction.member.displayName
  );

  const row = buildLobbyRow();
  const embed = DiloEmbeds.lobby(session.getPlayerList(), session.hostId, interaction.guild.name);

  const reply = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  session.lobbyMessageId = reply.id;

  const timer = setTimeout(async () => {
    if (session.state === 'lobby') {
      gameManager.forceEndSession(interaction.guildId);
      try {
        await interaction.editReply({
          embeds: [DiloEmbeds.gameCancelled(`${Emojis.CLOCK} O lobby expirou por inatividade.`)],
          components: [],
        });
      } catch {}
    }
  }, GameConfig.LOBBY_TIMEOUT);

  session.addTimer(timer);
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Busca a sessão ativa de um jogador pelo userId.
 * Necessário para interações vindas de DMs (sem guildId).
 */
function findSessionByPlayer(userId) {
  for (const [, session] of gameManager.sessions) {
    if (session.players.has(userId)) {
      return session;
    }
  }
  return null;
}

async function updateLobbyEmbed(interaction, session) {
  try {
    await interaction.message.edit({
      embeds: [DiloEmbeds.lobby(session.getPlayerList(), session.hostId, interaction.guild.name)],
      components: [buildLobbyRow()],
    });
  } catch (err) {
    console.error('Erro ao atualizar lobby:', err);
  }
}

function buildLobbyRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dilo_join')
      .setLabel('Entrar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎮'),
    new ButtonBuilder()
      .setCustomId('dilo_leave')
      .setLabel('Sair')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🚪'),
    new ButtonBuilder()
      .setCustomId('dilo_start')
      .setLabel('Iniciar Partida')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🚀'),
  );
}

async function startVotingPhase(channel, session) {
  // Evitar dupla execução
  if (session.state !== 'answering') return;

  session.startVoting();

  const anonymousAnswers = session.getAnonymousAnswers();

  // Montar opções do select menu com as letras
  const options = anonymousAnswers.map(({ label, answer }) => ({
    label: `Resposta ${label}`,
    description: answer.length > 50 ? answer.substring(0, 47) + '...' : answer,
    value: label,
    emoji: Emojis.TARGET,
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dilo_vote')
      .setPlaceholder(`${Emojis.VOTE} Selecione a resposta suspeita...`)
      .addOptions(options),
  );

  const msg = await channel.send({
    embeds: [DiloEmbeds.votingPhase(anonymousAnswers)],
    components: [row],
  });

  session.votingMessageId = msg.id;

  // Timer de votação
  const timer = setTimeout(async () => {
    if (session.state === 'voting') {
      await revealResults(channel, session);
    }
  }, GameConfig.VOTING_TIMEOUT);

  session.addTimer(timer);
}

async function revealResults(channel, session) {
  // Evitar dupla execução
  if (session.state !== 'voting') return;

  const results = await session.calculateResults();

  const embed = results.impostorCaught
    ? DiloEmbeds.resultImpostorCaught(results)
    : DiloEmbeds.resultImpostorWon(results);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dilo_play_again')
      .setLabel('Jogar Novamente')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔄'),
  );

  await channel.send({ embeds: [embed], components: [row] });

  // Remover componentes da mensagem de votação
  try {
    const votingMsg = await channel.messages.fetch(session.votingMessageId);
    if (votingMsg) await votingMsg.edit({ components: [] });
  } catch {}

  session.endGame();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleComponent, handleModal };
