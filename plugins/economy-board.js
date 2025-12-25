import { formatNumber, styleText } from '../lib/utils.js';

export default {
    commands: ['board', 'leaderboard', 'top', 'baltop'],

    async execute(ctx) {
        const allUsers = ctx.dbService.users.find({});
        const users = allUsers
            .map(data => ({
                id: data.id,
                name: data.name || 'Usuario',
                total: (data.economy?.coins || 0) + (data.economy?.bank || 0),
                coins: data.economy?.coins || 0,
                bank: data.economy?.bank || 0
            }))
            .filter(u => u.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (users.length === 0) {
            return ctx.reply('ꕤ No hay usuarios con coins aún.');
        }

        // Fetch group metadata to find LIDs
        let participants = [];
        if (ctx.isGroup) {
            try {
                const metadata = await ctx.bot.groupMetadata(ctx.chatId);
                participants = metadata.participants;
            } catch (err) {
                console.error('Error fetching group metadata:', err);
            }
        }

        let message = 'ꕥ Ranking de Economía\n\n';
        message += '➭ Top 10 Ricachones\n\n';

        const mentions = [];
        users.forEach((user, i) => {
            const medal = i === 0 ? '❶' : i === 1 ? '❷' : i === 2 ? '❸' : `${i + 1}.`;

            // Extract phone number from stored ID (which is phone@s.whatsapp.net)
            const userPhone = user.id.split('@')[0];

            // Find participant with this phone number to get their LID/JID
            const participant = participants.find(p => p.id.includes(userPhone));
            const mentionJid = participant ? participant.id : user.id;

            // Use the ID from the JID for display (without domain)
            const displayId = mentionJid.split('@')[0];

            mentions.push(mentionJid);

            message += `${medal} @${displayId}\n`;
            message += `> ⛃ Coins » *¥${formatNumber(user.coins)}*\n`;
            message += `> ❖ Banco » *¥${formatNumber(user.bank)}*\n`;
            message += `> ✧ Total » *¥${formatNumber(user.total)}*\n\n`;
        });

        message += '💫 _Sigue esforzándote!_';

        await ctx.reply(styleText(message), { mentions });
    }
};