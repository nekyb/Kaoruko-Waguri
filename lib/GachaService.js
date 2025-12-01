import { LocalDB } from '@imjxsx/localdb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GachaService {
    constructor() {
        this.localDB = null;
        this.db = null;
        this.charactersCollection = null;
        this.characters = [];
        this.charactersByGender = { male: [], female: [], other: [] };
        this.charactersBySource = {};
        this.isDirty = false;
        this.saveInterval = null;
    }

    async load() {
        try {
            const dbPath = path.join(__dirname, '..', 'database');
            const gachaFilePath = path.join(dbPath, 'gacha.json');

            // Read gacha.json file directly
            const fileContent = fs.readFileSync(gachaFilePath, 'utf8');
            const data = JSON.parse(fileContent);

            // Extract characters array
            this.characters = data.characters || [];
            this.indexCharacters();

            // Initialize LocalDB for saving updates
            this.localDB = new LocalDB(dbPath).db('gacha');
            await this.localDB.load();
            this.charactersCollection = this.localDB.collection('characters');

            // Sync characters from JSON to LocalDB if LocalDB is empty
            const dbCount = this.charactersCollection.find().length;
            if (dbCount === 0) {
                console.log('𖤐 Inicializando base de datos de personajes desde gacha.json...');
                this.charactersCollection.insertMany(this.characters);
                await this.localDB.save();
            } else {
                // If DB exists, load characters from DB to ensure we have ownership data
                // But we also want to keep static data from JSON if possible?
                // For now, let's trust LocalDB as source of truth for ownership, 
                // but we need to merge with JSON for static data updates?
                // The original code loaded from JSON into this.characters.
                // We should probably update this.characters with ownership info from DB.

                const dbCharacters = this.charactersCollection.find();
                // Create a map of DB characters for faster lookup
                const dbCharMap = new Map(dbCharacters.map(c => [c.id, c]));

                // Update in-memory characters with DB data (ownership, votes, etc.)
                this.characters = this.characters.map(char => {
                    const dbChar = dbCharMap.get(char.id);
                    if (dbChar) {
                        return { ...char, ...dbChar };
                    }
                    return char;
                });
            }

            console.log(`𖤐 Cargados ${this.characters.length} personajes en memoria`);
            this.startAutoSave();
        } catch (error) {
            console.error('𖤐 Error cargando personajes:', error.message);
            this.characters = [];
        }
    }

    indexCharacters() {
        this.charactersByGender = { male: [], female: [], other: [] };
        this.charactersBySource = {};

        for (const char of this.characters) {
            const gender = char.gender?.toLowerCase() || 'other';
            if (this.charactersByGender[gender]) {
                this.charactersByGender[gender].push(char);
            }

            const source = char.source || 'Unknown';
            if (!this.charactersBySource[source]) {
                this.charactersBySource[source] = [];
            }
            this.charactersBySource[source].push(char);
        }
    }

    getRandom() {
        if (this.characters.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.characters.length);
        return this.characters[randomIndex];
    }

    getById(id) {
        return this.characters.find(c => c.id === id);
    }

    getByGender(gender) {
        return this.charactersByGender[gender?.toLowerCase()] || [];
    }

    getBySource(source) {
        return this.charactersBySource[source] || [];
    }

    claim(userId, characterId) {
        const character = this.getById(characterId);
        if (!character) return { success: false, message: 'Personaje no encontrado' };

        if (character.owner) {
            return { success: false, message: 'Este personaje ya tiene dueño' };
        }

        // Update in collection
        this.charactersCollection.updateOne(
            { id: characterId },
            { $set: { owner: userId, claimedAt: Date.now() } }
        );

        // Update in memory
        character.owner = userId;
        character.claimedAt = Date.now();
        this.markDirty();

        return { success: true, character };
    }

    transfer(fromUserId, toUserId, characterId) {
        const character = this.getById(characterId);
        if (!character) return { success: false, message: 'Personaje no encontrado' };

        if (character.owner !== fromUserId) {
            return { success: false, message: 'No eres el dueño de este personaje' };
        }

        // Update in collection
        this.charactersCollection.updateOne(
            { id: characterId },
            { $set: { owner: toUserId, transferredAt: Date.now() } }
        );

        // Update in memory
        character.owner = toUserId;
        character.transferredAt = Date.now();
        this.markDirty();

        return { success: true, character };
    }

    release(userId, characterId) {
        const character = this.getById(characterId);
        if (!character) return { success: false, message: 'Personaje no encontrado' };

        if (character.owner !== userId) {
            return { success: false, message: 'No eres el dueño de este personaje' };
        }

        // Update in collection
        this.charactersCollection.updateOne(
            { id: characterId },
            { $unset: { owner: '', claimedAt: '' } }
        );

        // Update in memory
        delete character.owner;
        delete character.claimedAt;
        this.markDirty();

        return { success: true, character };
    }

    vote(userId, characterId) {
        const character = this.getById(characterId);
        if (!character) return { success: false, message: 'Personaje no encontrado' };

        character.votes = character.votes || {};
        if (character.votes[userId]) {
            return { success: false, message: 'Ya votaste por este personaje' };
        }

        // Update in collection
        const voteCount = (character.voteCount || 0) + 1;
        this.charactersCollection.updateOne(
            { id: characterId },
            {
                $set: {
                    [`votes.${userId}`]: Date.now(),
                    voteCount: voteCount
                }
            }
        );

        // Update in memory
        character.votes[userId] = Date.now();
        character.voteCount = voteCount;
        this.markDirty();

        return { success: true, character };
    }

    getUserCharacters(userId) {
        return this.characters.filter(c => c.owner === userId);
    }

    async save() {
        if (!this.isDirty) return;

        try {
            await this.localDB.save();
            this.isDirty = false;
        } catch (error) {
            console.error('𖤐 Error guardando personajes:', error.message);
        }
    }

    saveSync() {
        console.log('𖤐 Guardado síncrono de personajes no soportado (se confía en auto-save)');
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

    async gracefulShutdown() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        await this.save();
    }
}

export default GachaService;