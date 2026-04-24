const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildChannel } = require('../database/queries');
const DiloEmbeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar')
    .setDescription('Define o canal de jogo do Dilo neste servidor.')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal onde as partidas serão realizadas')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.options.getChannel('canal');

    await setGuildChannel(interaction.guildId, channel.id);

    await interaction.reply({
      embeds: [DiloEmbeds.channelConfigured(channel.id)],
    });
  },
};
