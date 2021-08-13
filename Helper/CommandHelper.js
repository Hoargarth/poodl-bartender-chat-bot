import ReputationService from '../Services/ReputationService.js';


export default class CommandHelper {
    constructor() {
        this.reputationService = new ReputationService();
    }

    checkForCommands(context) {
        const message = context.update.message;

        // check if reputation vote
        if (this.isReputationChange(context)) {
            this.performReputationChange(context);
        }
        
        // // switch on custom commands
        // switch (key) {
        //     case value:
                
        //         break;
        
        //     default:
        //         break;
        // }
    }

    /**
     * Make checks if this message should increase or decrease the reputation from
     * the answered user.
     * 
     * @param {*} context 
     * @returns boolean
     */
    isReputationChange(context) {
        const originalMessage = context.update.message.reply_to_message;

        // don't do any further tasks if message was not a reply or user replied to itself
        if (typeof originalMessage === 'undefined') return false;

        const originalUserId = originalMessage.from.id;
        const answeringMessage = context.update.message;
        const answeringUserId = answeringMessage.from.id;

        if (originalUserId === answeringUserId) return false;

        // only + or - are allowed for reputation change
        if (new RegExp("^[+\+]+$").test(answeringMessage.text) || new RegExp("^[-\-]+$").test(answeringMessage.text)) {
            return true;
        }

        return false;
    }

    /**
     * Determines if reputation should be increased or not and
     * performs the change.
     * 
     * @param {*} context 
     */
    performReputationChange(context) {
        const originalMessage = context.update.message.reply_to_message;
        const originalUser = originalMessage.from;
        const answeringMessage = context.update.message;
        const answeringUser = answeringMessage.from;

        if (new RegExp("^[+\+]+$").test(answeringMessage.text)) {
            // add user to database or add if existing
            this.reputationService.increaseReputation(originalUser, answeringUser);
        }

        if (new RegExp("^[-\-]+$").test(answeringMessage.text)) {
            // add user to database or decrease if existing
            this.reputationService.decreaseRepuation(originalUser, answeringUser);
        }
    }

    /**
     * Let the bot reply with the users current reputation
     * 
     * @param {*} context 
     */
    replyWithUserStats(context) {
        // show users stats
        const messageUserID = context.update.message.from.id;
        const reputation = this.reputationService.getUserReputation(messageUserID);
        const messageID = context.message.message_id;

        reputation.then(reputation => {
            context.replyWithMarkdown(
                `Your Reputation: ${reputation}`,
                {
                    disable_web_page_preview: true,
                    disable_notification: true,
                    reply_to_message_id : messageID
                }
            );
        });
    }
}