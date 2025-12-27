const { REST, Routes, ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Connecté en tant que ${client.user.tag}`);

        // Définir le statut du bot
        client.user.setPresence({
            activities: [{ 
                name: 'Rejoins le serveur de support', 
                type: ActivityType.Streaming,
                url: 'https://discord.gg/rQNGTfMTum'
            }],
            status: 'online',
        });

        const commands = [];
        client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('Début du rafraîchissement des commandes (/).');
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            console.log('Commandes (/) rechargées avec succès.');
        } catch (error) {
            console.error(error);
        }
    },
};
