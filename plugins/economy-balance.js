
import { formatNumber, styleText } from '../lib/utils.js';

export default {
    commands: ['balance', 'bal', 'saldo'],

    async execute(ctx) {
        const userData = ctx.dbService.getUser(ctx.sender);
        const economy = userData.economy || {};

        await ctx.reply(styleText(
            `ꕥ *Balance de Usuario*\n\n` +
            `⟡ Billetera: *¥${formatNumber(economy.coins || 0)}* coins\n` +
            `⟡ Banco: *¥${formatNumber(economy.bank || 0)}* coins\n` +
            `⟡ Total: *¥${formatNumber((economy.coins || 0) + (economy.bank || 0))}* coins`
        ));
    }
};
