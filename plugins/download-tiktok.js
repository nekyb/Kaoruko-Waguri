import { styleText } from '../lib/utils.js';

export default {
    commands: ['tiktok', 'ttk', 'tt'],

    async execute(ctx) {
        const { msg: m, chatId, args, bot } = ctx;
        const links = m.message?.conversation?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) ||
            m.message?.extendedTextMessage?.text?.match(/https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/g) ||
            args.filter(arg => /https?:\/\/(www|vt|vm|t)?\.?tiktok\.com\/\S+/.test(arg));

        if (!links || links.length === 0) {
            return await bot.sendMessage(chatId, {
                text: styleText(`《✧》 *Uso incorrecto del comando*\n\n` +
                    `*Ejemplos:*\n` +
                    `✿ #tiktok https://www.tiktok.com/@user/video/xxx`)
            });
        }

        for (const link of links) {
            try {
                const response = await fetch(`https://www.tikwm.com/api?url=${link}`);
                const result = await response.json();
                const data = result.data;

                if (!data || (!data.play && !data.images?.length)) {
                    await bot.sendMessage(chatId, {
                        text: styleText(`《✧》 No se pudo obtener información del enlace '${link}'`)
                    });
                    continue;
                }

                if (data.images?.length) {
                    for (let index = 0; index < data.images.length; index++) {
                        const imageUrl = data.images[index];
                        const caption = index === 0 ?
                            styleText(`《✧》 *TikTok Download*\n\n✿ *Título:* ${data.title || 'Sin título'}\n\n_Powered By DeltaByte_`) :
                            null;

                        await bot.sendMessage(chatId, {
                            image: { url: imageUrl },
                            caption: caption
                        });
                    }
                } else if (data.play) {
                    const caption = styleText(`《✧》 *TikTok Download*\n\n` +
                        `✿ *Título:* ${data.title || 'Sin título'}\n\n` +
                        `_Powered By DeltaByte_`);

                    await bot.sendMessage(chatId, {
                        video: { url: data.play },
                        caption: caption,
                        mimetype: 'video/mp4'
                    });
                }

            } catch (error) {
                console.error('Error procesando enlace de TikTok:', error);
                await bot.sendMessage(chatId, {
                    text: styleText(`《✧》 Error al procesar el enlace: ${link}\n\n💡 *Tip:* Asegúrate de que el video sea público.`)
                });
            }
        }
    }
};
