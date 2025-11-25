
import { formatNumber } from '../lib/utils.js';

export default {
    commands: ['withdraw', 'wd'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
        }

        const userData = ctx.userData.economy;

        if (!ctx.args[0]) {
            return await ctx.reply('ꕤ Debes especificar una cantidad.\nUso: #withdraw <cantidad>');
        }

        const amount = ctx.args[0].toLowerCase() === 'all' ? userData.bank : parseInt(ctx.args[0]);

        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply('ꕤ Cantidad inválida.');
        }

        if (amount > userData.bank) {
            return await ctx.reply('ꕤ No tienes suficientes coins en el banco.');
        }

        ctx.dbService.updateUser(ctx.sender, {
            'economy.bank': userData.bank - amount,
            'economy.coins': userData.coins + amount
        });

        await ctx.reply(
            `ꕥ *Retiro Exitoso*\n\n` +
            `Retiraste: *${formatNumber(amount)}* coins\n` +
            `ꕤ Coins: *${formatNumber(userData.coins)}*\n` +
            `ꕥ Banco: *${formatNumber(userData.bank)}*`
        );
    }
};
