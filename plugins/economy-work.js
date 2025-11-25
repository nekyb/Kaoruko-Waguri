
import { formatNumber, getCooldown, formatTime, getRandom } from '../lib/utils.js';

const JOBS = [
    'trabajaste en una panaderia',
    'repariste pizza',
    'hiciste un pastel',
    'vendiste carbón',
    'le serviste un café a un cliente',
    'diseñaste un logo para una empresa',
    'escribiste un documental de animales',
    'tocaste musica con una guitarra',
    'cortaste el cesped del jardin de tu vecina',
    'reparaste electrodomésticos',
    'creaste un phonk',
    'reparaste un ventilador',
    'arreglaste una radio',
    'creaste una aplicación para android',
    'hiciste una cirujia a una señora',
    'le contaste una vulnerabilidad a Google',
    'creaste un sistema operativo'
];

export default {
    commands: ['work', 'w'],

    async execute(ctx) {
        if (ctx.isGroup && !ctx.dbService.getGroup(ctx.chatId).settings.economy) {
            return await ctx.reply('ꕤ El sistema de economía está desactivado en este grupo.');
        }

        const COOLDOWN = 1 * 60 * 1000; // 1 minute
        const REWARD = Math.floor(Math.random() * 300) + 100;
        const userData = ctx.userData;
        const cooldown = getCooldown(userData.economy.lastWork, COOLDOWN);
        if (cooldown > 0) {
            return await ctx.reply(
                `ꕤ Estás cansado, descansa un poco.\nVuelve en: ${formatTime(cooldown)}`
            );
        }

        // Update user data in database
        ctx.dbService.updateUser(ctx.sender, {
            'economy.lastWork': Date.now(),
            'economy.coins': userData.economy.coins + REWARD
        });

        const job = getRandom(JOBS);
        await ctx.reply(
            `*ꕥ* ${job} y ganaste *${formatNumber(REWARD)}* coins.`
        );
    }
};
