import * as fs from 'fs';
import sqlite3 from 'sqlite3';

export default class ReputationService {
    constructor() {
        this.setupDatabase();
    }

    openDatabase() {
        return new sqlite3.Database('./Persisted/reputation.db');
    }

    setupDatabase() {
        const database = this.openDatabase();

        database.serialize(() => {
            const reputationTableSetup = `CREATE TABLE IF NOT EXISTS user_reputation (
                telegram_id INTEGER PRIMARY KEY,
                telegram_name TEXT NOT NULL,
                reputation INTEGER NOT NULL DEFAULT 0
            );`;
            const reputationVoterSetup = `CREATE TABLE IF NOT EXISTS user_reputation_voters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id_voter INTEGER NOT NULL,
                telegram_id_elect INTEGER NOT NULL,
                timestamp INTEGER NOT NULL DEFAULT 0
            );`;

            database.run(reputationTableSetup);
            database.run(reputationVoterSetup);
        });

        database.close();
    }

    isChangeAllowed(originalUser, answeringUser) {
        const timeStamp = Date.now() - 300000; // get the timestamp from 5 minutes before
        const telegramIdElect = originalUser.id;
        const telegramIdVoter = answeringUser.id;
        const database = this.openDatabase();

        return new Promise((resolve, reject) => {
            const getEntriesStatement = `SELECT * FROM user_reputation_voters
            WHERE telegram_id_voter = ${telegramIdVoter}
                AND telegram_id_elect = ${telegramIdElect}
                AND timestamp >= ${timeStamp};
            `;
            database.all(getEntriesStatement, (err, rows) => {
                database.close();

                if (rows.length > 0) {
                    reject(false);
                }
                else {
                    resolve(true);
                }
            });
        });
    }

    updateUserReputation(originalUser, reputation) {
        const userID = originalUser.id;
        const userName = originalUser.first_name;
        const database = this.openDatabase();

        database.serialize(() => {
            const createOrUpdate = `INSERT INTO user_reputation (
                    telegram_id,
                    telegram_name,
                    reputation
                )
                values (
                    ${userID},
                    "${userName}",
                    ${reputation}
                )
                ON CONFLICT(telegram_id) DO UPDATE SET reputation = reputation + ${reputation};
            `;
            // const getUser = `SELECT reputation FROM user_reputation
            //     WHERE telegram_id = ${userID};
            // `;

            database.exec(createOrUpdate);

            // , () => {
            //     database.get(getUser, (err, row) => {
            //         console.log(row);
            //         const updateReputation = `UPDATE user_reputation
            //             SET reputation = ${row.reputation + reputation}
            //             WHERE telegram_id = ${userID};
            //         `;
            //         database.run(updateReputation);
            //     })
            // }
        });
        database.close();
    }

    lockUser(originalUser, answeringUser) {
        const originalUserID = originalUser.id;
        const answeringUserID = answeringUser.id;
        const timeStamp = Date.now();
        const database = this.openDatabase();
        
        database.serialize(() => {
            const lockUserStatement = `INSERT INTO user_reputation_voters (
                telegram_id_voter,
                telegram_id_elect,
                timestamp
            )
            values (
                ${answeringUserID},
                ${originalUserID},
                ${timeStamp}
            );
        `;
            
            database.run(lockUserStatement);
        });
        database.close();
    }

    increaseReputation(originalUser, answeringUser) {
        const isChangeAllowed = this.isChangeAllowed(originalUser, answeringUser);

        isChangeAllowed.then(() => {
            this.updateUserReputation(originalUser, 1);
            this.lockUser(originalUser, answeringUser);
        })
        .catch(() => {});
    }

    decreaseRepuation(originalUser, answeringUser) {
        const isChangeAllowed = this.isChangeAllowed(originalUser, answeringUser);

        isChangeAllowed.then(() => {
            this.updateUserReputation(originalUser, -1);
            this.lockUser(originalUser, answeringUser);
        })
        .catch(() => {});
    }

    getUserReputation(userID) {
        return new Promise((resolve, reject) => {
            const database = this.openDatabase();

            const getReputationStatement = `SELECT reputation FROM user_reputation
                WHERE telegram_id = ${userID};
            `;
            database.get(getReputationStatement, (err, row) => {
                database.close();
                let reputation = 0;

                if (row !== undefined) {
                    reputation = row.reputation;
                }

                resolve(reputation);
            });
        });
    }
}