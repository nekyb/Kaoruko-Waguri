
import { igdl } from 'ruhend-scraper';

export default {
    commands: ['facebook', 'fb', 'fbdl'],

    async execute(ctx) {
        try {
            if (ctx.args.length === 0) {
                return await ctx.reply(
                    `ꕤ *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #facebook https://www.facebook.com/watch?v=xxxxx\n` +
                    `✿ #fb https://fb.watch/xxxxx`
                );
            }

            const url = ctx.args[0];
            if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
                return await ctx.reply('ꕤ Por favor ingresa un link válido de Facebook.');
            }

            const response = await igdl(url);
            const result = response.data;
            const data = result.find(i => i.resolution === '720p (HD)') ||
                result.find(i => i.resolution === '360p (SD)') ||
                result[0];

            if (!data || !data.url) {
                return await ctx.reply('ꕤ No se encontró una resolución adecuada.');
            }

            await ctx.replyWithVideo(data.url, {
                caption: `ꕥ *Facebook Downloader*\n\n` +
                    `✿ *Resolución:* ${data.resolution || 'Desconocida'}\n` +
                    `✿ *Link original:* ${url}`,
                fileName: 'facebook_video.mp4'
            });

        } catch (error) {
            console.error('Error en comando facebook:', error);
            await ctx.reply(
                `ꕤ Error al descargar video de Facebook.\n\n💡 *Tip:* Asegúrate de que el video sea público y el enlace esté correcto.`
            );
        }
    }
};
