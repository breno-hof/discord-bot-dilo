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
 * Handler principal para interações de componentes (botões, menus, modais).
 */
async function handleComponent(interaction) {
  const customId = interaction.customId;

  // ==========================================
  // BOTÕES DO LOBBY
  // ==========================================

  if (customId === 'dilo_join') {
    return handleJoin(interaction);
  }

  if (customId === 'dilo_leave') {
    return handleLeave(interaction);
  }

  if (customId === 'dilo_start') {
    return handleStart(interaction);
  }

  // ==========================================
  // BOTÃO DE RESPOSTA
  // ==========================================

  if (customId === 'dilo_answer') {
    return handleAnswerButton(interaction);
  }

  // ==========================================
  // MENU DE VOTAÇÃO
  // ==========================================

  if (customId === 'dilo_vote') {
    return handleVote(interaction);
  }

  // ==========================================
  // BOTÃO DE JOGAR NOVAMENTE
  // ==========================================

  if (customId === 'dilo_play_again') {
    return handlePlayAgain(interaction);
  }
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
// IMPLEMENTAÇÕES
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

  // Atualizar embed do lobby
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

  // Se não sobrou ninguém, cancelar
  if (session.players.size === 0) {
    gameManager.forceEndSession(interaction.guildId);
    await interaction.update({
      embeds: [DiloEmbeds.gameCancelled('Todos os jogadores saíram do lobby.')],
      components: [],
    });
    return;
  }

  // Atualizar embed do lobby
  await updateLobbyEmbed(interaction, session);

  await interaction.reply({
    content: `${Emojis.CROSS} <@${interaction.user.id}> saiu do lobby.`,
    ephemeral: true,
  });
}

async function handleStart(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'lobby') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não há lobby ativo no momento.')],
      ephemeral: true,
    });
  }

  // Apenas o host pode iniciar
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

  // Defer para ter mais tempo
  await interaction.deferUpdate();

  try {
    // Iniciar o jogo
    const { playerOrder, dmResults } = await session.startGame();

    // Verificar DMs que falharam
    const failedDMs = dmResults.filter(r => !r.success).map(r => r.userId);

    // Remover botões do lobby
    await interaction.editReply({
      embeds: [DiloEmbeds.lobby(session.getPlayerList(), session.hostId, interaction.guild.name)],
      components: [],
    });

    // Aviso de DMs falhadas
    if (failedDMs.length > 0) {
      const channel = await interaction.client.channels.fetch(session.channelId);
      await channel.send({ embeds: [DiloEmbeds.dmFailed(failedDMs)] });
    }

    // Enviar embed de início da rodada
    const channel = await interaction.client.channels.fetch(session.channelId);
    await channel.send({
      embeds: [DiloEmbeds.roundStart(playerOrder, session.getPlayerList())],
    });

    // Aguardar um momento e iniciar as respostas
    await sleep(GameConfig.ROUND_DELAY);

    // Enviar prompt para o primeiro jogador
    await sendTurnPrompt(channel, session);

  } catch (err) {
    console.error('Erro ao iniciar partida:', err);
    gameManager.forceEndSession(interaction.guildId);
    const channel = await interaction.client.channels.fetch(session.channelId);
    await channel.send({
      embeds: [DiloEmbeds.gameCancelled(`Erro ao iniciar a partida: ${err.message}`)],
    });
  }
}

async function handleAnswerButton(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'answering') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não é hora de responder.')],
      ephemeral: true,
    });
  }

  const currentPlayer = session.getCurrentPlayer();
  if (!currentPlayer || currentPlayer.id !== interaction.user.id) {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não é sua vez de responder!')],
      ephemeral: true,
    });
  }

  // Abrir modal para resposta
  const modal = new ModalBuilder()
    .setCustomId('dilo_answer_modal')
    .setTitle(`${Emojis.QUESTION} Sua Resposta`);

  const answerInput = new TextInputBuilder()
    .setCustomId('answer_text')
    .setLabel('Digite sua resposta')
    .setPlaceholder('Responda à pergunta que recebeu na DM...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder().addComponents(answerInput));

  await interaction.showModal(modal);
}

async function handleAnswerSubmit(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'answering') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não é hora de responder.')],
      ephemeral: true,
    });
  }

  const answer = interaction.fields.getTextInputValue('answer_text');
  const turnNumber = session.currentPlayerIndex + 1;
  const player = session.players.get(interaction.user.id);

  const result = session.submitAnswer(interaction.user.id, answer);

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  // Mostrar a resposta no canal
  await interaction.reply({
    embeds: [DiloEmbeds.playerAnswer(player, answer, turnNumber)],
  });

  const channel = await interaction.client.channels.fetch(session.channelId);

  if (result.allAnswered) {
    // Todos responderam — iniciar votação
    await sleep(GameConfig.ROUND_DELAY);
    await startVotingPhase(channel, session);
  } else {
    // Próximo jogador
    await sleep(1500);
    await sendTurnPrompt(channel, session);
  }
}

async function handleVote(interaction) {
  const session = gameManager.getSession(interaction.guildId);
  if (!session || session.state !== 'voting') {
    return interaction.reply({
      embeds: [DiloEmbeds.error('Não é hora de votar.')],
      ephemeral: true,
    });
  }

  const targetId = interaction.values[0];
  const result = session.castVote(interaction.user.id, targetId);

  if (!result.success) {
    return interaction.reply({
      embeds: [DiloEmbeds.error(result.reason)],
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `${Emojis.CHECK} Seu voto foi registrado!`,
    ephemeral: true,
  });

  // Atualizar progresso
  const channel = await interaction.client.channels.fetch(session.channelId);

  if (result.allVoted) {
    // Todos votaram — revelar resultado
    await revealResults(channel, session);
  } else {
    // Atualizar barra de progresso
    try {
      const votingMsg = await channel.messages.fetch(session.votingMessageId);
      if (votingMsg) {
        // Adicionar embed de progresso como follow-up
      }
    } catch {}
  }
}

async function handlePlayAgain(interaction) {
  // Simular o comando /jogar
  const { getGuildConfig } = require('../database/queries');

  const config = getGuildConfig(interaction.guildId);
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

  const row = new ActionRowBuilder().addComponents(
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

  const embed = DiloEmbeds.lobby(
    session.getPlayerList(),
    session.hostId,
    interaction.guild.name
  );

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

async function updateLobbyEmbed(interaction, session) {
  try {
    const embed = DiloEmbeds.lobby(
      session.getPlayerList(),
      session.hostId,
      interaction.guild.name
    );

    const row = new ActionRowBuilder().addComponents(
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

    await interaction.message.edit({
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.error('Erro ao atualizar lobby:', err);
  }
}

async function sendTurnPrompt(channel, session) {
  const currentPlayer = session.getCurrentPlayer();
  if (!currentPlayer) return;

  const turnNumber = session.currentPlayerIndex + 1;
  const totalPlayers = session.players.size;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dilo_answer')
      .setLabel('Responder')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✍️'),
  );

  await channel.send({
    embeds: [DiloEmbeds.playerTurn(currentPlayer, turnNumber, totalPlayers)],
    components: [row],
  });

  // Timer para pular jogador se demorar
  const timer = setTimeout(async () => {
    if (session.state === 'answering') {
      const cp = session.getCurrentPlayer();
      if (cp && cp.id === currentPlayer.id) {
        // Pular jogador
        const result = session.submitAnswer(currentPlayer.id, '*Não respondeu a tempo*');
        await channel.send({
          embeds: [DiloEmbeds.playerAnswer(currentPlayer, '*Não respondeu a tempo*', turnNumber)],
        });

        if (result.allAnswered) {
          await sleep(GameConfig.ROUND_DELAY);
          await startVotingPhase(channel, session);
        } else {
          await sleep(1500);
          await sendTurnPrompt(channel, session);
        }
      }
    }
  }, GameConfig.ANSWER_TIMEOUT);

  session.addTimer(timer);
}

async function startVotingPhase(channel, session) {
  session.startVoting();

  const players = session.getPlayerList();
  const answers = Object.fromEntries(session.answers);

  // Criar menu de seleção para votação
  const options = players.map(p => ({
    label: p.displayName,
    description: `Votar em ${p.displayName}`,
    value: p.id,
    emoji: Emojis.TARGET,
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dilo_vote')
      .setPlaceholder(`${Emojis.VOTE} Selecione o suspeito...`)
      .addOptions(options),
  );

  const msg = await channel.send({
    embeds: [DiloEmbeds.votingPhase(players, answers)],
    components: [row],
  });

  session.votingMessageId = msg.id;

  // Timer para encerrar votação
  const timer = setTimeout(async () => {
    if (session.state === 'voting') {
      // Forçar resultado com os votos existentes
      await revealResults(channel, session);
    }
  }, GameConfig.VOTING_TIMEOUT);

  session.addTimer(timer);
}

async function revealResults(channel, session) {
  const results = session.calculateResults();

  // Escolher embed baseado no resultado
  const embed = results.impostorCaught
    ? DiloEmbeds.resultImpostorCaught(results)
    : DiloEmbeds.resultImpostorWon(results);

  // Botão de jogar novamente
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dilo_play_again')
      .setLabel('Jogar Novamente')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔄'),
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });

  // Remover componentes da mensagem de votação
  try {
    const votingMsg = await channel.messages.fetch(session.votingMessageId);
    if (votingMsg) {
      await votingMsg.edit({ components: [] });
    }
  } catch {}

  // Encerrar sessão
  session.endGame();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleComponent, handleModal };
