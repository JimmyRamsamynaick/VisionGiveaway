const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    prize: { type: String, required: true },
    description: { type: String, default: '' },
    startAt: { type: Number, required: true },
    endAt: { type: Number, required: true },
    winnerCount: { type: Number, required: true },
    participants: { 
        type: [{
            id: String,
            username: String,
            discriminator: String,
            avatar: String
        }], 
        default: [] 
    },
    winners: { 
        type: [{
            id: String,
            username: String,
            discriminator: String,
            avatar: String
        }], 
        default: [] 
    },
    hostedBy: { type: String, required: true },
    ended: { type: Boolean, default: false }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
