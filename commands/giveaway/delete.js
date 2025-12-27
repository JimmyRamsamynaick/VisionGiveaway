const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Giveaway = require('../../models/Giveaway');
const GuildSettings = require('../../models/GuildSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Supprimer un giveaway et son message')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('L\'ID du message du giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ messageId: messageId });

        if (!giveaway) {
            return interaction.reply({ content: '❌ Giveaway introuvable dans la base de données.', ephemeral: true });
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
                                { name: 'Supprimé par', value: `${interaction.user.toString()} (\`${interaction.user.id}\`)`, inline: true },
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

            await interaction.reply({ content: '✅ Giveaway supprimé avec succès.', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors de la suppression du giveaway.', ephemeral: true });
        }
    },
};
