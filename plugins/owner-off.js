import { isOwner, styleText } from '../lib/utils.js';

export default {
    commands: ['off', 'apagar', 'shutdown'],

    async execute(ctx) {
        if (!isOwner(ctx.sender, global.botOwner)) {
            return await ctx.reply(styleText('✘ Solo el owner puede usar este comando.'));
        }

        await ctx.reply(styleText('🔴 *Apagando bot...*\n\n> Hasta pronto~'));

        setTimeout(() => {
            console.log('🔴 Bot apagado por comando del owner');
            process.exit(0);
        }, 1500);
    }
};
