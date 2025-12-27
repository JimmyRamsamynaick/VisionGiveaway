const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Reroll a giveaway winner')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The message ID of the giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ messageId: messageId });

        if (!giveaway) return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
        if (!giveaway.ended) return interaction.reply({ content: '❌ Giveaway has not ended yet.', ephemeral: true });

        if (giveaway.participants.length === 0) return interaction.reply({ content: '❌ No participants to reroll from.', ephemeral: true });

        // Simple reroll: pick random participant
        const winner = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
        
        const channel = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
        if (channel) {
            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (message) {
                 message.reply(`🎉 **Nouveau Gagnant:** <@${winner.id}> ! (Reroll par <@${interaction.user.id}>)`);
            }
        }

        await interaction.reply({ content: `✅ Reroll effectué ! Nouveau gagnant : <@${winner.id}>`, ephemeral: true });
    },
};
