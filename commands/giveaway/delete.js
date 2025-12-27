const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete a giveaway and its message')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The message ID of the giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ messageId: messageId });

        if (!giveaway) {
            return interaction.reply({ content: '❌ Giveaway not found in database.', ephemeral: true });
        }

        try {
            // Delete the message from Discord
            const channel = await interaction.guild.channels.fetch(giveaway.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(messageId);
                    if (message) {
                        await message.delete();
                    }
                } catch (err) {
                    console.error('Error fetching/deleting message:', err);
                    // Continue to delete from DB even if message is gone
                }
            }

            // Log Deletion
            try {
                const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
                if (settings && settings.logChannelId) {
                    const logChannel = await interaction.guild.channels.fetch(settings.logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('🗑️ Giveaway Supprimé')
                            .addFields(
                                { name: 'Prix', value: giveaway.prize, inline: true },
                                { name: 'Supprimé par', value: interaction.user.tag, inline: true },
                                { name: 'ID Message', value: messageId, inline: true }
                            )
                            .setColor(0xFF0000) // Red
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (logErr) {
                console.error('Error sending log:', logErr);
            }

            // Delete from Database
            await Giveaway.deleteOne({ messageId: messageId });

            await interaction.reply({ content: '✅ Giveaway deleted successfully.', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ An error occurred while deleting the giveaway.', ephemeral: true });
        }
    },
};
