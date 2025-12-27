const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Afficher la liste des giveaways en cours'),
    async execute(interaction) {
        try {
            const giveaways = await Giveaway.find({ 
                guildId: interaction.guild.id, 
                ended: false 
            });

            if (!giveaways || giveaways.length === 0) {
                return interaction.reply({ content: '❌ Aucun giveaway en cours sur ce serveur.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎉 Giveaways en cours')
                .setColor(0x00FF00) // Green
                .setTimestamp();

            giveaways.forEach((giveaway, index) => {
                // Limit to 25 fields (Discord embed limit)
                if (index < 25) {
                    const messageLink = `https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}`;
                    const endTimestamp = Math.floor(giveaway.endAt / 1000);
                    
                    embed.addFields({
                        name: `🎁 ${giveaway.prize}`,
                        value: `📍 Salon : <#${giveaway.channelId}>\n👥 Participants : **${giveaway.participants.length}**\n⏳ Fin : <t:${endTimestamp}:R>\n🔗 [Lien du message](${messageLink})`,
                        inline: false
                    });
                }
            });

            if (giveaways.length > 25) {
                embed.setFooter({ text: `Et ${giveaways.length - 25} autres giveaways...` });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Une erreur est survenue lors de la récupération des giveaways.', ephemeral: true });
        }
    },
};
