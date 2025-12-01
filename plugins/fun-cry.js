import { extractMentions } from '../lib/utils.js';
import { groupMetadataCache } from '../lib/GroupMetadataCache.js';

export default {
    commands: ['cry', 'llorar'],

    async execute(ctx) {
        const { bot, msg, sender, from, args, chatId } = ctx;

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
            // Try to get name from group metadata
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await groupMetadataCache.get(bot.sock, chatId);
                    const whoNumber = who.split('@')[0].split(':')[0];

                    const participant = groupMetadata.participants.find(p => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === whoNumber;
                    });

                    // Use notify name if available, otherwise use number
                    targetName = participant?.notify || participant?.name || whoNumber;
                } else {
                    targetName = who.split('@')[0].split(':')[0];
                }
            } catch (e) {
                console.error('[CRY] Error getting name:', e);
                targetName = who.split('@')[0].split(':')[0];
            }
        }

        // React
        try {
            await bot.sock.sendMessage(ctx.chatId, { react: { text: '😭', key: msg.key } });
        } catch (e) { }

        // Build message
        let str;
        if (who !== sender) {
            str = `\`${senderName}\` está llorando por culpa de \`${targetName}\`.`;
        } else {
            str = `\`${senderName}\` está llorando.`;
        }

        // Videos
        const videos = [
            'https://qu.ax/gRjHK.mp4',
            'https://qu.ax/VjjCJ.mp4',
            'https://qu.ax/ltieQ.mp4',
            'https://qu.ax/oryVi.mp4',
            'https://qu.ax/YprzU.mp4',
            'https://qu.ax/nxaUW.mp4',
            'https://qu.ax/woSGV.mp4',
            'https://qu.ax/WkmA.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        // Send
        await bot.sock.sendMessage(ctx.chatId, {
            video: { url: video },
            caption: str,
            gifPlayback: true,
            mentions: [who]
        }, { quoted: msg });
    }
};
