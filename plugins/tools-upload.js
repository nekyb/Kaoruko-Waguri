import fetch from 'node-fetch';
import FormData from 'form-data';
import { downloadMediaMessage } from 'baileys';
import { styleText } from '../lib/utils.js';

export default {
    commands: ['upload', 'subir'],

    async execute(ctx) {
        const { msg } = ctx;

        const quotedContent = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quoted = quotedContent ? { message: quotedContent } : null;

        const isImage = msg.message?.imageMessage;
        const isQuotedImage = quoted?.message?.imageMessage;
        const isVideo = msg.message?.videoMessage;
        const isQuotedVideo = quoted?.message?.videoMessage;
        const isDocument = msg.message?.documentMessage;
        const isQuotedDocument = quoted?.message?.documentMessage;
        const isAudio = msg.message?.audioMessage;
        const isQuotedAudio = quoted?.message?.audioMessage;
        const isSticker = msg.message?.stickerMessage;
        const isQuotedSticker = quoted?.message?.stickerMessage;

        const hasMedia = isImage || isQuotedImage || isVideo || isQuotedVideo ||
            isDocument || isQuotedDocument || isAudio || isQuotedAudio ||
            isSticker || isQuotedSticker;

        if (!hasMedia) {
            return await ctx.reply(styleText(
                `📤 *UPLOAD - Subir a Catbox*\n\n` +
                `Responde a un archivo con #upload\n` +
                `O envía un archivo con el comando.\n\n` +
                `Soporta: Imágenes, Videos, Documentos, Audios, Stickers`
            ));
        }

        await ctx.reply(styleText('📤 Subiendo archivo a Catbox.moe...'));

        try {
            const buffer = await downloadMediaMessage(
                quoted ? quoted : msg,
                'buffer',
                {}
            );

            if (!buffer) {
                return await ctx.reply(styleText('❌ Error al descargar el archivo.'));
            }

            let filename = 'file';
            let mimetype = 'application/octet-stream';

            if (isImage || isQuotedImage) {
                const imageMsg = isImage || isQuotedImage;
                mimetype = imageMsg.mimetype || 'image/jpeg';
                filename = `image.${mimetype.split('/')[1] || 'jpg'}`;
            } else if (isVideo || isQuotedVideo) {
                const videoMsg = isVideo || isQuotedVideo;
                mimetype = videoMsg.mimetype || 'video/mp4';
                filename = `video.${mimetype.split('/')[1] || 'mp4'}`;
            } else if (isDocument || isQuotedDocument) {
                const docMsg = isDocument || isQuotedDocument;
                mimetype = docMsg.mimetype || 'application/octet-stream';
                filename = docMsg.fileName || `document.${mimetype.split('/')[1] || 'bin'}`;
            } else if (isAudio || isQuotedAudio) {
                const audioMsg = isAudio || isQuotedAudio;
                mimetype = audioMsg.mimetype || 'audio/mpeg';
                filename = `audio.${audioMsg.ptt ? 'ogg' : 'mp3'}`;
            } else if (isSticker || isQuotedSticker) {
                const stickerMsg = isSticker || isQuotedSticker;
                mimetype = stickerMsg.mimetype || 'image/webp';
                filename = 'sticker.webp';
            }

            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', buffer, {
                filename: filename,
                contentType: mimetype
            });

            const response = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.text();

            if (!result.startsWith('https://')) {
                throw new Error(result || 'Error desconocido');
            }

            await ctx.reply(styleText(
                `✅ *Archivo subido exitosamente*\n\n` +
                `📁 Archivo: ${filename}\n` +
                `🔗 Link: ${result}\n\n` +
                `> El archivo estará disponible permanentemente`
            ));

        } catch (error) {
            console.error('Error uploading to Catbox:', error);
            await ctx.reply(styleText(`❌ Error al subir: ${error.message}`));
        }
    }
};

