import { extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['kill', 'matar', 'suicidio'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;

        const gifs = [
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/07vynuirogww.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/hc3eciuama.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/tqc5pp91nei.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/v230k7ijgrj.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/tyeztham38h.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/663a1w82ipk.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/o3dduku1bb.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/kx0lb7a3a7b.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/t98upc7k0vi.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/9i0rexyuyha.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/63csdjufxtg.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/7i5uihi0kum.gif'
        ];

        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        let who;
        if (mentioned.length > 0) {
            who = mentioned[0];
        } else if (quoted) {
            who = quoted;
        }

        const senderName = from.name || sender.split('@')[0];
        let caption = '';
        let mentions = [];

        if (who && who !== sender) {
            // Kill someone
            let targetName;
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
            caption = styleText(`\`${senderName}\` mató a \`${targetName}\` 🔪🩸`);
            mentions = [who];
        } else {
            // Suicide
            caption = styleText(`\`${senderName}\` se suicidó... 😵💀`);
        }

        await ctx.replyWithVideo(randomGif, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};
