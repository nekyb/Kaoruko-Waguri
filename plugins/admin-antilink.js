import { isAdmin, isBotAdmin, styleText } from '../lib/utils.js';

// Cache para saber si el bot es admin en cada grupo (evita llamadas repetidas)
const botAdminCache = new Map();

export default {
    commands: ['antilink'],

    // Fast link detection and deletion
    async before(ctx) {
        const { isGroup, body, sender, chatId, dbService, bot, msg } = ctx;

        // Fast fails (sin llamadas a API)
        if (!isGroup || !body) return;

        // Check local setting
        const groupSettings = dbService.getGroup(chatId)?.settings;
        if (!groupSettings?.antilink) return;

        // Fast regex check
        const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[a-zA-Z0-9]+)|(wa\.me\/[0-9]+)/i;
        if (!linkRegex.test(body)) return;

        // Check bot admin status (con cache)
        let botIsAdmin = botAdminCache.get(chatId);
        if (botIsAdmin === undefined) {
            botIsAdmin = await isBotAdmin(bot, chatId);
            botAdminCache.set(chatId, botIsAdmin);
            // Expira cache en 5 minutos
            setTimeout(() => botAdminCache.delete(chatId), 5 * 60 * 1000);
        }

        if (!botIsAdmin) return;

        // ELIMINAR PRIMERO, luego avisar
        try {
            await bot.sock.sendMessage(chatId, { delete: msg.key });
        } catch (e) { }

        // Obtener número limpio para la mención
        const userNumber = sender.split('@')[0].split(':')[0];
        const mentionJid = `${userNumber}@s.whatsapp.net`;

        await ctx.reply(styleText(`🚫 @${userNumber} los enlaces no están permitidos.`), {
            mentions: [mentionJid]
        });
    },

    async execute(ctx) {
        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        const admin = await isAdmin(ctx.bot, ctx.chatId, ctx.senderLid || ctx.sender);
        if (!admin) {
            return await ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            return await ctx.reply(styleText('ꕤ Uso: */antilink* `<on/off>`'));
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            const groupData = ctx.dbService.getGroup(ctx.chatId);
            groupData.settings.antilink = enable;
            ctx.dbService.markDirty();

            // Limpiar cache cuando cambia la config
            botAdminCache.delete(ctx.chatId);

            await ctx.reply(styleText(`ꕥ Antilink ${enable ? 'activado ✅' : 'desactivado ❌'}.`));
        } catch (error) {
            await ctx.reply(styleText('ꕤ Error al cambiar la configuración.'));
        }
    }
};
