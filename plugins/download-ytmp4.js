import axios from 'axios';

async function ytdlp(type, videoUrl) {
    let command;

    if (type === "audio") {
        command = `-x --audio-format mp3 ${videoUrl}`;
    } else if (type === "video") {
        command = `-f 136+140 ${videoUrl}`;
    } else {
        throw new Error("Invalid type: use 'audio' or 'video'");
    }

    const encoded = encodeURIComponent(command);

    const res = await axios.get(
        `https://ytdlp.online/stream?command=${encoded}`,
        { responseType: "stream" }
    );

    return new Promise((resolve, reject) => {
        let downloadUrl = null;

        res.data.on("data", chunk => {
            const text = chunk.toString();
            const match = text.match(/href="([^"]+\.(mp3|mp4|m4a|webm))"/);
            if (match) downloadUrl = `https://ytdlp.online${match[1]}`;
        });

        res.data.on("end", () => {
            if (!downloadUrl) reject("Download URL not found");
            else resolve({ dl: downloadUrl });
        });

        res.data.on("error", reject);
    });
}

export default {
    commands: ['ytmp4', 'ytv'],

    async execute(ctx) {
        const { streamManager, queueManager } = ctx;

        if (!ctx.args[0]) {
            return await ctx.reply(`ꕤ Por favor proporciona un enlace de YouTube.\n\n*Ejemplo:*\n${ctx.prefix}ytmp4 https://www.youtube.com/watch?v=example`);
        }

        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
        if (!youtubeRegex.test(ctx.args[0])) {
            return await ctx.reply(`ꕤ La URL proporcionada no es válida.`);
        }

        await ctx.reply('ꕥ Procesando tu video, por favor espera...');

        try {
            // Add to queue
            await queueManager.addJob('downloads', { url: ctx.args[0], chatId: ctx.chatId });

            const result = await ytdlp('video', ctx.args[0]);

            // Stream the video
            const stream = await streamManager.getStream(result.dl);

            await ctx.bot.sendMessage(ctx.chatId, {
                video: { stream },
                caption: 'ꕥ Aquí tienes tu video!'
            }, { quoted: ctx.msg });

        } catch (error) {
            console.error('YTDLP Plugin Error:', error);
            await ctx.reply('ꕤ Error al descargar el video. El servicio puede estar caído o la URL es inválida.');
        }
    }
};
