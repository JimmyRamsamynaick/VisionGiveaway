const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Set the log channel for giveaway results.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send logs to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        await GuildSettings.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { logChannelId: channel.id },
            { upsert: true, new: true }
        );

        await interaction.reply({ content: `✅ Log channel set to ${channel}`, ephemeral: true });
    },
};
