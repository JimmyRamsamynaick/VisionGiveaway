const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Créer un nouveau giveaway via un formulaire')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('giveaway_create_modal')
            .setTitle('Créer un Giveaway');

        // Add inputs to the modal
        const durationInput = new TextInputBuilder()
            .setCustomId('duration')
            .setLabel("Durée")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 10 minutes')
            .setRequired(true);

        const winnersInput = new TextInputBuilder()
            .setCustomId('winners')
            .setLabel("Nombre de gagnants")
            .setStyle(TextInputStyle.Short)
            .setValue('1')
            .setRequired(true);

        const prizeInput = new TextInputBuilder()
            .setCustomId('prize')
            .setLabel("Prix")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel("Description")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(false);

        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new ActionRowBuilder().addComponents(durationInput);
        const secondActionRow = new ActionRowBuilder().addComponents(winnersInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(prizeInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(descriptionInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};
