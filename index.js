/*!
 * © [2024] SudoR2spr. All rights reserved.
 * Repository: https://github.com/SudoR2spr/
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const token = process.env.BOT_TOKEN; // Replace with your bot's token
if (!token) {
    console.error("BOT_TOKEN environment variable is not set.");
    process.exit(1);
}
const bot = new TelegramBot(token, { polling: true });
const updatesChannel = process.env.OP_CHANNEL; // Replace with your Update channel @Opleech_WD
if (!updatesChannel) {
    console.error("OP_CHANNEL environment variable is not set.");
    process.exit(1);
}

const botOwnerId = process.env.BOT_OWNER_ID; // Replace with the bot owner's Telegram ID
if (!botOwnerId) {
    console.error("BOT_OWNER_ID environment variable is not set.");
    process.exit(1);
}

// MongoDB setup
const uri = process.env.MONGODB_URI; // Replace with your MongoDB URI
if (!uri) {
    console.error("MONGODB_URI environment variable is not set.");
    process.exit(1);
}
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'botDB';
const collectionName = 'userData';

let db;
let collection;

// Connect to MongoDB
const connectToDB = async () => {
    try {
        await client.connect();
        db = client.db(dbName);
        collection = db.collection(collectionName);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

// Save data to MongoDB
const saveData = async (userId, userData) => {
    try {
        await collection.updateOne({ _id: userId }, { $set: userData }, { upsert: true });
    } catch (error) {
        console.error('Failed to save data:', error);
    }
};

// Load data from MongoDB
const loadData = async () => {
    try {
        const users = await collection.find({}).toArray();
        return users.reduce((acc, user) => {
            acc[user._id] = user;
            return acc;
        }, {});
    } catch (error) {
        console.error('Failed to load data:', error);
        return {};
    }
};

connectToDB();

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

// Send welcome message with image
const sendStartMessage = (chatId) => {
    bot.sendPhoto(chatId, 'https://i.imgur.com/6cUMqLc.jpeg', {
        caption: `👋 *Welcome to TeraBox Video Player Bot!*\n\n*Paste your TeraBox link and watch your video instantly—no TeraBox app needed!*\n\nPlease subscribe to our [Updates Channel](https://t.me/Opleech_WD) and click /start again to begin using the bot.`,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '〇 𝐉𝐨𝐢𝐧 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 𝐓𝐨 𝐔𝐬𝐞 𝐌𝐞 〇', url: 'https://t.me/Opleech_WD' }],
                [{ text: '🔗 How to use Bot 🔗', url: 'https://t.me/WOODcraft_Mirror_Zone/43' }]
            ]
        }
    });
};

// Handle the /start command
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
                        [{ text: "✨ Any Help? ✨", url: "https://t.me/+XfmrBSzTyRFlZTI9" }]
                    ]
                }
            }).catch(error => {
                console.error(`Failed to send photo:`, error);
            });
            return;
        } else {
            const stickerId = "CAACAgIAAxkBAAEM0yZm6Xz0hczRb-S5YkRIck7cjvQyNQACCh0AAsGoIEkIjTf-YvDReDYE";
            // Send sticker and delete after 30 seconds
            bot.sendSticker(chatId, stickerId).then(sentSticker => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, sentSticker.message_id).catch(error => {
                        console.error(`Failed to delete sticker message:`, error);
                    });
                }, 30000);
            }).catch(error => {
                console.error(`Failed to send sticker:`, error);
            });

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
        const userCount = (await loadData()).length;
        const linkCount = (await loadData()).reduce((sum, userData) => sum + userData.links.length, 0);

        bot.sendPhoto(chatId, 'https://i.imgur.com/H91ehBY.jpeg', {
            caption: `📊 *Current Bot Stats:*\n\n👥 *Total Users:* ${userCount}\n🔗 *Links Processed:* ${linkCount}`,
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

// Handle the /broad command
bot.onText(/\/broad (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1];

    if (chatId.toString() !== botOwnerId) {
        bot.sendMessage(chatId, `❌ *You are not authorized to use this command.*`);
        return;
    }

    try {
        const users = await loadData();
        for (const userId in users) {
            bot.sendMessage(userId, `📢 *Broadcast Message:*\n\n${broadcastMessage}`).catch(error => {
                console.error(`Failed to send message to ${userId}:`, error);
            });
        }

        bot.sendMessage(chatId, `✅ *Broadcast message sent to all users.*`);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ *An error occurred while sending broadcast message.*`);
    }
});

// Handle link messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/start') || text.startsWith('/stat') || text.startsWith('/broad')) {
        return;
    }

    try {
        const isSubscribed = await checkSubscription(chatId);

        if (!isSubscribed) {
            const stickerId = "CAACAgIAAxkBAAEM0yZm6Xz0hczRb-S5YkRIck7cjvQyNQACCh0AAsGoIEkIjTf-YvDReDYE";
            // Send sticker and delete after 30 seconds
            bot.sendSticker(chatId, stickerId).then(sentSticker => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, sentSticker.message_id).catch(error => {
                        console.error(`Failed to delete sticker message:`, error);
                    });
                }, 30000);
            }).catch(error => {
                console.error(`Failed to send sticker:`, error);
            });
            return;
        }

        if (!isTeraboxLink(text)) {
            bot.sendMessage(chatId, `❌ *That is not a valid TeraBox link.*`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✨ Read the message ✨", url: "https://t.me/WOODcraft_Mirror_Zone/44" }]
                    ]
                }
            });
            return;
        }

        const usersData = await loadData();
        if (!usersData[chatId]) {
            usersData[chatId] = { links: [] };
        }

        const userLinks = usersData[chatId].links;
        const existingLink = userLinks.find(linkData => linkData.original === text);

        if (existingLink) {
            bot.sendPhoto(chatId, 'https://i.imgur.com/5qyYAhJ.jpeg', {
                caption: `✅ *Your video is ready!*\n\n📥 *Click the button below to view or download it.*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: 'ᢱ Watch / Download ⎙', url: existingLink.download }]]
                }
            }).catch(error => {
                console.error(`Failed to send photo:`, error);
            });
            return;
        }

        bot.sendMessage(chatId, `🔄 *Processing your link...*`).then(sentMessage => {
            const messageId = sentMessage.message_id;

            axios.get(`https://tera.ronok.workers.dev/?link=${text}&apikey=0b010c132e2cbd862cbd8a6ae430dd51d3a0d5ea`)
                .then(response => {
                    const downloadUrl = response.data.url;

                    userLinks.push({ original: text, download: downloadUrl });
                    await saveData(chatId, usersData[chatId]);

                    bot.sendPhoto(chatId, 'https://i.imgur.com/5qyYAhJ.jpeg').catch(error => {
                        console.error(`Failed to send photo:`, error);
                    });

                    bot.editMessageText(`✅ *Your video is ready!*\n\n📥 *Click the button below to view or download it.*`, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'ᢱ Watch/Download ⎙', url: downloadUrl }],
                                [{ text: '✨ Read the message ✨', url: 'https://t.me/WOODcraft_Mirror_Zone/44' }]
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

// Serve index.html
const app = express();
const port = process.env.PORT || 3000;
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});
app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason, 'at', promise);
});

process.on('SIGINT', () => {
    client.close();
    process.exit();
});
