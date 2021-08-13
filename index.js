import * as fs from 'fs';
import * as path from 'path';
import { Telegraf } from 'telegraf';
import CommandHelper from './Helper/CommandHelper.js';

// import telegram config
const telegramConfig = JSON.parse(fs.readFileSync('./Config/telegram.json'));

// Command helper checks for specific commands defined by the user and other
// special "commands" like detecting reputation changes
const commandHelper = new CommandHelper();

// Setup Telegram bot
const bot = new Telegraf(telegramConfig.telegramApiToken)

// This command lets the bot reply with the users own stats
bot.command('stats', (ctx) => {
    commandHelper.replyWithUserStats(ctx);
});

// General message event. Different stuff happening here :)
bot.on('text', (ctx) => {
    commandHelper.checkForCommands(ctx);
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))