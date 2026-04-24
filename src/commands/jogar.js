const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const gameManager = require('../game/GameManager');
const { getGuildConfig } = require('../database/queries');
const DiloEmbeds = require('../utils/embeds');
const { Emojis, GameConfig } = require('../utils/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jogar')
    .setDescription('Inicia um novo lobby do Dilo.'),

  async execute(interaction) {
    // Verificar se o canal está configurado
    const config = await getGuildConfig(interaction.guildId);
    if (config && config.channel_id && config.channel_id !== interaction.channelId) {
      return interaction.reply({
        embeds: [DiloEmbeds.error(
          `O canal de jogo configurado é <#${config.channel_id}>.\nUse \`/jogar\` lá ou peça a um admin para reconfigurar com \`/configurar\`.`
        )],
        ephemeral: true,
      });
    }

    // Verificar se já existe partida
    if (gameManager.hasSession(interaction.guildId)) {
      return interaction.reply({
        embeds: [DiloEmbeds.error('Já existe uma partida em andamento neste servidor.\nUse `/cancelar` para encerrá-la.')],
        ephemeral: true,
      });
    }

    // Criar sessão
    const session = gameManager.createSession(
      interaction.guildId,
      interaction.channelId,
      interaction.user.id,
      interaction.client
    );

    // Adicionar o host como primeiro jogador
    session.addPlayer(
      interaction.user.id,
      interaction.user.username,
      interaction.member.displayName
    );

    // Botões do lobby
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

    // Auto-cancelar lobby após timeout
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
  },
};
