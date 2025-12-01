import { isAdmin, isBotAdmin } from '../lib/utils.js';

export default {
    commands: ['antilink'],

    // Logic to detect and delete links
    async before(ctx) {
        const { isGroup, body, sender, chatId, dbService, bot } = ctx;

        if (!isGroup || !body) return;

        // Check if antilink is enabled
        const groupSettings = dbService.getGroup(chatId)?.settings;
        if (!groupSettings?.antilink) return;

        // Check for WhatsApp group links
        const linkRegex = /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}/i;
        const isLink = linkRegex.test(body);

        if (!isLink) return;

        console.log(`[ANTILINK] Link detectado en ${chatId} de ${sender}`);

        // Check if sender is admin (admins bypass)
        const senderIsAdmin = await isAdmin(bot, chatId, sender);
        if (senderIsAdmin) {
            console.log(`[ANTILINK] Sender es admin, ignorando.`);
            return;
        }

        // Check if bot is admin (needed to delete)
        const botIsAdmin = await isBotAdmin(bot, chatId);
        if (!botIsAdmin) {
            console.log(`[ANTILINK] Bot no es admin, no puedo eliminar.`);
            return;
        }

        console.log(`[ANTILINK] Eliminando mensaje...`);

        // Delete message
        try {
            // bot is instance of Bot class from @imjxsx/wapi
            // bot.ws is the underlying socket
            await bot.ws.sendMessage(chatId, { delete: ctx.msg.key });

            // Optional: Kick user
            // await bot.ws.groupParticipantsUpdate(chatId, [sender], 'remove');

            await ctx.reply(`🚫 *Enlace detectado*\n@${sender.split('@')[0]}, los enlaces no están permitidos.`, { mentions: [sender] });
        } catch (error) {
            console.error('[ANTILINK] Error eliminando mensaje:', error);
        }
    },

    async execute(ctx) {
        console.log('[DEBUG] admin-antilink: Inicio del comando');

        if (!ctx.isGroup) {
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        if (!admin) {
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            return await ctx.reply('ꕤ Uso: */antilink* `<on/off>`');
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            const groupData = ctx.dbService.getGroup(ctx.chatId);

            groupData.settings.antilink = enable;
            ctx.dbService.markDirty();

            await ctx.reply(`ꕥ Antilink ${enable ? 'activado' : 'desactivado'}.`);
        } catch (error) {
            console.error('[DEBUG] admin-antilink: Error:', error);
            await ctx.reply('ꕤ Error al cambiar la configuración de antilink.');
        }
    }
};
