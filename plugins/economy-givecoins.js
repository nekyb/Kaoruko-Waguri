import { extractMentions, formatNumber } from '../lib/utils.js';

export default {
    commands: ['givecoins', 'darcoins'],

    async execute(ctx) {
        if (ctx.args.length < 2) {
            return await ctx.reply('ꕤ Uso: #givecoins <@usuario> <cantidad>');
        }

        const mentions = extractMentions(ctx);
        if (mentions.length === 0) {
            return await ctx.reply('ꕤ Debes mencionar a un usuario.');
        }

        const target = mentions[0];
        const amount = parseInt(ctx.args[1]);

        if (isNaN(amount) || amount <= 0) {
            return await ctx.reply('ꕤ La cantidad debe ser un número mayor a 0.');
        }

        const senderData = ctx.dbService.getUser(ctx.sender);
        const senderEconomy = senderData.economy || {};

        if ((senderEconomy.coins || 0) < amount) {
            return await ctx.reply('ꕤ No tienes suficientes coins.');
        }

        const targetData = ctx.dbService.getUser(target);
        const targetEconomy = targetData.economy || {};

        // Update sender
        ctx.dbService.updateUser(ctx.sender, {
            'economy.coins': (senderEconomy.coins || 0) - amount
        });

        // Update target
        ctx.dbService.updateUser(target, {
            'economy.coins': (targetEconomy.coins || 0) + amount
        });

        // Get the real phone number from group metadata if in a group
        let displayNumber = target.split('@')[0].split(':')[0];

        if (ctx.isGroup) {
            try {
                const groupMetadata = await ctx.bot.groupMetadata(ctx.chatId);
                const participant = groupMetadata.participants.find(p => {
                    const participantId = p.id.split(':')[0].split('@')[0];
                    const targetId = target.split(':')[0].split('@')[0];
                    return participantId === targetId;
                });

                // Use the jid (phone number) if available
                if (participant && participant.jid) {
                    displayNumber = participant.jid.split('@')[0].split(':')[0];
                }
            } catch (error) {
                console.error('[DEBUG] Error getting group metadata for givecoins:', error);
            }
        }

        await ctx.reply(`ꕥ Transferiste ${formatNumber(amount)} coins a @${displayNumber}`, {
            mentions: [target]
        });
    }
};