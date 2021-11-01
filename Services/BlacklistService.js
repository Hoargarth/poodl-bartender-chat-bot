import * as mysql from 'mysql';
import * as fs from 'fs';

export default class BlacklistService {
    constructor() {
        this.databaseConfig = JSON.parse(fs.readFileSync('./Config/telegram.json'));
        this.setupBlacklistTable();
    }

    setupBlacklistTable() {
        const databaseConfig = this.databaseConfig;
        this.database = mysql.createConnection({
            host : databaseConfig.database.host,
            user : databaseConfig.database.user,
            password : databaseConfig.database.password,
            database : databaseConfig.database.name
        });

        const createBlacklistTable = `CREATE TABLE IF NOT EXISTS telegram_blacklist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_handle VARCHAR(255),
            reason TEXT,
            channel_id INT NOT NULL,
            channel_name VARCHAR(255),
            blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`

        this.database.query(createBlacklistTable, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }

    addUserToBlacklist(context) {
        const userId = context.update.message.reply_to_message.from.id;
        const userHandle = context.update.message.reply_to_message.from.username;
        const channel_id = context.update.message.reply_to_message.chat.id;
        const channel_name = context.update.message.reply_to_message.chat.title;

        const banMessage = context.update.message.text.split('/ban');
        const reason = (banMessage.length > 1) ? banMessage[1] : '';

        const addUserQuery = `INSERT INTO telegram_blacklist (user_id, user_handle, reason, channel_id, channel_name)
            VALUES (${userId}, "${userHandle}", "${reason}", ${channel_id}, "${channel_name}");
        `;

        this.database.query(addUserQuery, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }

    searchInBlacklist(context) {
        const searchMessage = context.update.message.text.split('/blacklist ');
        const searchString = (searchMessage.length > 1) ? searchMessage[1] : '';

        if (!searchString && !context.update.message.reply_to_message) return;

        let searchQuery = ''

        if (context.update.message.reply_to_message) {
            searchQuery = `SELECT *
            FROM telegram_blacklist
            WHERE
                user_id = ${context.update.message.reply_to_message.from.id};
            `;
            console.log(searchQuery);
        } else {
            searchQuery = `SELECT *
            FROM telegram_blacklist
            WHERE
                user_handle LIKE '%${searchString}%'
                OR reason LIKE '%${searchString}%';
            `;
        }


        this.database.query(searchQuery, (error, results, fields) => {
            if (results.length > 0) {
                let searchResults = '';

                results.forEach(dataPacket => {
                    const resultData = `UserID: ${dataPacket.user_id}
UserHandle: ${dataPacket.user_handle}
Ban reason: ${dataPacket.reason}
Channel: ${dataPacket.channel_name}

`;

                    searchResults += resultData;
                });

                context.replyWithMarkdown(
                    searchResults,
                    {
                        disable_web_page_preview: true,
                        disable_notification: true
                    }
                )
            } else {
                context.replyWithMarkdown(
                    'No results',
                    {
                        disable_web_page_preview: true,
                        disable_notification: true
                    }
                )
            }
        })
    }
 }