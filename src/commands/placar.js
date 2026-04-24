const { SlashCommandBuilder } = require('discord.js');
const { getGuildLeaderboard } = require('../database/queries');
const DiloEmbeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('placar')
    .setDescription('Exibe o placar de vitórias do servidor.'),

  async execute(interaction) {
    const scores = await getGuildLeaderboard(interaction.guildId);
    const guildName = interaction.guild.name;

    await interaction.reply({
      embeds: [DiloEmbeds.leaderboard(scores, guildName)],
    });
  },
};
