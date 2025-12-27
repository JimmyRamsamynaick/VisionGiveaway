const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Relancer un tirage au sort')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('L\'ID du message du giveaway')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ messageId: messageId });

        if (!giveaway) return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
        if (!giveaway.ended) return interaction.reply({ content: '❌ Le giveaway n\'est pas encore terminé.', ephemeral: true });

        if (giveaway.participants.length === 0) return interaction.reply({ content: '❌ Aucun participant à tirer au sort.', ephemeral: true });

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
