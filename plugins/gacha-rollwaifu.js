export default {
    commands: ['rollwaifu', 'rw'],

    async execute(ctx) {
        const gachaService = ctx.gachaService;
        const character = gachaService.getRandom();

        if (!character) {
            return await ctx.reply('ꕤ No hay personajes disponibles.');
        }

        if (!ctx.userData.gacha) ctx.userData.gacha = {};
        ctx.userData.gacha.rolled = character.id;
        ctx.dbService.markDirty();
        const rarity = Math.floor(parseInt(character.value || 0) / 400);
        const stars = '⭐'.repeat(Math.min(rarity, 5)) || '⭐';
        let message = `༺ *${character.name}* ༻\n`;
        message += `✧ ${character.source || 'Desconocido'}\n\n`;
        message += `${stars}\n`;
        message += `✧ Valor: ${character.value}\n`;
        message += `✧ ID: ${character.id}\n\n`;
        message += `> _*༺ Usa #claim para reclamar༺*_`;

        if (character.img && character.img.length > 0) {
            try {
                await ctx.bot.sendMessage(ctx.chatId, {
                    image: { url: character.img[0] },
                    caption: message
                });
            } catch (error) {
                console.error('[DEBUG] Error sending waifu image:', error);
                await ctx.reply(message);
            }
        } else {
            await ctx.reply(message);
        }
    }
};
