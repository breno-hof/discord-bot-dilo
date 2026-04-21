const { SlashCommandBuilder } = require('discord.js');
const DiloEmbeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regras')
    .setDescription('Exibe as regras do jogo Dilo.'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [DiloEmbeds.rules()],
    });
  },
};
