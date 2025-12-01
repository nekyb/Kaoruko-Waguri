import { extractMentions } from '../lib/utils.js';
import { groupMetadataCache } from '../lib/GroupMetadataCache.js';

export default {
    commands: ['kiss', 'skiss', 'kis', 'besos', 'beso', 'besar', 'besando'],

    async execute(ctx) {
        const { bot, msg, sender, from, chatId } = ctx;

        let who;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        } else {
            who = sender;
        }

        const senderName = from.name || sender.split('@')[0];

        let targetName;
        if (who === sender) {
            targetName = 'alguien';
        } else {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await groupMetadataCache.get(bot.sock, chatId);
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

        try {
            const res = await fetch('https://nekos.life/api/kiss');
            const json = await res.json();
            const { url } = json;

            const str = `\`${senderName}\` está besando a \`${targetName}\``;

            await bot.sock.sendMessage(ctx.chatId, {
                image: { url: url },
                caption: str,
                mentions: [who]
            }, { quoted: msg });

        } catch (e) {
            console.error(e);
            await ctx.reply('ꕤ Error al obtener el beso.');
        }
    }
};
