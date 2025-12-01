export default {
    commands: ['wvideo', 'waifuvideo'],
    tags: ['gacha'],
    help: ['wvideo <nombre>'],

    async execute(ctx) {
        const { args, gachaService, bot, chatId } = ctx;

        if (args.length === 0) {
            return await ctx.reply('ꕤ Debes especificar el nombre del personaje.\nUso: #wvideo <personaje>');
        }

        const query = args.join(' ').toLowerCase();
        const character = gachaService.characters.find(c =>
            c.name.toLowerCase().includes(query) ||
            (c.alias && c.alias.toLowerCase().includes(query))
        );

        if (!character) {
            return await ctx.reply('ꕤ Personaje no encontrado.');
        }

        if (!character.vid || character.vid.length === 0) {
            return await ctx.reply(`ꕤ ${character.name} no tiene videos registrados.`)
        }
        const randomVid = character.vid[Math.floor(Math.random() * character.vid.length)];

        await ctx.reply('ꕤ Enviando video...');

        try {
            await bot.sock.sendMessage(chatId, {
                video: { url: randomVid },
                caption: `🎥 *${character.name}*\n${character.source || ''}`,
                gifPlayback: false
            }, { quoted: ctx.msg });
        } catch (error) {
            console.error('Error enviando video:', error);
            await ctx.reply('ꕤ Error al enviar el video. Puede que el enlace esté caído.')
        }
    }
};
