export default {
    commands: ['wimage', 'waifuimage'],
    tags: ['gacha'],
    help: ['wimage <nombre>'],

    async execute(ctx) {
        const { args, gachaService } = ctx;

        if (args.length === 0) {
            return await ctx.reply('ꕤ Debes especificar el nombre del personaje.\nUso: #wimage <personaje>');
        }

        const query = args.join(' ').toLowerCase();
        const character = gachaService.characters.find(c =>
            c.name.toLowerCase().includes(query) ||
            (c.alias && c.alias.toLowerCase().includes(query))
        );

        if (!character) {
            return await ctx.reply('ꕤ Personaje no encontrado.');
        }

        if (!character.img || character.img.length === 0) {
            return await ctx.reply(`ꕤ ${character.name} no tiene imágenes registradas.`);
        }

        const randomImg = character.img[Math.floor(Math.random() * character.img.length)];

        await ctx.replyWithImage(randomImg, {
            caption: `📸 *${character.name}*\n${character.source || ''}`
        });
    }
};
