import { extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['dance', 'bailar', 'baile'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;
        const gifs = [
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/hfutvpxzvdi.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/p9izkugbu1i.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/fnzm57qpqnc.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/mm97bjc3mje.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/gk8c62rnufu.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/o0k98t209ki.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/x8lh8rwdukj.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/7rj4grg17wq.gif',
            'https://rogddqelmxyuvhpjvxbf.supabase.co/storage/v1/object/public/files/dzq78cxu7ts.gif'
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
            caption = styleText(`\`${senderName}\` está bailando con \`${targetName}\` 💃🕺`);
            mentions = [who];
        } else {
            caption = styleText(`\`${senderName}\` está bailando alegrementee 🎶`);
        }

        await ctx.replyWithVideo(randomGif, {
            caption: caption,
            gifPlayback: true,
            mentions: mentions
        });
    }
};
