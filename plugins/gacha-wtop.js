export default {
    commands: ['wtop', 'topwaifus'],

    async execute(ctx) {
        const { bot, msg, chatId } = ctx;
        const sock = bot.sock || bot;
        const waifus = global.gachaService.characters
            .filter(c => c.voteCount && c.voteCount > 0)
            .sort((a, b) => b.voteCount - a.voteCount)
            .slice(0, 10);

        if (waifus.length === 0) {
            return await sock.sendMessage(chatId, {
                text: 'ꕤ No hay votos registrados aún.'
            });
        }

        let message = 'ꕥ *Top 10 Waifus*\n\n';

        waifus.forEach((waifu, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            message += `${medal} ${waifu.name}: ❤️ ${waifu.voteCount} votos\n`;
        });

        await sock.sendMessage(chatId, { text: message });
    }
};
