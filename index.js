/*!
 * © [2024] SudoR2spr. All rights reserved.
 * Repository: https://github.com/SudoR2spr/
 */

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const path = require('path');

const token = process.env.BOT_TOKEN; // Replace with your bot's token
if (!token) {
    console.error("BOT_TOKEN environment variable is not set.");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const updatesChannel = '@Opleech_WD';

const app = express();
const port = process.env.PORT || 3000;

let data = {};
const dataFile = 'data.json';

// Load data from JSON file
const loadData = () => {
    if (fs.existsSync(dataFile)) {
        data = JSON.parse(fs.readFileSync(dataFile));
    }
};

// Save data to JSON file
const saveData = () => {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

loadData();

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
        console.error('Error checking subscription:', error);
        return false;
    }
};

// Updated sendStartMessage to include image
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
    }).catch(error => {
        console.error('Failed to send start message photo:', error);
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
                        [{ text: "✨ Any Help? ✨", url: "https://t.me/+XfmrBSzTyRFlZTI9" }]
                    ]
                }
            }).catch(error => {
                console.error('Failed to send photo:', error);
            });
        } else {
            sendStartMessage(chatId);

            // Send sticker and delete it after 30 seconds
            const stickerId = "CAACAgIAAxkBAAEM0yZm6Xz0hczRb-S5YkRIck7cjvQyNQACCh0AAsGoIEkIjTf-YvDReDYE";
            bot.sendSticker(chatId, stickerId).then(sentSticker => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, sentSticker.message_id).catch(error => {
                        console.error('Failed to delete sticker message:', error);
                    });
                }, 30000); // 30 seconds
            }).catch(error => {
                console.error('Failed to send sticker:', error);
            });
        }
    } catch (error) {
        console.error('Error handling /start command:', error);
        bot.sendMessage(chatId, `❌ *An error occurred. Please try again later.*`);
    }
});

bot.onText(/\/stat/, (msg) => {
    const chatId = msg.chat.id;
    try {
        const userCount = Object.keys(data).length;
        const linkCount = Object.values(data).reduce((sum, userData) => sum + userData.links.length, 0);

        bot.sendPhoto(chatId, 'https://i.imgur.com/H91ehBY.jpeg', {
            caption: `📊 *Current Bot Stats:*\n\n👥 *Total Users:* ${userCount}\n🔗 *Links Processed:* ${linkCount}`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✨ Dear my friend✨", url: "tg://settings" }]
                ]
            }
        }).catch(error => {
            console.error('Failed to send stats photo:', error);
        });
    } catch (error) {
        console.error('Error handling /stat command:', error);
        bot.sendMessage(chatId, `❌ *An error occurred while retrieving statistics. Please try again later.*`);
    }
});

bot.onText(/\/broad (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const broadcastMessage = match[1];

    for (const userId in data) {
        bot.sendMessage(userId, `📢 *Broadcast Message:*\n\n${broadcastMessage}`).catch(error => {
            console.error(`Failed to send broadcast message to ${userId}:`, error);
        });
    }

    bot.sendMessage(chatId, `✅ *Broadcast message sent to all users.*`).catch(error => {
        console.error('Failed to send broadcast confirmation:', error);
    });
});

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
            bot.sendSticker(chatId, stickerId).then(sentSticker => {
                setTimeout(() => {
                    bot.deleteMessage(chatId, sentSticker.message_id).catch(error => {
                        console.error('Failed to delete sticker message:', error);
                    });
                }, 30000); // 30 seconds
            }).catch(error => {
                console.error('Failed to send sticker:', error);
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
            }).catch(error => {
                console.error('Failed to send invalid link message:', error);
            });
            return;
        }

        if (!data[chatId]) {
            data[chatId] = { links: [] };
        }

        const userLinks = data[chatId].links;
        const existingLink = userLinks.find(linkData => linkData.original === text);

        if (existingLink) {
            bot.sendMessage(chatId, `✅ *Your video has already been processed.* Click the button below to view or download it.`, {
                reply_markup: {
                    inline_keyboard: [[{ text: 'ᢱ Watch / Download ⎙', url: existingLink.download }]]
                }
            }).catch(error => {
                console.error('Failed to send already processed message:', error);
            });
            return;
        }

        bot.sendMessage(chatId, `🔄 **Processing your link...**`).then(sentMessage => {
    const messageId = sentMessage.message_id;

    axios.get(`https://tera.ronok.workers.dev/?link=${text}&apikey=0b010c132e2cbd862cbd8a6ae430dd51d3a0d5ea`)
        .then(response => {
            const downloadUrl = response.data.url;

            userLinks.push({ original: text, download: downloadUrl });
            saveData();

            // Prepare the message and photo to be sent
            const messageText = `✅ *Your video is ready!*\n\n📥 *Click the button below to view or download it.*`;
            const photoUrl = 'https://i.imgur.com/rzorSxY.jpeg';

            // Send the photo first
            bot.sendPhoto(chatId, photoUrl).then(() => {
                // Then edit the message text
                bot.editMessageText(messageText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'ᢱ Watch/Download ⎙', url: downloadUrl }],
                            [{ text: '✨ Read the message ✨', url: 'https://t.me/WOODcraft_Mirror_Zone/44' }]
                        ]
                    }
                }).catch(error => {
                    console.error('Failed to edit message text:', error);
                });
            }).catch(error => {
                console.error('Failed to send photo:', error);
            });
        })
        .catch(error => {
            console.error('Error processing link:', error);
            bot.editMessageText(`❌ *There was an error processing your link. Please try again later.*`, {
                chat_id: chatId,
                message_id: messageId
            }).catch(error => {
                console.error('Failed to edit message text after error:', error);
            });
        });
}).catch(error => {
    console.error('Failed to send processing message:', error);
});
    } catch (error) {
        console.error('Error handling message:', error);
        bot.sendMessage(chatId, `❌ *An error occurred. Please try again later.*`);
    }
});

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason, 'at', promise);
});

process.on('SIGINT', () => {
    saveData();
    process.exit();
});
