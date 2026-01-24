import { y2mateDirect } from '../lib/scraper-y2mate.js';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['ytmp4', 'ytv', 'video'],
    tags: ['download'],
    help: ['ytmp4 <url>'],

    async execute(ctx) {
        if (!ctx.args[0]) {
            return await ctx.reply(styleText(`ꕤ Por favor proporciona un enlace de YouTube.\n\n*Ejemplo:*\n${ctx.prefix}ytmp4 https://www.youtube.com/watch?v=example`));
        }

        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
        if (!youtubeRegex.test(ctx.args[0])) {
            return await ctx.reply(styleText(`ꕤ La URL proporcionada no es válida.`));
        }

        // Verificar memoria disponible antes de descargar video
        const memCheck = global.memoryManager?.canProcessDownload(20 * 1024 * 1024); // Estimar 20MB
        if (memCheck && !memCheck.allowed) {
            return await ctx.reply(styleText(memCheck.message));
        }

        await ctx.reply(styleText('ꕥ Procesando tu video, por favor espera...'));

        try {
            const result = await y2mateDirect(ctx.args[0], { type: 'video', quality: 720 });

            if (result.status && result.url) {
                const { title, url } = result;
                
                const caption = styleText(
                    `⋆.˚*YOUTUBE VIDEO*\n\n` +
                    `> Título » ${title || 'Desconocido'}\n` +
                    `> Calidad » 720p (approx)`
                );

                await ctx.bot.sendMessage(ctx.chatId, {
                    video: { url: url },
                    caption: caption,
                    mimetype: 'video/mp4',
                    fileName: `${(title || 'video').replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50)}.mp4`,
                    contextInfo: {
                        externalAdReply: {
                            title: title || 'Video',
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
            console.error('YTMP4 Plugin Error:', error);
            
            // Manejar error de memoria
            if (error.code === 'ENOSPC' || error.message?.includes('ENOSPC')) {
                global.memoryManager?.forceCleanup();
                return await ctx.reply(styleText('ꕤ Error de espacio/memoria. Intenta en unos segundos.'));
            }
            
            await ctx.reply(styleText('ꕤ Error al descargar el video. Intenta de nuevo más tarde.'));
        }
    }
};