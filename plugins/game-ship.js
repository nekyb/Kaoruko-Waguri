import { extractMentions, styleText } from '../lib/utils.js';

const SHIP_RESULTS = [
    { min: 0, max: 20, emoji: '💔', text: 'No hay compatibilidad... mejor amigos' },
    { min: 21, max: 40, emoji: '😅', text: 'Puede funcionar pero hay trabajo que hacer' },
    { min: 41, max: 60, emoji: '💕', text: 'Hay química, podrían intentarlo' },
    { min: 61, max: 80, emoji: '💖', text: 'Gran compatibilidad, hacen buena pareja' },
    { min: 81, max: 100, emoji: '💗💘💗', text: '¡PAREJA PERFECTA! Amor verdadero' }
];

export default {
    commands: ['ship', 'love', 'compatibilidad', 'match'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;

        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        let person1 = sender;
        let person2 = null;

        if (mentioned.length >= 2) {
            person1 = mentioned[0];
            person2 = mentioned[1];
        } else if (mentioned.length === 1) {
            person2 = mentioned[0];
        } else if (quoted) {
            person2 = quoted;
        }

        if (!person2) {
            return await ctx.reply(styleText(
                'ꕥ *SHIP - Compatibilidad de Amor*\n\n' +
                'Menciona a 2 personas o responde a alguien:\n' +
                '> • #ship @persona1 @persona2\n' +
                '> • Responder + #ship\n' +
                '> • #ship @persona'
            ));
        }
        const getNumber = (jid) => jid.split('@')[0].split(':')[0];
        const num1 = getNumber(person1);
        const num2 = getNumber(person2);

        // Resolve names
        const getName = async (jid) => {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await ctx.bot.groupMetadata(chatId);
                    const number = getNumber(jid);
                    const participant = groupMetadata.participants.find(p =>
                        getNumber(p.id) === number || (p.lid && getNumber(p.lid) === number)
                    );
                    return participant?.notify || participant?.name || number;
                }
            } catch (e) { }
            return getNumber(jid);
        };

        const name1 = await getName(person1);
        const name2 = await getName(person2);

        // Simular aleatoriedad basada en los números pero que sea consistente por día
        const today = new Date().toISOString().slice(0, 10);
        const seed = parseInt(num1.slice(-4)) + parseInt(num2.slice(-4)) + today.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        const percentage = Math.abs((seed * 12345) % 101); // Algoritmo simple pseudo-aleatorio consistente

        const result = SHIP_RESULTS.find(r => percentage >= r.min && percentage <= r.max);

        const progressBar = (percent) => {
            const filled = Math.floor(percent / 10);
            const empty = 10 - filled;
            return '❤️'.repeat(filled) + '🖤'.repeat(empty);
        };

        const text = `
💕 *SHIP - Compatibilidad*

👤 ${name1}
❤️ + 
👤 ${name2}

${progressBar(percentage)}

*${percentage}%* ${result.emoji}
> ${result.text}
`.trim();

        await ctx.bot.sendMessage(chatId, {
            text: styleText(text),
            mentions: [person1, person2]
        }, { quoted: msg });
    }
};
