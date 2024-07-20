const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Replace with your actual bot token
const BOT_TOKEN = '7004322427:AAHJJ_On93IGS5IlYIWXjm1Nj1zN8K7FzQQ';
const USER_IDS_FILE = path.join(__dirname, 'user_ids.json');
const ADMIN_USER_ID = 6583101990; // Replace with the admin's user ID

// Create a bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Load user IDs from file
function loadUserIds() {
    if (fs.existsSync(USER_IDS_FILE)) {
        return JSON.parse(fs.readFileSync(USER_IDS_FILE));
    }
    return [];
}

// Save user IDs to file
function saveUserIds(userIds) {
    fs.writeFileSync(USER_IDS_FILE, JSON.stringify(userIds));
}

let userIds = loadUserIds();

bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    if (!userIds.includes(userId)) {
        userIds.push(userId);
        saveUserIds(userIds);
    }

    const options = {
        reply_markup: {
            keyboard: [
                [{ text: "Show me Chatwell!", web_app: { url: "https://chatwell-beta.onrender.com/" } }]
            ],
            resize_keyboard: true
        }
    };

    await bot.sendMessage(userId, "Let's do this...", options);
});

bot.onText(/\/notify (.+)/, async (msg, match) => {
    const userId = msg.from.id;
    if (userId !== ADMIN_USER_ID) {
        await bot.sendMessage(userId, "You are not authorized to send notifications.");
        return;
    }

    const args = match[1].split(' ');
    const messageType = args[0].toLowerCase();
    const content = args.slice(1).join(' ');

    for (let id of userIds) {
        try {
            if (messageType === 'text') {
                await bot.sendMessage(id, content);
            } else if (messageType === 'photo') {
                await bot.sendPhoto(id, content, { caption: "Photo notification" });
            } else if (messageType === 'video') {
                await bot.sendVideo(id, content, { caption: "Video notification" });
            } else {
                await bot.sendMessage(userId, "Unknown type. Use text, photo, or video.");
            }
        } catch (e) {
            console.error(`Failed to send message to ${id}: ${e.message}`);
            // Optionally remove user_id from the list if needed
            // userIds = userIds.filter(uid => uid !== id);
            // saveUserIds(userIds);
        }
    }
});

bot.on('polling_error', (error) => {
    console.error(`Polling error: ${error.message}`);
});

app.get('/', (req, res) => {
    res.send('Telegram Bot is running');
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Node.js service running on port ${PORT}`);
});
