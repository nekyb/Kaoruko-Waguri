import { extractMentions, getRandom, styleText } from '../lib/utils.js';

const ATTACKS = [
    { name: 'Golpe crítico', emoji: '👊', damage: [30, 50] },
    { name: 'Patada voladora', emoji: '🦵', damage: [25, 45] },
    { name: 'Kamehameha', emoji: '🔥', damage: [40, 60] },
    { name: 'Golpe de suerte', emoji: '🍀', damage: [10, 70] },
    { name: 'Combo devastador', emoji: '💥', damage: [35, 55] },
    { name: 'Headshot', emoji: '🎯', damage: [45, 65] },
    { name: 'Uppercut', emoji: '🤜', damage: [20, 40] },
    { name: 'Suplex', emoji: '🤼', damage: [30, 50] },
    { name: 'Mordida', emoji: '😬', damage: [15, 35] },
    { name: 'Rasguño de gato', emoji: '🐱', damage: [10, 25] },
    { name: 'Ataque con sartén', emoji: '🍳', damage: [20, 40] },
    { name: 'Bomba nuclear', emoji: '☢️', damage: [50, 80] },
    { name: 'Llaves de judo', emoji: '🥋', damage: [25, 45] },
    { name: 'Ataque psíquico', emoji: '🧠', damage: [30, 50] }
];

const MISS_MESSAGES = [
    'falló miserablemente y se cayó',
    'tropezó con una piedra',
    'se olvidó de atacar',
    'se distrajo viendo memes',
    'tuvo lag mental'
];

export default {
    commands: ['fight', 'pelea', 'pelear', 'batalla', 'vs'],

    async execute(ctx) {
        const { msg, sender, from, chatId } = ctx;
        const mentioned = extractMentions(ctx);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let opponent = null;
        if (mentioned.length > 0) {
            opponent = mentioned[0];
        } else if (quoted) {
            opponent = quoted;
        }
        if (!opponent || opponent === sender) {
            return await ctx.reply(styleText(
                'ꕥ *PELEA - Batalla Virtual*\n\n' +
                'Menciona o responde a alguien:\n' +
                '> • #fight @persona\n' +
                '> • Responder + #fight\n\n' +
                '> ¡No puedes pelear solo!'
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

        const player1 = { jid: sender, name: await getName(sender), hp: 100 };
        const player2 = { jid: opponent, name: await getName(opponent), hp: 100 };

        let battleLog = [];
        let turn = 0;

        while (player1.hp > 0 && player2.hp > 0 && turn < 10) {
            const attacker = turn % 2 === 0 ? player1 : player2;
            const defender = turn % 2 === 0 ? player2 : player1;

            const hitChance = Math.random();

            if (hitChance < 0.15) {
                battleLog.push(`▸ ${attacker.name} ${getRandom(MISS_MESSAGES)}`);
            } else {
                const attack = getRandom(ATTACKS);
                const damage = Math.floor(Math.random() * (attack.damage[1] - attack.damage[0])) + attack.damage[0];
                defender.hp = Math.max(0, defender.hp - damage);
                battleLog.push(`▸ ${attacker.name} usó *${attack.name}* ${attack.emoji} (-${damage}hp)`);
            }

            turn++;
        }

        const winner = player1.hp > player2.hp ? player1 : player2;
        const loser = player1.hp > player2.hp ? player2 : player1;

        const hpBar = (hp) => {
            const filled = Math.floor(hp / 10);
            const empty = 10 - filled;
            return '🟢'.repeat(filled) + '⚫'.repeat(empty);
        };

        const text = `
⚔️ *BATALLA ÉPICA*

👤 ${player1.name}
${hpBar(player1.hp)} ${player1.hp}hp

⚡ VS ⚡

👤 ${player2.name}
${hpBar(player2.hp)} ${player2.hp}hp

━━━━━━━━━━━━━
${battleLog.join('\n')}
━━━━━━━━━━━━━

🏆 *GANADOR: ${winner.name}*
💀 Perdedor: ${loser.name}
`.trim();

        await ctx.bot.sendMessage(chatId, {
            text: styleText(text),
            mentions: [sender, opponent]
        }, { quoted: msg });
    }
};
