import { styleText } from '../lib/utils.js';

export default {
    commands: ['economy'],

    async execute(ctx) {
        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        if (!ctx.isGroupAdmin) {
            return await ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        if (!ctx.args[0] || !['on', 'off'].includes(ctx.args[0].toLowerCase())) {
            return await ctx.reply(styleText('ꕤ Uso: #economy <on/off>'));
        }

        const enable = ctx.args[0].toLowerCase() === 'on';
        const groupData = ctx.dbService.getGroup(ctx.chatId);
        groupData.settings.economy = enable;
        ctx.dbService.markDirty();

        await ctx.reply(styleText(`ꕥ Sistema de economía ${enable ? 'activado' : 'desactivado'}.`));
    }
};
