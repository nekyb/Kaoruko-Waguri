import wiki from 'wikijs';

const FANDOM_API = 'https://community.fandom.com/api.php';
const MAX_SUMMARY_LENGTH = 1500;

export default {
    commands: ['fandom', 'wikif'],
    tags: ['search'],
    help: ['fandom <término>'],

    async execute(ctx) {
        const { chatId, text, prefix, command, bot } = ctx;
        const conn = bot?.sock;

        if (!conn) {
            return ctx.reply('❌ Error: Conexión no disponible.');
        }

        try {
            if (!text || !text.trim()) {
                return await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ ${prefix}${command} Naruto\n` +
                    `✿ ${prefix}wikif Minecraft\n` +
                    `✿ ${prefix}fandom League of Legends`
                );
            }

            const query = text.trim();

            await ctx.reply('🔍 Buscando en Fandom...');

            // Inicializar la API de Fandom
            const fandomWiki = wiki({ apiUrl: FANDOM_API });
            const page = await fandomWiki.page(query);

            if (!page) {
                return await ctx.reply(
                    `《✧》 No se encontró información para: "${query}"\n\n` +
                    `💡 *Tip:* Intenta con términos en inglés o verifica la ortografía.`
                );
            }

            // Obtener resumen e imágenes
            const [summary, images] = await Promise.all([
                page.summary().catch(() => 'Sin resumen disponible'),
                page.images().catch(() => [])
            ]);

            // Buscar imagen válida
            const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const image = images.find(img =>
                validImageExtensions.some(ext => img.toLowerCase().endsWith(ext))
            );

            // Truncar resumen si es muy largo
            const extract = summary && summary.length > MAX_SUMMARY_LENGTH
                ? summary.slice(0, MAX_SUMMARY_LENGTH) + '...'
                : summary || 'Sin resumen disponible';

            // Crear caption
            const title = page.raw?.title || query;
            const caption = `《✧》 *Fandom Wiki*\n\n` +
                `📚 *Título:* ${title}\n\n` +
                `${extract}\n\n` +
                `─────────────────\n` +
                `_Información de Fandom_`;

            // Enviar resultado con imagen o solo texto
            if (image) {
                await conn.sendMessage(chatId, {
                    image: { url: image },
                    caption: caption
                });
            } else {
                await ctx.reply(caption);
            }

        } catch (error) {
            console.error('[Fandom] Error en comando:', error);

            let errorMsg = `《✧》 No se encontró información para: "${text}"\n\n`;

            if (error.message && error.message.includes('page')) {
                errorMsg += `💡 *Tip:* La página no existe. Intenta con términos en inglés o verifica la ortografía.`;
            } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                errorMsg += `🌐 *Error de conexión.* Verifica tu internet e intenta de nuevo.`;
            } else {
                errorMsg += `💡 *Tip:* Intenta con términos más específicos o en inglés.`;
            }

            await ctx.reply(errorMsg);
        }
    }
};