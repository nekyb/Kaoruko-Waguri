import { extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['hug', 'abrazar'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;

        let who;

        // Determine target
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        } else {
            who = sender;
        }

        // Get names
        const senderName = from.name || sender.split('@')[0];

        // Try to get target name from group metadata
        let targetName;
        if (who === sender) {
            targetName = senderName;
        } else {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await ctx.bot.groupMetadata(chatId);
                    const whoNumber = who.split('@')[0].split(':')[0];

                    const participant = groupMetadata.participants.find(p => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === whoNumber;
                    });

                    targetName = participant?.notify || participant?.name || whoNumber;
                } else {
                    targetName = who.split('@')[0].split(':')[0];
                }
            } catch (e) {
                targetName = who.split('@')[0].split(':')[0];
            }
        }

        // React
        try {
            await ctx.bot.sendMessage(chatId, { react: { text: '🫂', key: msg.key } });
        } catch (e) { }

        // Build message
        let str;
        if (who !== sender) {
            str = styleText(`\`${senderName}\` le dió un fuerte abrazo a \`${targetName}\`.`);
        } else {
            str = styleText(`\`${senderName}\` se abrazó a sí mismo.`);
        }

        // Videos
        const videos = [
            'https://telegra.ph/file/6a3aa01fabb95e3558eec.mp4',
            'https://telegra.ph/file/0e5b24907be34da0cbe84.mp4',
            'https://telegra.ph/file/6bc3cd10684f036e541ed.mp4',
            'https://telegra.ph/file/3e443a3363a90906220d8.mp4',
            'https://telegra.ph/file/56d886660696365f9696b.mp4',
            'https://telegra.ph/file/3eeadd9d69653803b33c6.mp4',
            'https://telegra.ph/file/436624e53c5f041bfd597.mp4',
            'https://telegra.ph/file/5866f0929bf0c8fe6a909.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        await ctx.bot.sendMessage(chatId, {
            video: { url: video },
            caption: str,
            gifPlayback: true,
            mentions: [who]
        }, { quoted: msg });
    }
};
