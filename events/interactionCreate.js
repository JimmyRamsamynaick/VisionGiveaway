const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');
const Giveaway = require('../models/Giveaway');
const GuildSettings = require('../models/GuildSettings');
const ms = require('ms');
const { endGiveaway } = require('../utils/endGiveaway');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // --- CHAT INPUT COMMANDS ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        
        // --- MODAL SUBMIT (Giveaway Creation) ---
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'giveaway_create_modal') {
                const duration = interaction.fields.getTextInputValue('duration');
                const winnerCount = parseInt(interaction.fields.getTextInputValue('winners'));
                const prize = interaction.fields.getTextInputValue('prize');
                const description = interaction.fields.getTextInputValue('description');

                const msDuration = ms(duration);
                if (!msDuration) return interaction.reply({ content: '❌ Invalid duration format.', ephemeral: true });
                if (isNaN(winnerCount) || winnerCount < 1) return interaction.reply({ content: '❌ Invalid winner count.', ephemeral: true });

                const endTime = new Date(Date.now() + msDuration);
                const channel = interaction.channel;

                // Format:
                // Title: Prize
                // Description:
                // Custom Description (if any)
                //
                // Ends: <t:TIME:R> (<t:TIME:f>)
                // Hosted by: @User
                // Entries: **0**
                // Winners: **N**

                let descriptionText = "";
                if (description) descriptionText += `${description}\n\n`;
                descriptionText += `Ends: <t:${Math.floor(endTime.getTime() / 1000)}:R> (<t:${Math.floor(endTime.getTime() / 1000)}:f>)\n`;
                descriptionText += `Hosted by: ${interaction.user}\n`;
                descriptionText += `Entries: **0**\n`;
                descriptionText += `Winners: **${winnerCount}**`;

                const embed = new EmbedBuilder()
                    .setTitle(prize)
                    .setDescription(descriptionText)
                    .setColor(0x2F3136) // Darker Discord Theme or Blurple
                    .setFooter({ text: `Ends at • ${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}` }); // Simple footer

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('giveaway_join')
                            .setEmoji('🎉')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.reply({ content: `✅ Giveaway created!`, ephemeral: true });
                const message = await channel.send({ embeds: [embed], components: [row] });

                const newGiveaway = new Giveaway({
                    messageId: message.id,
                    channelId: channel.id,
                    guildId: interaction.guild.id,
                    prize: prize,
                    description: description,
                    startAt: Date.now(),
                    endAt: endTime.getTime(),
                    winnerCount: winnerCount,
                    hostedBy: interaction.user.id
                });

                await newGiveaway.save();

                // Log Creation
                try {
                    const settings = await GuildSettings.findOne({ guildId: interaction.guild.id });
                    if (settings && settings.logChannelId) {
                        const logChannel = await interaction.guild.channels.fetch(settings.logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('🎉 Giveaway Créé')
                                .addFields(
                                    { name: 'Prix', value: prize, inline: true },
                                    { name: 'Durée', value: duration, inline: true },
                                    { name: 'Lancé par', value: interaction.user.tag, inline: true },
                                    { name: 'Salon', value: channel.toString(), inline: true }
                                )
                                .setColor(0x00FF00) // Green
                                .setTimestamp();
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                } catch (logErr) {
                    console.error('Error sending log:', logErr);
                }

                // Schedule end
                setTimeout(() => {
                    endGiveaway(interaction.client, message.id);
                }, msDuration);
            }

        // --- BUTTON INTERACTION (Join) ---
        } else if (interaction.isButton()) {
            if (interaction.customId === 'giveaway_join') {
                try {
                    const giveaway = await Giveaway.findOne({ messageId: interaction.message.id });
                    if (!giveaway) return interaction.reply({ content: 'This giveaway no longer exists.', ephemeral: true });

                    if (giveaway.ended) return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true });

                    // Check if already joined
                    const alreadyJoined = giveaway.participants.some(p => p.id === interaction.user.id);
                    if (alreadyJoined) {
                        return interaction.reply({ content: 'You have already joined this giveaway!', ephemeral: true });
                    }

                    // Add participant
                    giveaway.participants.push({
                        id: interaction.user.id,
                        username: interaction.user.username,
                        discriminator: interaction.user.discriminator,
                        avatar: interaction.user.avatar
                    });

                    await giveaway.save();

                    // Update Embed "Entries" count (Optional: Debounce this in high traffic bots)
                    // For now, update every time to match request "Entries: 29"
                    const currentEmbed = interaction.message.embeds[0];
                    const newEmbed = EmbedBuilder.from(currentEmbed);
                    
                    // Rebuild description with new count
                    // We need to find "Entries: **X**" and replace it
                    let description = newEmbed.data.description;
                    const entriesRegex = /Entries: \*\*\d+\*\*/;
                    description = description.replace(entriesRegex, `Entries: **${giveaway.participants.length}**`);
                    newEmbed.setDescription(description);

                    await interaction.message.edit({ embeds: [newEmbed] });

                    await interaction.reply({ content: '🎉 You have successfully joined the giveaway!', ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'Error joining giveaway.', ephemeral: true });
                }
            }
        }
    },
};
