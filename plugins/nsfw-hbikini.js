import { loadLinks, getRandomLink, downloadMedia } from '../lib/nsfw.js';

export default {
    commands: ['hbikini'],

    async execute(ctx) {
        console.log('[DEBUG hbikini] Iniciando execute');
        const { chatId, isGroup, bot } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            console.log('[DEBUG hbikini] ERROR: No hay conexión');
            return ctx.reply('❌ Error: Conexión no disponible.');
        }

        if (isGroup && !global.db.groups[chatId]?.settings?.nsfw) {
            return await ctx.reply('ꕤ Los comandos NSFW están desactivados en este grupo.');
        }

        try {
            console.log('[DEBUG hbikini] Cargando enlaces hentaiSemi...');
            await ctx.reply('ꕤ Cargando imagen hentai bikini...');

            const links = await loadLinks('hentaiSemi');
            console.log('[DEBUG hbikini] Enlaces:', links.length);
            if (links.length === 0) {
                console.log('[DEBUG hbikini] ERROR: Sin enlaces');
                return await ctx.reply('ꕤ Error al cargar la base de datos de imágenes.');
            }

            const randomUrl = getRandomLink(links);
            const buffer = await downloadMedia(randomUrl);

            if (!buffer) {
                return await ctx.reply('ꕤ Error al descargar la imagen.');
            }

            await conn.sendMessage(chatId, {
                image: buffer,
                caption: 'ꕥ Imagen hentai bikini aleatoria'
            });
        } catch (error) {
            console.error('[DEBUG hbikini] ✗ ERROR:', error);
            console.error('[DEBUG hbikini] Stack:', error.stack);
            await ctx.reply('ꕤ Ocurrió un error al procesar la solicitud.');
        }
    }
};
