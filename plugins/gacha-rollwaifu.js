export default {
    commands: ['rollwaifu', 'rw'],

    async execute(ctx) {
        const gachaService = ctx.gachaService;
        const character = gachaService.getRandom();

        if (!character) {
            return await ctx.reply('ꕤ No hay personajes disponibles.');
        }

        const rarity = Math.floor(parseInt(character.value || 0) / 400);
        const stars = '⭐'.repeat(Math.min(rarity, 5)) || '⭐';

        let message = `🌸 *${character.name}* 🌸\n`;
        message += `📺 ${character.source || 'Desconocido'}\n\n`;
        message += `${stars}\n`;
        message += `💎 Valor: ${character.value}\n`;
        message += `🆔 ID: ${character.id}\n\n`;
        message += `💫 Usa #claim para reclamar`;

        if (character.img && character.img.length > 0) {
            try {
                // Send image with caption using @soblend/baileys
                await ctx.bot.sendMessage(ctx.chatId, {
                    image: { url: character.img[0] },
                    caption: message
                });
            } catch (error) {
                console.error('[DEBUG] Error sending waifu image:', error);
                // Fallback to text if image fails
                await ctx.reply(message);
            }
        } else {
            await ctx.reply(message);
        }
    }
};
