import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['sticker', 's'],

    async execute(ctx) {
        try {
            const { msg, bot, chatId } = ctx;
            const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quoted = quotedContent ? { message: quotedContent } : null;
            const isImage = msg.message?.imageMessage || quoted?.message?.imageMessage;
            const isVideo = msg.message?.videoMessage || quoted?.message?.videoMessage;
            if (!isImage && !isVideo) {
                return await ctx.reply(styleText('ꕤ Debes enviar una imagen o video, o responder a uno.'));
            }
            await ctx.reply(styleText('⏳ Creando sticker...'));
            const messageToDownload = quoted || msg;
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: bot.sock.updateMediaMessage
                }
            );
            const sticker = new Sticker(buffer, {
                pack: 'Kaoruko Bot',
                author: 'DeltaByte',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: 'transparent'
            });
            const stickerBuffer = await sticker.toBuffer();
            await bot.sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });
        } catch (error) {
            console.error('Error creando sticker:', error);
            await ctx.reply(styleText(`ꕤ Error al crear el sticker: ${error.message}`));
        }
    }
};
