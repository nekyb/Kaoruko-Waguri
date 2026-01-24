import { y2mateDirect } from '../lib/scraper-y2mate.js';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['ytmp3', 'yta', 'audio'],
    tags: ['download'],
    help: ['ytmp3 <url>'],

    async execute(ctx) {
        if (!ctx.args[0]) {
            return await ctx.reply(styleText(`ꕤ Por favor proporciona un enlace de YouTube.\n\n*Ejemplo:*\n${ctx.prefix}ytmp3 https://www.youtube.com/watch?v=example`));
        }

        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
        if (!youtubeRegex.test(ctx.args[0])) {
            return await ctx.reply(styleText(`ꕤ La URL proporcionada no es válida.`));
        }

        await ctx.reply(styleText('ꕥ Procesando tu audio, por favor espera...'));

        try {
            const result = await y2mateDirect(ctx.args[0], { type: 'audio', quality: 128 });

            if (result.status && result.url) {
                const { title, url } = result;
                
                const caption = styleText(
                    `⋆.˚*YOUTUBE AUDIO*\n\n` +
                    `> Título » ${title || 'Desconocido'}\n` +
                    `> Calidad » 128kbps`
                );

                await ctx.bot.sendMessage(ctx.chatId, {
                    audio: { url: url },
                    mimetype: 'audio/mpeg',
                    fileName: `${(title || 'audio').replace(/[\/\\:*?"<>|]/g, '_')}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: title || 'Audio',
                            body: 'YouTube',
                            thumbnailUrl: '', // Scraper doesn't return thumbnail
                            sourceUrl: ctx.args[0],
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: ctx.msg });
            } else {
                throw new Error(result.error || 'No se pudo obtener el enlace de descarga.');
            }

        } catch (error) {
            console.error('YTMP3 Plugin Error:', error);
            await ctx.reply(styleText('ꕤ Error al descargar el audio. Intenta de nuevo más tarde.'));
        }
    }
};
