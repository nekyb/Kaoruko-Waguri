import { formatNumber } from '../lib/utils.js';

export default {
    commands: ['board', 'leaderboard', 'top', 'baltop'],

    async execute(ctx) {
        // Get all users from LocalDB
        const allUsers = ctx.dbService.users.find({});

        const users = allUsers
            .map(data => ({
                id: data.id,
                name: data.name || 'Usuario',
                total: (data.economy?.coins || 0) + (data.economy?.bank || 0)
            }))
            .filter(u => u.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (users.length === 0) {
            return await ctx.reply('ꕤ No hay usuarios con coins aún.');
        }

        let message = '🌸 *Top 10 Ricachones* 🌸\n';
        message += '━━━━━━━━━━━━━━━━━━━━\n\n';

        const mentions = [];
        users.forEach((user, i) => {
            const medal = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const phoneNumber = user.id.split('@')[0].split(':')[0].replace(/\D/g, '');
            console.log(`[DEBUG] Board - ID: ${user.id}, Phone: ${phoneNumber}`);
            mentions.push(user.id);

            message += `${medal} @${phoneNumber}\n`;
            message += `   ✨ ${formatNumber(user.total)} coins\n`;
            if (i < 3) message += '\n'; // Add extra space for top 3
        });

        message += '\n━━━━━━━━━━━━━━━━━━━━';
        message += '\n💫 _Sigue esforzándote!_';

        await ctx.reply(message, { mentions });
    }
};