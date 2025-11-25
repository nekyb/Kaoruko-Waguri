import { isAdmin, isBotAdmin, extractMentions } from '../lib/utils.js';

export default {
    commands: ['ban'],

    async execute(ctx) {
        console.log('[DEBUG] admin-ban: Inicio del comando');
        console.log('[DEBUG] admin-ban: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-ban: sender:', ctx.sender);
        console.log('[DEBUG] admin-ban: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-ban: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-ban: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-ban: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        console.log('[DEBUG] admin-ban: isBotAdmin resultado:', botAdmin);

        if (!botAdmin) {
            console.log('[DEBUG] admin-ban: Bot no es admin');
            return await ctx.reply('ꕤ Necesito ser administrador para banear usuarios.');
        }

        const mentions = extractMentions(ctx);
        console.log('[DEBUG] admin-ban: Menciones extraídas:', mentions);

        if (mentions.length === 0) {
            console.log('[DEBUG] admin-ban: No se encontraron menciones');
            return await ctx.reply('ꕤ Debes mencionar al usuario a banear.');
        }

        const user = mentions[0];
        console.log('[DEBUG] admin-ban: Usuario a banear:', user);

        try {
            const groupData = ctx.dbService.getGroup(ctx.chatId);

            if (!groupData.banned) {
                groupData.banned = [];
            }

            console.log('[DEBUG] admin-ban: Lista de baneados actual:', groupData.banned);

            if (groupData.banned.includes(user)) {
                console.log('[DEBUG] admin-ban: Usuario ya está baneado');
                return await ctx.reply('ꕤ Ese usuario ya está baneado.');
            }

            groupData.banned.push(user);
            ctx.dbService.markDirty();
            console.log('[DEBUG] admin-ban: Usuario agregado a lista de baneados');

            await ctx.bot.sock.groupParticipantsUpdate(ctx.chatId, [user], 'remove');
            console.log('[DEBUG] admin-ban: Usuario removido del grupo exitosamente');

            await ctx.reply(`ꕤ @${user.split('@')[0]} ha sido baneado del grupo.`, {
                mentions: [user]
            });
        } catch (error) {
            console.error('[DEBUG] admin-ban: Error:', error);
            await ctx.reply('ꕤ Error al banear al usuario: ' + error.message);
        }
    }
};
