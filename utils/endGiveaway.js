const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');
const GuildSettings = require('../models/GuildSettings');

async function endGiveaway(client, giveawayId) {
    const giveaway = await Giveaway.findOne({ messageId: giveawayId });
    if (!giveaway) return console.log('Giveaway introuvable pour ID:', giveawayId);
    if (giveaway.ended) return;

    let participants = giveaway.participants;
    try {
        const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
        if (guild && participants.length > 0) {
            const checks = await Promise.allSettled(participants.map(p => guild.members.fetch(p.id)));
            participants = participants.filter((_, idx) => checks[idx].status === 'fulfilled');
            giveaway.participants = participants;
        }
    } catch (err) {
        console.error('Erreur lors de la validation des participants:', err);
    }

    // Marquer comme terminé
    giveaway.ended = true;
    
    // Tirage au sort
    const winnerCount = giveaway.winnerCount;
    const winners = [];

    if (participants.length > 0) {
        // Mélanger et prendre les gagnants
        const shuffled = participants.sort(() => 0.5 - Math.random());
        winners.push(...shuffled.slice(0, winnerCount));
    }

    giveaway.winners = winners;
    await giveaway.save();

    // Récupérer le channel et le message
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        if (channel) {
            const message = await channel.messages.fetch(giveaway.messageId);
            if (message) {
                const winnerText = winners.length > 0 ? winners.map(w => `<@${w.id}>`).join(', ') : 'Aucun participant.';
                
                // Format GiveawayBot (Screen 3)
                // Ended: <t:TIME:R> (<t:TIME:f>)
                // Hosted by: @User
                // Entries: **N**
                // Winners: @Winners
                
                let descriptionText = "";
                if (giveaway.description) descriptionText += `${giveaway.description}\n\n`;
                descriptionText += `Terminé : <t:${Math.floor(Date.now() / 1000)}:R> (<t:${Math.floor(Date.now() / 1000)}:f>)\n`;
                descriptionText += `Lancé par : <@${giveaway.hostedBy}>\n`;
                descriptionText += `Participants : **${participants.length}**\n`;
                descriptionText += `Gagnants : ${winnerText}`;

                const embed = EmbedBuilder.from(message.embeds[0]);
                embed.setTitle(giveaway.prize); // Keep Prize Title
                embed.setDescription(descriptionText);
                embed.setColor(0x2F3136); // Darker Discord Theme

                // Button "Giveaway Summary"
                const summaryRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Résumé du Giveaway')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`${process.env.DOMAIN || 'http://localhost:3000'}/giveaway/${giveaway.messageId}`)
                            .setEmoji('🔗')
                    );

                await message.edit({ embeds: [embed], components: [summaryRow] });
                
                // Message de notification dans le channel
                if (winners.length > 0) {
                    await channel.send(`🎉 Félicitations ${winnerText} ! Vous avez gagné **${giveaway.prize}** !`);
                }
            }
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour du message de giveaway:', err);
    }

    // Logs dans le salon de logs (Optionnel si on a déjà le bouton Summary)
    try {
        const settings = await GuildSettings.findOne({ guildId: giveaway.guildId });
        if (settings && settings.logChannelId) {
            const logChannel = await client.channels.fetch(settings.logChannelId);
            if (logChannel) {
                const winnerText = winners.length > 0 ? winners.map(w => `<@${w.id}> (${w.username})`).join(', ') : 'Aucun';
                
                const logEmbed = new EmbedBuilder()
                    .setTitle('📋 Vision Logs : Giveaway Terminé')
                    .addFields(
                        { name: 'Prix', value: giveaway.prize, inline: true },
                        { name: 'Gagnant(s)', value: winnerText, inline: true },
                        { name: 'Participants', value: `${participants.length}`, inline: true },
                        { name: 'Lien Vision', value: `[Cliquez ici](${process.env.DOMAIN}/giveaway/${giveaway.messageId})` }
                    )
                    .setTimestamp()
                    .setColor(0x00FF00); // Vert

                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    } catch (err) {
        console.error('Erreur logs:', err);
    }
}

module.exports = { endGiveaway };
