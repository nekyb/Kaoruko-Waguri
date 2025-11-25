import { isAdmin } from '../lib/utils.js';

export default {
    commands: ['tag'],

    async execute(ctx) {
        console.log('[DEBUG] admin-tag: Inicio del comando');
        console.log('[DEBUG] admin-tag: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-tag: sender:', ctx.sender);
        console.log('[DEBUG] admin-tag: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-tag: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        // FIX: Usar ctx.sender en lugar de ctx.from.id para consistencia
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-tag: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-tag: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        const text = ctx.args.join(' ') || 'Atención a todos!';
        console.log('[DEBUG] admin-tag: Texto del anuncio:', text);

        try {
            const groupMetadata = await ctx.bot.sock.groupMetadata(ctx.chatId);
            const participants = groupMetadata.participants.map(p => p.id);

            console.log('[DEBUG] admin-tag: Total de participantes a mencionar:', participants.length);

            await ctx.reply(`ꕥ *Anuncio*\n\n${text}`, {
                mentions: participants
            });

            console.log('[DEBUG] admin-tag: Anuncio enviado exitosamente');
        } catch (error) {
            console.error('[DEBUG] admin-tag: Error:', error);
            await ctx.reply('ꕤ Error al enviar el anuncio: ' + error.message);
        }
    }
};
