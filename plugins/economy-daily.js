import { formatNumber, getCooldown, formatTime, styleText } from '../lib/utils.js';

export default {
    commands: ['daily', 'diario'],

    async execute(ctx) {
        const userData = ctx.dbService.getUser(ctx.sender);
        const now = Date.now();
        const cooldown = 86400000;
        const lastDaily = userData.economy?.lastDaily || 0;

        if (now - lastDaily < cooldown) {
            const timeLeft = Math.round((cooldown - (now - lastDaily)) / 3600000);
            return await ctx.reply(styleText(`ꕤ Ya reclamaste tu recompensa diaria. Vuelve en *${timeLeft}* horas.`));
        }

        const reward = 1000;
        ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': (userData.economy?.coins || 0) + reward,
            'economy.lastDaily': now
        });
        await ctx.dbService.save();

        await ctx.reply(styleText(`ꕥ Recompensa diaria reclamada, obtuviste *¥${formatNumber(reward)}* coins`));
    }
};