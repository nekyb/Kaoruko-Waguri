import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const DARES = [
    'Envía un audio diciendo "soy el más lindo del grupo"',
    'Cambia tu foto de perfil por una vergonzosa por 1 hora',
    'Envía un sticker de amor al admin',
    'Escribe "Te amo" a la última persona que te envió mensaje',
    'Haz 10 flexiones y envía video',
    'Canta una canción y envía audio',
    'Cuenta un secreto vergonzoso',
    'Envía una selfie haciendo cara graciosa',
    'Declara tu amor al bot',
    'Escribe tu nombre con el codo',
    'Envía un meme del grupo al grupo',
    'Haz un baile y envía video',
    'Di algo bonito de todos en el grupo',
    'Imita a tu cantante favorito',
    'Cuenta tu peor cita',
    'Envía tu última foto de galería',
    'Haz una impresión de un animal',
    'Crea un poema en 30 segundos',
    'Envía un audio cantando reggaeton',
    'Di 5 cosas que te gustan de ti'
];

const TRUTHS = [
    '¿Cuál es tu crush actual?',
    '¿Cuál fue tu momento más vergonzoso?',
    '¿Has stalkeado a alguien? ¿A quién?',
    '¿Cuál es tu mayor miedo?',
    '¿Has mentido hoy? ¿Sobre qué?',
    '¿Cuántas veces has sido friendzoneado?',
    '¿Cuál es tu secreto más grande?',
    '¿Has copiado en un examen?',
    '¿Qué es lo más tonto que has hecho por amor?',
    '¿Tienes una foto vergonzosa guardada?',
    '¿Cuál es tu fantasía más loca?',
    '¿Has enviado mensaje a alguien equivocado?',
    '¿Cuál es tu peor hábito?',
    '¿Has llorado por alguien del grupo?',
    '¿Qué opinas realmente del admin?',
    '¿Has hecho ghosting a alguien?',
    '¿Cuál es tu canción culposa?',
    '¿Has robado algo? ¿Qué?',
    '¿Cuánto tiempo pasas en el baño con el celular?',
    '¿Cuál es tu excusa más usada?'
];

export default {
    commands: ['dare', 'reto', 'truth', 'verdad', 'tod'],

    async execute(ctx) {
        const { msg, sender, from, chatId, command } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let target = null
        if (mentioned.length > 0) {
            target = mentioned[0];
        } else if (quoted) {
            target = quoted;
        } else {
            target = sender;
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
        const targetName = await getName(target);
        const senderName = await getName(sender);
        const isTruth = ['truth', 'verdad'].includes(command);
        const isDare = ['dare', 'reto'].includes(command);
        const isRandom = command === 'tod';
        let choice;
        if (isRandom) {
            choice = Math.random() > 0.5 ? 'truth' : 'dare';
        } else {
            choice = isTruth ? 'truth' : 'dare';
        }
        const text = choice === 'truth'
            ? getRandom(TRUTHS)
            : getRandom(DARES);

        const emoji = choice === 'truth' ? '❓' : '🔥';
        const title = choice === 'truth' ? 'VERDAD' : 'RETO';

        const response = `
${emoji} *${title}* ${emoji}

👤 *Para:* ${targetName}
🎯 *De:* ${senderName}

━━━━━━━━━━━━━
${text}
━━━━━━━━━━━━━

> ¡No puedes negarte!
`.trim();

        await ctx.bot.sendMessage(chatId, {
            text: styleText(response),
            mentions: [target]
        }, { quoted: msg });
    }
};
