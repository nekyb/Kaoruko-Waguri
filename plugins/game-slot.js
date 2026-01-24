
import { formatNumber, styleText } from '../lib/utils.js';

export default {
    commands: ['slot', 'slots', 'tragaperras'],
    category: 'economy',

    async execute(ctx) {
        const group = await ctx.dbService.getGroup(ctx.chatId);
        if (ctx.isGroup && !group.settings.economy) {
            return await ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }
        const user = await ctx.dbService.getUser(ctx.sender);
        const userData = user.economy || {};
        let amount = parseInt(ctx.args[0]);
        if (!amount || isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕤ Uso: #slot <cantidad>\n> Ejemplo: * #slot* 100'));
        }
        if (amount > userData.coins) {
            return await ctx.reply(styleText('ꕤ No tienes suficientes coins.'));
        }

        const emojis = ['🍇', '🍉', '🍊', '🍋', '🍌', '🍍', '🍒', '🍓'];
        const a = emojis[Math.floor(Math.random() * emojis.length)];
        const b = emojis[Math.floor(Math.random() * emojis.length)];
        const c = emojis[Math.floor(Math.random() * emojis.length)];
        let result = '';
        let winAmount = 0;
        let newBalance = userData.coins - amount;

        if (a === b && b === c) {
            winAmount = amount * 5;
            newBalance += winAmount;
            result = `ꕥ *JACKPOT!!!* \n\n> ➵Ganaste *${formatNumber(winAmount)}* coins (x5)`;
        } else if (a === b || b === c || a === c) {
            winAmount = Math.floor(amount * 1.5);
            newBalance += winAmount;
            result = `ꕥ *¡Ganaste!* \n\n> ✐ Ganaste *${formatNumber(winAmount)}* coins (x1.5)`;
        } else {
            result = `ꕤ *Perdiste* \n\n> ✐ Perdiste *${formatNumber(amount)}* coins`;
        }

        ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': newBalance
        });
        await ctx.dbService.save();

        await ctx.reply(styleText(
            `ꕥ *SLOTS* 🎰\n\n` +
            `❐ | ${a} | ${b} | ${c} | 👈\n\n` +
            `${result}\n` +
            `> Nuevo balance: ${formatNumber(newBalance)} coins`
        ));
    }
};
