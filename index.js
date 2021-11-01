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

// General message event. Different stuff happening here :)
bot.on('text', (ctx) => {
    // check if admin/creator
    console.log(ctx.update.message);
    ctx.getChatMember(ctx.update.message.from.id).then((chatMember) => {
        if (chatMember.status === 'creator' || chatMember.status === 'administrator') {
            commandHelper.checkForAdminCommands(ctx);
        }
    });

    // run all other commands
});

bot.launch();

// Enable graceful stop
//process.once('SIGINT', () => bot.stop('SIGINT'))
//process.once('SIGTERM', () => bot.stop('SIGTERM'))