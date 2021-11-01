import BlacklistService from '../Services/BlacklistService.js';

export default class CommandHelper {
    constructor() {
        this.blacklistService = new BlacklistService();
    }

    checkForAdminCommands(context) {
        const messageText = context.update.message.text;
        let command = '';

        // detect hidden command in the message, not visible in the commands list
        command = this.getCommandFromMessage(messageText);
        if (command) {
            switch (command) {
                case '/ban':
                    this.blacklistService.addUserToBlacklist(context);
                    break;
                case '/blacklist':
                    this.blacklistService.searchInBlacklist(context);
                    break;
            
                default:
                    break;
            }
        }
    }

    getCommandFromMessage(message) {
        const command = message.match(/\/\S+/);
        if (!Array.isArray(command)) return false;

        return command[0];
    }
}