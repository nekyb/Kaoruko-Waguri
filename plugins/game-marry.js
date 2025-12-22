import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const CEREMONIES = [
    'en una capilla con velas flotantes',
    'en la playa al atardecer',
    'en un castillo medieval',
    'en un templo japonés',
    'en Las Vegas por Elvis',
    'bajo las estrellas',
    'en un jardín de rosas',
    'en una iglesia gótica',
    'en un submarino',
    'en la luna (virtualmente)',
    'en el metaverso',
    'en un McDonalds',
    'en el baño del grupo',
    'en una montaña rusa'
];

const GIFTS = [
    'un anillo de diamantes',
    'un gato como mascota',
    'una PS5',
    'un viaje a París',
    'un taco de regalo',
    'un NFT inutilizable',
    'unas chanclas de marca',
    'un peluche gigante',
    'Bitcoin',
    'una suscripción a Netflix'
];

const FUTURES = [
    'Tendrán 3 hijos hermosos',
    'Serán millonarios juntos',
    'Discutirán por el control remoto',
    'Se divorciarán en 2 años jaja',
    'Vivirán felices para siempre',
    'Tendrán un perro llamado "Bot"',
    'Pelearán por quién lava los platos',
    'Viajarán por el mundo',
    'Abrirán un negocio juntos',
    'Se mudarán a Japón'
];

export default {
    commands: ['marry', 'casar', 'matrimonio', 'boda', 'casarse'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;

        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;

        let partner = null;

        if (mentioned.length > 0) {
            partner = mentioned[0];
        } else if (quoted) {
            partner = quoted;
        }

        if (!partner || partner === sender) {
            return await ctx.reply(styleText(
                '💒 *MATRIMONIO VIRTUAL*\n\n' +
                'Menciona o responde a alguien:\n' +
                '• #marry @persona\n' +
                '• Responder + #marry\n\n' +
                '> ¡No puedes casarte solo!'
            ));
        }

        const getNumber = (jid) => jid.split('@')[0].split(':')[0];

        const getName = async (jid) => {
            try {
                if (chatId.endsWith('@g.us')) {
                    const groupMetadata = await ctx.bot.groupMetadata(chatId);
                    const number = getNumber(jid);
                    const participant = groupMetadata.participants.find(p =>
                        getNumber(p.id) === number
                    );
                    return participant?.notify || participant?.name || number;
                }
            } catch (e) { }
            return getNumber(jid);
        };

        const name1 = await getName(sender);
        const name2 = await getName(partner);

        const ceremony = getRandom(CEREMONIES);
        const gift = getRandom(GIFTS);
        const future = getRandom(FUTURES);
        const loveScore = Math.floor(Math.random() * 51) + 50;

        const rings = '💍'.repeat(Math.floor(loveScore / 20));

        const text = `
ꕥ *¡BODA VIRTUAL!* 

👰 ${name1}
    ❤️ + 💕 + ❤️    
🤵 ${name2}

━━━━━━━━━━━━━
> *Lugar* » ${ceremony}
> *Regalo* » ${gift}
> *Futuro* » ${future}
${rings} *Amor* » ${loveScore}%
━━━━━━━━━━━━━

✨ Los declaro oficialmente
   casados virtuales ✨

> Que vivan felices por siempre~
`.trim();

        await ctx.bot.sendMessage(chatId, {
            text: styleText(text),
            mentions: [sender, partner]
        }, { quoted: msg });
    }
};
