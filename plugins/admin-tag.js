import { isAdmin, styleText } from '../lib/utils.js';

export default {
    commands: ['tag'],

    async execute(ctx) {
        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        const admin = await isAdmin(ctx.bot, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) {
            return await ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        const text = ctx.args.join(' ') || 'Atención a todos!';

        try {
            const groupMetadata = await ctx.bot.groupMetadata(ctx.chatId);
            const participants = groupMetadata.participants.map(p => p.id);

            await ctx.reply(styleText(`ꕥ *Anuncio*\n\n${text}`), {
                mentions: participants
            });
        } catch (error) {
            console.error('[AdminTag] Error:', error);
            await ctx.reply(styleText('ꕤ Error al enviar el anuncio: ' + error.message));
        }
    }
};
