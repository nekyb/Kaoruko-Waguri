import { formatNumber, styleText } from '../lib/utils.js';

export default {
    commands: ['profile', 'perfil', 'setbirth', 'setgen'],

    async execute(ctx) {
        const { command, args, sender, dbService, bot, chatId } = ctx;
        const userData = dbService.getUser(sender);
        if (!userData.profile) userData.profile = {};
        if (command === 'setbirth') {
            const birth = args.join(' ');
            const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
            if (!dateRegex.test(birth)) { return await ctx.reply(styleText('ꕤ Formato inválido. Usa DD/MM/YYYY (Ej: 01/01/2000)')) }
            userData.profile.birthday = birth;
            dbService.markDirty();
            return await ctx.reply(styleText(`ꕥ Cumpleaños establecido a: ${birth}`))
        }
        if (command === 'setgen') {
            const gen = args[0]?.toLowerCase();
            if (!['m', 'f'].includes(gen)) { return await ctx.reply(styleText('ꕤ Género inválido. Usa *m* (Masculino) o *f* (Femenino).')) }
            userData.profile.gender = gen === 'm' ? 'Masculino' : 'Femenino';
            dbService.markDirty();
            return await ctx.reply(styleText(`ꕥ Género establecido a: ${userData.profile.gender}`))
        }
        let pfpUrl;
        try { pfpUrl = await bot.sock.profilePictureUrl(sender, 'image') } catch (e) { pfpUrl = 'https://i.imgur.com/K2T39Xw.png' }
        const allUsers = dbService.users.find({});
        const sortedUsers = allUsers.sort((a, b) => {
            const totalA = (a.economy?.coins || 0) + (a.economy?.bank || 0);
            const totalB = (b.economy?.coins || 0) + (b.economy?.bank || 0);
            return totalB - totalA;
        })
        const rank = sortedUsers.findIndex(u => u.id === sender) + 1;
        const harem = userData.gacha?.characters || [];
        const totalValue = harem.reduce((acc, char) => acc + (parseInt(char.value) || 0), 0);
        const xp = userData.xp || 0;
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;
        const xpForNextLevel = Math.pow(level, 2) * 100;
        const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
        const xpProgress = xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const percent = Math.floor((xpProgress / xpNeeded) * 100) || 0;
        const totalCommands = userData.stats?.commands || 0;
        const birth = userData.profile.birthday || 'No establecido';
        const gender = userData.profile.gender || 'No establecido';
        const name = userData.name || sender.split('@')[0];
        let message = `「✿」 Perfil ◢ ${name} ◤\n\n`;
        message += `♛ Cumpleaños » ${birth} | ${birth === 'No establecido' ? '(/setbirth)' : ''}\n`;
        message += `♛ Género » ${gender} | ${gender === 'No establecido' ? '(/setgen)' : ''}\n\n`;
        message += `➨ Progreso » ${Math.floor(xp)} => ${xpForNextLevel} (${percent}%)\n`;
        message += `# Puesto » #${rank > 0 ? rank : '?'}\n\n`;
        message += `ꕥ Harem » ${harem.length}\n`;
        message += `✧ Valor total » ${formatNumber(totalValue)}\n`;
        message += `⛁ Coins totales » ¥${formatNumber((userData.economy?.coins || 0) + (userData.economy?.bank || 0))} Coins\n`;
        message += `❒ Comandos totales » ${totalCommands}`;
        await bot.sock.sendMessage(chatId, {
            image: { url: pfpUrl },
            caption: styleText(message),
            mentions: [sender]
        });
    }
};
