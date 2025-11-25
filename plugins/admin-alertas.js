import { isAdmin } from '../lib/utils.js';

export default {
    commands: ['alertas'],

    async execute(ctx) {
        console.log('[DEBUG] admin-alertas: Inicio del comando');
        console.log('[DEBUG] admin-alertas: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-alertas: sender:', ctx.sender);
        console.log('[DEBUG] admin-alertas: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-alertas: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-alertas: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-alertas: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            console.log('[DEBUG] admin-alertas: Argumentos inválidos:', ctx.args);
            return await ctx.reply('ꕤ Uso: */alertas* `<on/off>`');
        }

        try {
            const enable = ctx.args[0].toLowerCase() === 'on';
            console.log('[DEBUG] admin-alertas: Cambiando alertas a:', enable);

            const groupData = ctx.dbService.getGroup(ctx.chatId);
            console.log('[DEBUG] admin-alertas: groupData antes:', JSON.stringify(groupData.settings));

            groupData.settings.alerts = enable;
            ctx.dbService.markDirty();

            console.log('[DEBUG] admin-alertas: groupData después:', JSON.stringify(groupData.settings));
            console.log('[DEBUG] admin-alertas: Cambio exitoso');

            await ctx.reply(`ꕥ Sistema de alertas ${enable ? 'activado' : 'desactivado'}.`);
        } catch (error) {
            console.error('[DEBUG] admin-alertas: Error:', error);
            await ctx.reply('ꕤ Error al cambiar la configuración de alertas.');
        }
    }
};
