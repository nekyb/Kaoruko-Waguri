
import axios from 'axios';

export default {
    commands: ['mediafire', 'mf', 'mfdl'],

    async execute(ctx) {
        const { streamManager, queueManager, cacheManager } = ctx;

        try {
            if (ctx.args.length === 0) {
                return await ctx.reply(
                    `《✧》 *Uso incorrecto del comando*\n\n` +
                    `Ejemplo:\n` +
                    `✿ #mediafire https://www.mediafire.com/file/xxxxx`
                );
            }

            const url = ctx.args[0];
            if (!url.includes('mediafire.com')) {
                return await ctx.reply('《✧》 Por favor ingresa un link válido de MediaFire.');
            }
            const job = await queueManager.addJob('downloads', { url, chatId: ctx.chatId });
            const apiUrl = `https://delirius-apiofc.vercel.app/download/mediafire?url=${encodeURIComponent(url)}`;
            let data = cacheManager.get(apiUrl);
            if (!data) {
                const response = await axios.get(apiUrl, { timeout: 30000 });
                data = response.data;
                cacheManager.set(apiUrl, data, 60 * 60)
            }

            if (!data || !data.data || !data.data[0]) {
                return await ctx.reply('《✧》 No se pudo obtener información del enlace.');
            }

            const file = data.data[0];
            if (!file.link) {
                return await ctx.reply('《✧》 No se pudo obtener el enlace de descarga.');
            }

            const caption = `╔═══《 MEDIAFIRE 》═══╗\n` +
                `║\n` +
                `║ ✦ *Nombre:* ${file.nama || 'Desconocido'}\n` +
                `║ ✦ *Peso:* ${file.size || 'N/A'}\n` +
                `║ ✦ *Tipo:* ${file.mime || 'N/A'}\n` +
                `║\n` +
                `╚═════════════════╝`;

            const stream = await streamManager.getStream(file.link);
            const messageOptions = {
                caption: caption,
                fileName: file.nama || 'archivo',
                mimetype: file.mime || 'application/octet-stream'
            };

            if (file.mime?.includes('image')) {
                await ctx.bot.sendMessage(ctx.chatId, { image: { stream }, ...messageOptions }, { quoted: ctx.msg });
            } else if (file.mime?.includes('video')) {
                await ctx.bot.sendMessage(ctx.chatId, { video: { stream }, ...messageOptions }, { quoted: ctx.msg });
            } else if (file.mime?.includes('audio')) {
                await ctx.bot.sendMessage(ctx.chatId, { audio: { stream }, ...messageOptions }, { quoted: ctx.msg });
            } else {
                await ctx.bot.sendMessage(ctx.chatId, { document: { stream }, ...messageOptions }, { quoted: ctx.msg });
            }

        } catch (error) {
            console.error('Error en comando mediafire:', error);
            await ctx.reply(
                `《✧》 Error al procesar el enlace de MediaFire.\n\n💡 *Tip:* Asegúrate de que el enlace de MediaFire sea válido y público.`
            );
        }
    }
};
