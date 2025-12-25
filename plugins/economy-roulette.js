import { formatNumber, styleText } from '../lib/utils.js';

export default {
    commands: ['roulette', 'rt'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply(styleText('ꕤ El sistema de economía está desactivado en este grupo.'));
        }

        const userData = ctx.userData.economy;

        if (!ctx.args[0] || !ctx.args[1]) {
            return await ctx.reply(styleText('ꕤ Uso incorrecto.\n> Uso: *#roulette* `<red/black>` `<cantidad>`'));
        }

        const choice = ctx.args[0].toLowerCase();
        const amount = parseInt(ctx.args[1]);

        if (!['red', 'black'].includes(choice)) {
            return await ctx.reply(styleText('ꕤ Debes elegir: red o black'));
        }

        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply(styleText('ꕤ Cantidad inválida.'));
        }

        if (amount > userData.coins) {
            return await ctx.reply(styleText('ꕤ No tienes suficientes coins.'));
        }

        const result = Math.random() < 0.5 ? 'red' : 'black';
        const won = result === choice;

        if (won) {
            const winAmount = Math.floor(amount * 1.8);
            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': userData.coins + winAmount
            });
            await ctx.dbService.save();
            await ctx.reply(styleText(
                `ꕥ *¡Ganaste!*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Ganancia: +${formatNumber(winAmount)} coins\n` +
                `Balance: ${formatNumber(userData.coins + winAmount)} coins`
            ));
        } else {
            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': userData.coins - amount
            });
            await ctx.dbService.save();
            await ctx.reply(styleText(
                `ꕥ *Perdiste*\n\n` +
                `Salió: ${result} ${result === 'red' ? '🔴' : '⚫'}\n` +
                `Pérdida: -${formatNumber(amount)} coins\n` +
                `Balance: ${formatNumber(userData.coins - amount)} coins`
            ));
        }
    }
};
