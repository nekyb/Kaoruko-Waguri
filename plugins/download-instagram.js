
import { igdl } from 'ruhend-scraper';

export default {
    commands: ['instagram', 'ig', 'igdl'],

    async execute(ctx) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply(
                    `ꕤ *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #instagram https://www.instagram.com/p/xxxxx\n` +
                    `✿ #ig https://www.instagram.com/reel/xxxxx`
                );
            }

            const url = ctx.args[0];
            if (!url.includes('instagram.com')) {
                return await ctx.reply('ꕤ Por favor ingresa un link válido de Instagram.');
            }

            const response = await igdl(url);
            const data = response.data;

            if (!data || data.length === 0) {
                return await ctx.reply(
                    'ꕤ No se encontró contenido en este enlace.\n\n' +
                    '💡 *Tip:* Verifica que el enlace sea correcto y público.'
                );
            }

            const media = data.sort((a, b) => {
                const resA = parseInt(a.resolution || '0');
                const resB = parseInt(b.resolution || '0');
                return resB - resA;
            })[0];

            if (!media || !media.url) {
                throw new Error('No se encontró un medio válido.');
            }

            await ctx.replyWithVideo(media.url, {
                caption: `ꕥ *Instagram Downloader*\n\n` +
                    `✿ *Resolución:* ${media.resolution || 'Desconocida'}\n` +
                    `✿ *Link original:* ${url}`
            });

        } catch (error) {
            console.error('Error en comando instagram:', error);
            await ctx.reply(
                `ꕤ Error al descargar contenido de Instagram.`
            );
        }
    }
};
