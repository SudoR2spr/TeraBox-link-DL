/*!
 * © [2024] SudoR2spr. All rights reserved.
 * Repository: https://github.com/SudoR2spr/
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI; 
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
let db, usersCollection;

const initDb = async () => {
    try {
        await client.connect();
        db = client.db('telegramBot');
        usersCollection = db.collection('users');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const token = process.env.BOT_TOKEN; 
const updatesChannel = process.env.OP_CHANNEL; 
const bot = new TelegramBot(token, { polling: true });
const app = express();
const port = process.env.PORT || 3000;

const teraboxDomains = [
    "www.mirrobox.com", "www.nephobox.com", "freeterabox.com", "www.freeterabox.com", "1024tera.com",
    "4funbox.co", "www.4funbox.com", "teraboxlink.com", "terasharelink.com", "terabox.app", "terabox.com",
    "www.terabox.app", "terabox.fun", "www.terabox.com", "www.1024tera.com", "www.momerybox.com",
    "teraboxapp.com", "momerybox.com", "tibibox.com", "www.teraboxshare.com", "www.teraboxapp.com"
];

const isTeraboxLink = (link) => {
    return teraboxDomains.some(domain => link.includes(domain));
};

const checkSubscription = async (userId) => {
    try {
        const chatMember = await bot.getChatMember(updatesChannel, userId);
        return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
    } catch (error) {
        console.error(error);
        return false;
    }
};

const sendStartMessage = (chatId) => {
    bot.sendPhoto(chatId, 'https://i.imgur.com/6cUMqLc.jpeg', {
        caption: `👋 *Welcome to TeraBox Video Player Bot!*\n\n*Paste your TeraBox link and watch your video instantly—no TeraBox app needed!*\n\nPlease subscribe to our [Updates Channel](https://t.me/Opleech_WD) and click /start again to begin using the bot.`,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Join Channel to Use Me', url: 'https://t.me/Opleech_WD' }],
                [{ text: 'How to use Bot', url: 'https://t.me/WOODcraft_Mirror_Zone/43' }]
            ]
        }
    });
};

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const isSubscribed = await checkSubscription(chatId);
        if (isSubscribed) {
            const photoUrl = 'https://i.imgur.com/rzorSxY.jpeg';
            bot.sendPhoto(chatId, photoUrl, {
                caption: `🎉 *Welcome back!* 😊\n\n*Send a TeraBox link to watch or download your video.* 🍿`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Any Help?", url: "https://t.me/+XfmrBSzTyRFlZTI9" }]
                    ]
                }
            });
            return;
        } else {
            sendStartMessage(chatId);
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ *An error occurred. Please try again later.*`);
    }
});

// Handle the /stat command
bot.onText(/\/stat/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const userCount = await usersCollection.countDocuments();
        const linkCount = await usersCollection.aggregate([
            { $unwind: "$links" },
            { $count: "count" }
        ]).toArray();

        bot.sendPhoto(chatId, 'https://i.imgur.com/H91ehBY.jpeg', {
            caption: `📊 *Current Bot Stats:*\n\n👥 *Total Users:* ${userCount}\n🔗 *Links Processed:* ${linkCount[0]?.count || 0}`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✨ Dear my friend✨", url: "tg://settings" }]
                ]
            }
        });
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ *An error occurred while retrieving statistics. Please try again later.*`);
    }
});

// Handle all other messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/start') || text.startsWith('/stat')) {
        return;
    }

    try {
        const isSubscribed = await checkSubscription(chatId);
        if (!isSubscribed) {
            sendStartMessage(chatId);
            return;
        }

        if (!isTeraboxLink(text)) {
            bot.sendMessage(chatId, `❌ *That is not a valid TeraBox link.*`);
            return;
        }

        const userLinks = data[chatId]?.links || [];
        const existingLink = userLinks.find(linkData => linkData.original === text);

        if (existingLink) {
            bot.sendPhoto(chatId, 'https://i.imgur.com/rzorSxY.jpeg', {
                caption: `✅ *Your video is ready!*\n\n📥 *Click the button below to view or download it.*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: 'ᢱ Watch / Download ⎙', url: existingLink.download }]]
                }
            });
            return;
        }

        bot.sendMessage(chatId, `🔄 *Processing your link...*`).then(sentMessage => {
            const messageId = sentMessage.message_id;

            axios.get(`https://tera.ronok.workers.dev/?link=${text}&apikey=0b010c132e2cbd862cbd8a6ae430dd51d3a0d5ea`)
                .then(response => {
                    const downloadUrl = response.data.url;

                    userLinks.push({ original: text, download: downloadUrl });
                    data[chatId] = { links: userLinks };

                    bot.editMessageText(`✅ *Your video is ready!*\n\n📥 *Click the button below to view or download it.*`, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'ᢱ Watch/Download ⎙', url: downloadUrl }]
                            ]
                        }
                    });
                })
                .catch(error => {
                    console.error(error);
                    bot.editMessageText(`❌ *There was an error processing your link. Please try again later.*`, {
                        chat_id: chatId,
                        message_id: messageId
                    });
                });
        });
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ *An error occurred. Please try again later.*`);
    }
});

// Initialize the bot and database
initDb();
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Add this route
app.get('/', (req, res) => {
    res.send('TeraBox Bot is running!');
});
