import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['qr'],

    async execute(ctx) {
        if (!ctx.args[0]) {
            return await ctx.reply('ꕤ Debes proporcionar un código.\nUso: #qr <código>');
        }

        await ctx.reply('ꕤ Iniciando sub-bot, por favor espera...');

        const result = await jadibotManager.startSubbot(ctx.args[0], ctx.chatId, ctx.bot);

        if (!result.success) {
            await ctx.reply(result.message);
        }
    }
};
