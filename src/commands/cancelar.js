const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const gameManager = require('../game/GameManager');
const DiloEmbeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancelar')
    .setDescription('Cancela a partida em andamento neste servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const session = gameManager.getSession(interaction.guildId);

    if (!session) {
      return interaction.reply({
        embeds: [DiloEmbeds.error('Não há nenhuma partida em andamento neste servidor.')],
        ephemeral: true,
      });
    }

    gameManager.forceEndSession(interaction.guildId);

    await interaction.reply({
      embeds: [DiloEmbeds.gameCancelled(`Partida cancelada por <@${interaction.user.id}>.`)],
    });
  },
};
