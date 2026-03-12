const { EmbedBuilder } = require('discord.js');
const Giveaway = require('../models/Giveaway');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const giveaways = await Giveaway.find({
                guildId: member.guild.id,
                ended: false,
                'participants.id': member.id
            });

            if (!giveaways.length) return;

            for (const giveaway of giveaways) {
                giveaway.participants = giveaway.participants.filter(p => p.id !== member.id);
                await giveaway.save();

                const channel = await member.guild.channels.fetch(giveaway.channelId).catch(() => null);
                if (!channel || !channel.isTextBased()) continue;

                const giveawayMessage = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                if (!giveawayMessage || !giveawayMessage.embeds?.length) continue;

                const currentEmbed = giveawayMessage.embeds[0];
                const newEmbed = EmbedBuilder.from(currentEmbed);

                let description = newEmbed.data.description || '';
                const entriesRegex = /Participants : \*\*\d+\*\*/;
                if (entriesRegex.test(description)) {
                    description = description.replace(entriesRegex, `Participants : **${giveaway.participants.length}**`);
                }
                newEmbed.setDescription(description);

                await giveawayMessage.edit({ embeds: [newEmbed] });
            }
        } catch (error) {
            console.error('Erreur guildMemberRemove giveaway cleanup:', error);
        }
    },
};
