import axios from 'axios';

const SEARCH_API = 'https://theresapis.vercel.app/search/song';
const DOWNLOAD_API = 'https://api.deline.web.id/downloader/spotify';
const THERESA_KEY = 'THERESA';

async function songSearch(query) {
    if (!query) throw new Error('Ingresa el nombre de la canción.');

    try {
        const { data } = await axios.get(SEARCH_API, {
            params: { apikey: THERESA_KEY, query }
        });

        if (!data.status || !data.result?.songs?.length)
            throw new Error('❌ No se encontraron canciones.');

        return data.result.songs;
    } catch (err) {
        console.error('Error search:', err.message);
        throw err;
    }
}

async function getDownload(url) {
    try {
        const { data } = await axios.get(DOWNLOAD_API, {
            params: { url }
        });

        if (!data.status || !data.download) return null;
        return data;
    } catch (err) {
        console.error('Error download:', err.message);
        return null;
    }
}

const handler = {
    commands: ['song', 'spotify', 'songsearch'],
    tags: ['music', 'search'],
    help: ['song', 'spotify'],

    async execute(ctx) {
        try {
            // Initialize session storage if not exists
            if (!global.songSearch) global.songSearch = {};

            if (!ctx.args[0]) {
                return await ctx.reply(
                    `📀 Uso: *${ctx.prefix}spotify [título/artista]*\n\nEjemplo: *${ctx.prefix}spotify kau masih kekasihku*`
                );
            }

            await ctx.reply('🔎 Buscando canción, espera un momento...');

            const query = ctx.args.join(' ');
            const songs = await songSearch(query);

            const list = songs
                .map(
                    (v, i) =>
                        `*${i + 1}.* 🎵 *${v.title}*\n👤 Artista: ${v.artist}\n⏱ Duración: ${v.duration}\n🔗 [Link](${v.url})`
                )
                .join('\n\n');

            await ctx.replyWithImage(songs[0].thumbnail, {
                caption: `🎧 *Resultados para:* _${query}_\n\n${list}\n\n🪄 Responde con el número *1 - ${songs.length}* para descargar.`
            });

            // Store session
            global.songSearch[ctx.sender] = songs;

            // Auto-clear session after 5 minutes
            setTimeout(() => {
                if (global.songSearch[ctx.sender]) {
                    delete global.songSearch[ctx.sender];
                }
            }, 5 * 60 * 1000);

        } catch (err) {
            console.error('Error main handler:', err);
            await ctx.reply('❌ Ocurrió un error al buscar la canción.');
        }
    },

    async before(ctx) {
        try {
            if (!ctx.body || isNaN(ctx.body)) return;
            if (!global.songSearch || !global.songSearch[ctx.sender]) return;

            const index = parseInt(ctx.body) - 1;
            const list = global.songSearch[ctx.sender];
            if (index < 0 || index >= list.length) return;

            const song = list[index];
            await ctx.reply(`🎶 Descargando *${song.title}* - ${song.artist} ...`);

            const result = await getDownload(song.url);
            if (!result || !result.download)
                return await ctx.reply('❌ Error al obtener el link de descarga.');

            const caption = `
🎵 *${result.title || song.title}*
👤 Artista: ${result.artist || song.artist}
⏱ Duración: ${result.duration || song.duration}
🔗 Spotify: ${song.url}
`.trim();

            await ctx.replyWithImage(result.thumbnail || song.thumbnail, { caption });

            await ctx.replyWithAudio(result.download, {
                fileName: `${(result.title || song.title).replace(/[^\w\s-]/g, '')}.mp3`,
                mimetype: 'audio/mpeg'
            });

            delete global.songSearch[ctx.sender];
        } catch (err) {
            console.error('Error download handler:', err);
            await ctx.reply('❌ Ocurrió un error al descargar la canción.');
        }
    }
};

export default handler;
