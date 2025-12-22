import { loadLinks, getRandomLink, downloadMedia } from '../lib/nsfw.js';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['pornvideo', 'pv'],

    async execute(ctx) {
        console.log('[DEBUG pornvideo] Iniciando execute');
        const { chatId, isGroup, bot } = ctx;
        const conn = bot?.sock;
        if (!conn) {
            console.log('[DEBUG pornvideo] ERROR: No hay conexión');
            return await ctx.reply(styleText('❌ Error: Conexión no disponible.'));
        }
        if (isGroup && !global.db.groups[chatId]?.settings?.nsfw) {
            return await ctx.reply(styleText('ꕤ Los comandos NSFW están desactivados en este grupo.'));
        }
        try {
            console.log('[DEBUG pornvideo] Cargando enlaces porno...');
            await ctx.reply(styleText('ꕤ Cargando video, esto puede tardar...'));
            const links = await loadLinks('porno');
            console.log('[DEBUG pornvideo] Enlaces:', links.length);
            if (links.length === 0) {
                console.log('[DEBUG pornvideo] ERROR: Sin enlaces');
                return await ctx.reply(styleText('ꕤ Error al cargar la base de datos de videos.'));
            }
            const randomUrl = getRandomLink(links);
            const buffer = await downloadMedia(randomUrl);
            if (!buffer) {
                return await ctx.reply(styleText('ꕤ Error al descargar el video.'));
            }
            await conn.sendMessage(chatId, {
                video: buffer,
                caption: styleText('ꕥ Video aleatorio.')
            });
        } catch (error) {
            console.error('[DEBUG pornvideo] ✗ ERROR:', error);
            console.error('[DEBUG pornvideo] Stack:', error.stack);
            await ctx.reply(styleText('ꕤ Ocurrió un error al procesar la solicitud.'));
        }
    }
};
