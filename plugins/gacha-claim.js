import { getCooldown, formatTime } from '../lib/utils.js';

export default {
    commands: ['claim', 'c'],

    async execute(ctx) {
        const COOLDOWN = 30 * 60 * 1000;
        const userData = ctx.userData;
        const gachaService = ctx.gachaService;
        const cooldown = getCooldown(userData.gacha.lastClaim, COOLDOWN);

        if (cooldown > 0) {
            return await ctx.reply(
                `ꕤ Ya reclamaste un personaje recientemente.\nVuelve en: ${formatTime(cooldown)}`
            );
        }

        const rolledId = userData.gacha.rolled;
        if (!rolledId) {
            return await ctx.reply('ꕤ Primero debes girar la ruleta con #rollwaifu (#rw) para obtener un personaje.');
        }

        const character = gachaService.getById(rolledId);
        if (!character) {
            delete userData.gacha.rolled;
            return await ctx.reply('ꕤ El personaje que giraste ya no está disponible.');
        }

        delete userData.gacha.rolled;
        userData.gacha.lastClaim = Date.now();
        if (!userData.gacha.characters) {
            userData.gacha.characters = [];
        }

        userData.gacha.characters.push({
            id: character.id,
            name: character.name,
            source: character.source,
            value: character.value,
            img: character.img,
            claimedAt: Date.now()
        });

        try {
            gachaService.claim(character.id, ctx.sender);
        } catch (error) {
            console.error('Error reclamando personaje en GachaService:', error.message);
        }

        ctx.dbService.markDirty();

        const message = `ꕥ Has reclamado a *${character.name}* con éxito.`;

        if (character.img && character.img.length > 0) {
            try {
                await ctx.replyWithImage(character.img[0], { caption: message });
            } catch {
                await ctx.reply(message);
            }
        } else {
            await ctx.reply(message);
        }
    }
};
