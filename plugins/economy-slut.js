import { formatNumber, getCooldown, formatTime, getRandom } from '../lib/utils.js';

const ACTIVITIES = [
    'te pusiste en la zona rosa y un chirrete te compro',
    'fuiste parte de una pelicula',
    'te robaron fotos y lo subieron',
    'y señor de 40 te robo y te la metio',
    'te invitaron en un 2 pa 2',
    'te emborrachaste y te follaron',
    'DeltaByte te compro y te llevo a su casa'
];

export default {
    commands: ['slut'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
        }

        const COOLDOWN = 1.5 * 60 * 60 * 1000;
        const REWARD = Math.floor(Math.random() * 400) + 150;

        const userData = ctx.userData;
        const cooldown = getCooldown(userData.economy.lastSlut, COOLDOWN);

        if (cooldown > 0) {
            return await ctx.reply(`ꕤ Necesitas descansar.\nVuelve en: ${formatTime(cooldown)}`);
        }

        ctx.dbService.updateUser(ctx.sender, {
            'economy.lastSlut': Date.now(),
            'economy.coins': userData.economy.coins + REWARD
        });

        const activity = getRandom(ACTIVITIES);

        await ctx.reply(
            `ꕥ ${activity} y ganaste: *${formatNumber(REWARD)}* coins.`
        );
    }
};