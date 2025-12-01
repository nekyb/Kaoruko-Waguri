import axios from 'axios';

const SEARCH_API = 'https://api.delirius.store/search/soundcloud';
const DOWNLOAD_API = 'https://api.delirius.store/download/soundcloud';
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutos

async function scSearch(query) {
    try {
        const res = await axios.get(`${SEARCH_API}?q=${encodeURIComponent(query)}&limit=5`);
        return res.data?.data || [];
    } catch (err) {
        console.error('Error searching:', err.message);
        throw new Error('No se pudo realizar la búsqueda');
    }
}

async function scDownload(url) {
    try {
        const encoded = encodeURIComponent(url);
        const res = await axios.get(`${DOWNLOAD_API}?url=${encoded}`);
        return res.data?.data || null;
    } catch (err) {
        console.error('Error downloading:', err.message);
        throw new Error('No se pudo descargar el audio');
    }
}

async function sendSoundCloud(ctx, url) {
    const { bot, chatId, m } = ctx;
    const conn = bot?.sock;

    if (!conn) {
        throw new Error('Conexión no disponible');
    }

    try {
        await ctx.reply('🎶 Descargando canción de SoundCloud, por favor espera...');

        const data = await scDownload(url);

        if (!data || !data.download) {
            return ctx.reply('⚠️ Error al obtener el enlace de audio.');
        }

        // Crear caption con datos disponibles
        const title = data.title || 'Desconocido';
        const author = data.author || 'Artista desconocido';
        const link = data.link || url;
        const caption = `🎵 *${title}*\n👤 ${author}\n🔗 ${link}`;

        // Enviar imagen si está disponible
        const thumb = data.image || data.author_avatar;
        if (thumb) {
            try {
                await conn.sendMessage(chatId, {
                    image: { url: thumb },
                    caption
                });
            } catch (imgErr) {
                console.error('Error enviando imagen:', imgErr);
                await ctx.reply(caption);
            }
        } else {
            await ctx.reply(caption);
        }

        // Enviar archivo de audio
        await conn.sendMessage(
            chatId,
            {
                document: { url: data.download },
                mimetype: 'audio/mpeg',
                fileName: `${title.replace(/[/\\?%*:|"<>]/g, '_')}.mp3`,
                caption: ''
            },
            { quoted: m }
        );

    } catch (err) {
        console.error('Error sending audio:', err);
        throw err;
    }
}

export default {
    commands: ['soundcloud', 'scsearch'],
    tags: ['search'],
    help: ['soundcloud <texto>'],

    async execute(ctx) {
        const { text, prefix, command, sender } = ctx;

        try {
            // Inicializar almacenamiento de sesiones
            if (!global.scsearch) {
                global.scsearch = {};
            }

            if (!text) {
                return ctx.reply(
                    `📻 *Ejemplo:* ${prefix}${command} ncs\n\nPara buscar canciones en SoundCloud.`
                );
            }

            await ctx.reply('🔍 Buscando en SoundCloud...');

            const result = await scSearch(text);

            if (!result || result.length === 0) {
                return ctx.reply('❌ No se encontraron resultados.');
            }

            // Si solo hay un resultado, descargar directamente
            if (result.length === 1) {
                const song = result[0];
                await sendSoundCloud(ctx, song.link);
                return;
            }

            // Mostrar lista de resultados
            const list = result
                .map((v, i) => {
                    const title = v.title || 'Sin título';
                    const artist = v.artist || 'Artista desconocido';
                    const link = v.link || '';
                    return `*${i + 1}.* 🎵 ${title}\n👤 ${artist}\n🔗 ${link}`;
                })
                .join('\n\n');

            await ctx.reply(
                `🎧 *Resultados de SoundCloud:*\n\n${list}\n\n` +
                `Escribe el número *1 - ${result.length}* para descargar.`
            );

            // Guardar resultados en sesión
            global.scsearch[sender] = result;

            // Limpiar sesión automáticamente después del timeout
            setTimeout(() => {
                if (global.scsearch[sender]) {
                    delete global.scsearch[sender];
                }
            }, SESSION_TIMEOUT);

        } catch (err) {
            console.error('Error en execute:', err);
            ctx.reply('⚠️ Ocurrió un error al buscar: ' + err.message);
        }
    },

    async before(ctx) {
        try {
            const { text, sender } = ctx;

            // Validar que hay texto y sesión activa
            if (!text || !global.scsearch?.[sender]) {
                return false;
            }

            const results = global.scsearch[sender];
            const num = parseInt(text.trim());

            // Validar número ingresado
            if (isNaN(num) || num < 1 || num > results.length) {
                return false;
            }

            // Obtener canción seleccionada
            const song = results[num - 1];

            // Limpiar sesión antes de procesar
            delete global.scsearch[sender];

            // Descargar y enviar
            try {
                await sendSoundCloud(ctx, song.link);
            } catch (err) {
                console.error('Error enviando audio:', err);
                await ctx.reply('❌ Error al enviar el archivo de audio.');
            }

            return true; // Detener otros handlers

        } catch (err) {
            console.error('Error in soundcloud before:', err);
            return false;
        }
    }
};