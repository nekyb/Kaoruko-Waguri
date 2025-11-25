import { isAdmin } from '../lib/utils.js';

export default {
    commands: ['antilink'],

    async execute(ctx) {
        console.log('[DEBUG] admin-antilink: Inicio del comando');
        console.log('[DEBUG] admin-antilink: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-antilink: sender:', ctx.sender);
        console.log('[DEBUG] admin-antilink: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-antilink: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-antilink: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-antilink: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            console.log('[DEBUG] admin-antilink: Argumentos inválidos:', ctx.args);
            return await ctx.reply('ꕤ Uso: */antilink* `<on/off>`');
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            console.log('[DEBUG] admin-antilink: Cambiando antilink a:', enable);

            const groupData = ctx.dbService.getGroup(ctx.chatId);
            console.log('[DEBUG] admin-antilink: groupData antes:', JSON.stringify(groupData.settings));

            groupData.settings.antilink = enable;
            ctx.dbService.markDirty();

            console.log('[DEBUG] admin-antilink: groupData después:', JSON.stringify(groupData.settings));
            console.log('[DEBUG] admin-antilink: Cambio exitoso');

            await ctx.reply(`ꕥ Antilink ${enable ? 'activado' : 'desactivado'}.`);
        } catch (error) {
            console.error('[DEBUG] admin-antilink: Error:', error);
            await ctx.reply('ꕤ Error al cambiar la configuración de antilink.');
        }
    }
};
