import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['listjadibot', 'listbots'],

    async execute(ctx) {
        const subbots = jadibotManager.getSubbots();

        if (subbots.length === 0) {
            return await ctx.reply('ꕤ No hay sub-bots activos actualmente.');
        }

        let message = `ꕤ *Sub-Bots Activos* (${subbots.length})\n\n`;
        subbots.forEach((bot, i) => {
            message += `${i + 1}. @${bot.userId.split('@')[0]}\n`;
        });

        await ctx.reply(message, {
            mentions: subbots.map(b => b.userId)
        });
    }
};
