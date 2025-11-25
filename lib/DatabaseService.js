import { LocalDB } from '@imjxsx/localdb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
    constructor() {
        this.localDB = null;
        this.db = null;
        this.users = null;
        this.groups = null;
        this.isDirty = false;
        this.saveInterval = null;
    }

    async load() {
        try {
            const dbPath = path.join(__dirname, '..', 'database');
            this.localDB = new LocalDB(dbPath).db('bot');
            await this.localDB.load();
            this.users = this.localDB.collection('users');
            this.groups = this.localDB.collection('groups');
            this.db = this.localDB;
            console.log('𖤐 Base de datos cargada');
            this.startAutoSave();
            return this.db;
        } catch (error) {
            console.error('𖤐 Error cargando base de datos:', error.message);
            throw error;
        }
    }

    async save() {
        try {
            await this.db.save();
            this.isDirty = false;
        } catch (error) {
            console.error('𖤐 Error guardando base de datos:', error.message);
        }
    }

    saveSync() {
        console.log('𖤐 Guardado síncrono no soportado por LocalDB (se confía en auto-save)');
    }

    startAutoSave() {
        this.saveInterval = setInterval(async () => {
            if (this.isDirty) {
                await this.save();
            }
        }, 10000);
    }

    markDirty() {
        this.isDirty = true;
    }

    getUser(userId) {
        let user = this.users.findOne({ id: userId });

        if (!user) {
            user = {
                id: userId,
                economy: {
                    coins: 0,
                    bank: 0,
                    lastDaily: 0,
                    lastWork: 0,
                    lastCrime: 0,
                    lastSlut: 0
                },
                gacha: {
                    characters: [],
                    lastClaim: 0,
                    votes: {}
                },
                stats: {
                    messages: 0,
                    commands: 0
                },
                createdAt: Date.now(),
                monedas: 0,
                antirobo: 0,
                desbloqueo: 0
            };
            this.users.insertOne(user);
            this.markDirty();
        }
        return user;
    }

    updateUser(userId, updates) {
        // console.log(`🔧 Updating user ${userId}:`, updates);

        // Get current user data (ensures user exists)
        const user = this.getUser(userId);

        // Apply updates manually to handle dot notation (e.g. 'economy.coins')
        for (const [key, value] of Object.entries(updates)) {
            if (key.includes('.')) {
                const parts = key.split('.');
                let current = user;
                for (let i = 0; i < parts.length - 1; i++) {
                    // Create nested object if it doesn't exist
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            } else {
                user[key] = value;
            }
        }

        // Save the updated user object
        // We use $set with the entire user object to ensure all nested changes are persisted
        // This works because we've already modified the 'user' object reference which came from the DB
        const result = this.users.updateOne(
            { id: userId },
            { $set: user }
        );



        if (result) {
            this.markDirty();
            console.log(`✅ User ${userId} updated. New Balance: ${user.economy?.coins}`);
        } else {
            console.log(`⚠️ Failed to update user ${userId}`);
        }
        return result;
    }

    getGroup(groupId) {
        let group = this.groups.findOne({ id: groupId });

        if (!group) {
            group = {
                id: groupId,
                settings: {
                    welcome: false,
                    antilink: false,
                    economy: true,
                    nsfw: false
                },
                alerts: [],
                stats: {
                    messages: 0
                }
            };
            this.groups.insertOne(group);
            this.markDirty();
        }
        return group;
    }

    async gracefulShutdown() {
        console.log('𖤐 Cerrando bot...');
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        await this.save();
        console.log('𖤐 Base de datos guardada');
    }
}

export default DatabaseService;