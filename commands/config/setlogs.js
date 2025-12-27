const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Définir le salon de logs pour les résultats.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Le salon où envoyer les logs')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { logChannelId: channel.id },
            { upsert: true, new: true }
        );

        await interaction.reply({ content: `✅ Salon de logs défini sur ${channel}`, ephemeral: true });
    },
};
