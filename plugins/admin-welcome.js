import { isAdmin } from '../lib/utils.js';

export default {
    commands: ['welcome'],

    async execute(ctx) {
        console.log('[DEBUG] admin-welcome: Inicio del comando');
        console.log('[DEBUG] admin-welcome: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-welcome: sender:', ctx.sender);
        console.log('[DEBUG] admin-welcome: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-welcome: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-welcome: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-welcome: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            console.log('[DEBUG] admin-welcome: Argumentos inválidos:', ctx.args);
            return await ctx.reply('ꕤ Uso: */welcome* `<on/off>`');
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            console.log('[DEBUG] admin-welcome: Cambiando welcome a:', enable);

            const groupData = ctx.dbService.getGroup(ctx.chatId);
            console.log('[DEBUG] admin-welcome: groupData antes:', JSON.stringify(groupData.settings));

            groupData.settings.welcome = enable;
            ctx.dbService.markDirty();

            console.log('[DEBUG] admin-welcome: groupData después:', JSON.stringify(groupData.settings));
            console.log('[DEBUG] admin-welcome: Cambio exitoso');

            await ctx.reply(`ꕥ Bienvenidas ${enable ? 'activadas' : 'desactivadas'}.`);
        } catch (error) {
            console.error('[DEBUG] admin-welcome: Error:', error);
            await ctx.reply('ꕤ Error al cambiar la configuración de bienvenidas.');
        }
    }
};
