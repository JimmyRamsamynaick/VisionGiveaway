require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, Events } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const fs = require('fs');
const ms = require('ms');

// --- CONFIGURATION ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();
const app = express();

// --- WEB SERVER ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes Web
const Giveaway = require('./models/Giveaway');

app.get('/giveaway/:messageId', async (req, res) => {
    try {
        const giveaway = await Giveaway.findOne({ messageId: req.params.messageId });
        if (!giveaway) return res.render('logs', { error: 'Giveaway not found', giveaway: null });
        
        // Fetch host info
        let hostUser = null;
        try {
            hostUser = await client.users.fetch(giveaway.hostedBy);
        } catch (e) {
            console.error('Could not fetch host user:', e);
        }

        res.render('logs', { giveaway, ms, error: null, hostUser });
    } catch (err) {
        console.error(err);
        res.render('logs', { error: 'Server Error', giveaway: null, hostUser: null });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`[WEB] Serveur lancé sur le port ${process.env.PORT || 3000}`);
});

// --- DISCORD CLIENT ---

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);
const commandsToRegister = [];

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsToRegister.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] La commande à ${filePath} manque "data" ou "execute".`);
        }
    }
}

// Event Handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('[DB] Connecté à MongoDB');
        
        // --- RECOVERY SYSTEM (VISION) ---
        // Relance les timers pour les giveaways actifs après un redémarrage
        // On le fait ICI, une fois la DB connectée
        const { endGiveaway } = require('./utils/endGiveaway');
        
        Giveaway.find({ ended: false }).then(activeGiveaways => {
            console.log(`[SYSTEM] ${activeGiveaways.length} giveaways actifs trouvés.`);

            activeGiveaways.forEach(giveaway => {
                const timeLeft = giveaway.endAt - Date.now();
                
                if (timeLeft <= 0) {
                    // Le giveaway aurait dû finir pendant que le bot était éteint
                    console.log(`[SYSTEM] Fin immédiate du giveaway ${giveaway.messageId}`);
                    endGiveaway(client, giveaway.messageId);
                } else {
                    // Relance le timer
                    console.log(`[SYSTEM] Reprise du timer pour ${giveaway.messageId} (${ms(timeLeft)})`);
                    setTimeout(() => {
                        endGiveaway(client, giveaway.messageId);
                    }, timeLeft);
                }
            });
        }).catch(err => console.error('[SYSTEM] Erreur lors de la récupération des giveaways:', err));

        // Connexion du bot après succès DB
        client.login(process.env.DISCORD_TOKEN);
    })
    .catch(err => {
        console.error('[DB] ❌ Erreur de connexion MongoDB :', err.message);
        if (err.message.includes('whitelisted') || err.name === 'MongooseServerSelectionError') {
            console.log('\n⚠️  --- ACTION REQUISE SUR MONGODB ATLAS ---');
            console.log('Votre adresse IP est bloquée par MongoDB Atlas.');
            console.log('1. Connectez-vous sur https://cloud.mongodb.com');
            console.log('2. Allez dans l\'onglet "Network Access" (à gauche).');
            console.log('3. Cliquez sur "Add IP Address".');
            console.log('4. Choisissez "Allow Access from Anywhere" (0.0.0.0/0) ou "Add Current IP Address".');
            console.log('5. Attendez 1-2 minutes et relancez le bot.\n');
        }
    });

// Login & Register Commands
client.once(Events.ClientReady, async c => {
    console.log(`[BOT] Connecté en tant que ${c.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('[BOT] Rafraîchissement des commandes (/) Slash...');
        
        // Register globally
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commandsToRegister },
        );
        
        console.log('[BOT] Commandes (/) Slash rechargées avec succès.');
    } catch (error) {
        console.error(error);
    }
});

// REMOVED: client.login(process.env.DISCORD_TOKEN); -> Moved inside mongoose.connect.then()
