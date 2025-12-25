import yts from 'yt-search';
import axios from 'axios';
import { styleText } from '../lib/utils.js';

const tempStorage = {};

const ULTRA_API_KEY = "sk_d5a5dec0-ae72-4c87-901c-cccce885f6e6";
const MAYCOL_API_KEY = "may-0fe5c62b";

export default {
    commands: ['play', 'play2'],

    async before(ctx) {
        const { body, sender, bot, chatId } = ctx;
        if (!body) return;
        const text = body.toLowerCase().trim();
        const validOptions = ['🎶', 'audio', '📽', 'video'];
        if (!validOptions.includes(text)) return;
        const userData = tempStorage[sender];
        if (!userData || !userData.url) return;

        delete tempStorage[sender];
        const isAudio = text === '🎶' || text === 'audio';
        await ctx.reply(styleText(`⏳ Descargando ${isAudio ? 'audio' : 'video'} de *${userData.title}*...`));

        try {
            if (isAudio) {
                const info = await ytMp3(userData.url);
                if (info && info.media && info.media.audio) {
                    await bot.sock.sendMessage(chatId, {
                        audio: { url: info.media.audio },
                        mimetype: 'audio/mpeg',
                        fileName: `${cleanFileName(userData.title)}.mp3`,
                        contextInfo: {
                            externalAdReply: {
                                title: info.title || userData.title,
                                body: info.author?.name || userData.author,
                                thumbnailUrl: info.cover || userData.thumbnail,
                                sourceUrl: userData.url,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: ctx.msg });
                    await ctx.reply(styleText(`ꕤ Audio enviado.`));
                } else {
                    await ctx.reply(styleText('ꕤ No se pudo obtener el enlace de descarga del audio.'));
                }
            } else {
                const info = await ytMp4(userData.url);
                if (info && info.url) {
                    await bot.sock.sendMessage(chatId, {
                        video: { url: info.url },
                        caption: styleText(`⟡ *${userData.title}*\n📊 Calidad: ${info.quality || '720p'}`),
                        fileName: `${cleanFileName(userData.title)}.mp4`,
                        mimetype: 'video/mp4',
                        contextInfo: {
                            externalAdReply: {
                                title: userData.title,
                                body: userData.author,
                                thumbnailUrl: userData.thumbnail,
                                sourceUrl: userData.url,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: ctx.msg });
                    await ctx.reply(styleText(`ꕤ Video enviado.`));
                } else {
                    await ctx.reply(styleText('ꕤ No se pudo obtener el enlace de descarga del video.'));
                }
            }
        } catch (error) {
            console.error('Error downloading media:', error);
            await ctx.reply(styleText(`ꕤ Error: ${error.message || 'Error desconocido'}`));
        }
    },
    async execute(ctx) {
        const { args, sender, bot, chatId } = ctx;
        if (args.length === 0) {
            return await ctx.reply(styleText('ꕤ Debes ingresar el nombre de la canción.\nEjemplo: #play Billie Eilish'));
        }
        await ctx.reply(styleText('ꕤ Buscando...'));
        try {
            const query = args.join(' ');
            const searchResults = await yts(query);
            const video = searchResults.videos[0];
            if (!video) {
                return await ctx.reply(styleText('ꕤ No se encontraron resultados.'));
            }
            if (video.seconds > 1800) {
                return await ctx.reply(styleText('ꕤ El video supera los 30 minutos de duración.'));
            }
            tempStorage[sender] = {
                url: video.url,
                title: video.title,
                timestamp: video.timestamp,
                views: video.views,
                author: video.author.name,
                thumbnail: video.thumbnail
            };

            const text = `⌘━─━─≪ *YOUTUBE* ≫─━─━⌘
★ *Título:* ${video.title}
★ *Duración:* ${video.timestamp}
★ *Vistas:* ${formatViews(video.views)}
★ *Autor:* ${video.author.name}
★ *Link:* ${video.url}
⌘━━─≪ Kaoruko ≫─━━⌘

Responde con:
🎶 o *audio* para audio
📽 o *video* para video`;
            await bot.sock.sendMessage(chatId, {
                image: { url: video.thumbnail },
                caption: styleText(text)
            }, { quoted: ctx.msg });
        } catch (error) {
            console.error('Error in play command:', error);
            await ctx.reply(styleText(`ꕤ Error al buscar: ${error.message}`));
        }
    }
};

async function ytMp3(url) {
    const { data } = await axios.post("https://api-sky.ultraplus.click/youtube-mp3", { url }, {
        headers: { apikey: ULTRA_API_KEY }
    });
    if (data.status) return data.result;
    throw new Error(data.message || "Error al procesar MP3");
}

async function ytMp4(url) {
    try {
        const { data } = await axios.get(`https://api.soymaycol.icu/ytdl?url=${encodeURIComponent(url)}&type=mp4&apikey=${MAYCOL_API_KEY}`);

        if (data.status && data.result && data.result.url) {
            return {
                url: data.result.url,
                quality: data.result.quality,
                title: data.result.title
            };
        }
        throw new Error(data.message || "Error al procesar MP4");
    } catch (error) {
        console.error('Error en ytMp4:', error);
        throw new Error(error.message || "Error al descargar el video");
    }
}

function cleanFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, "").substring(0, 50);
}

function formatViews(views) {
    if (!views) return "No disponible";
    if (views >= 1e9) return (views / 1e9).toFixed(1) + "B";
    if (views >= 1e6) return (views / 1e6).toFixed(1) + "M";
    if (views >= 1e3) return (views / 1e3).toFixed(1) + "K";
    return views.toString();
}