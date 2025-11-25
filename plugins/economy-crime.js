import { formatNumber, getCooldown, formatTime, getRandom } from '../lib/utils.js';

const CRIMES = [
    'robaste una computadora',
    'entraste ala casa de alguien',
    'asaltaste un banco',
    'robaste criptomonedas',
    'fuiste al metro y robaste celulares',
    'fuiste a una joyeria y ',
    'robaste la mona lisa',
    'robaste un paquete de un camion de carga',
    'hackeaste una corporación',
    'robaste una caja de pastillas'
];

export default {
    commands: ['crime', 'crimen'],

    async execute(ctx) {
        const COOLDOWN = 3600000;
        const userData = ctx.userData;
        const now = Date.now();

        const cooldown = getCooldown(userData.economy?.lastCrime, COOLDOWN);
        if (cooldown > 0) {
            return await ctx.reply(`ꕤ Debes esperar *${formatTime(cooldown)}* antes de cometer otro crimen.`);
        }

        const success = Math.random() > 0.5;
        const crime = getRandom(CRIMES);

        if (success) {
            const earned = Math.floor(Math.random() * 500) + 200;

            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': (userData.economy?.coins || 0) + earned,
                'economy.lastCrime': now
            });

            await ctx.reply(`ꕥ ¡${crime}! Ganaste *${formatNumber(earned)}* coins.`);
        } else {
            const lost = Math.floor(Math.random() * 300) + 100;
            const currentCoins = userData.economy?.coins || 0;
            const newCoins = Math.max(0, currentCoins - lost);

            ctx.dbService.updateUser(ctx.sender, {
                'economy.coins': newCoins,
                'economy.lastCrime': now
            });

            await ctx.reply(`ꕤ ¡Te atraparon cuando ${crime}! Perdiste *${formatNumber(lost)}* coins.`);
        }
    }
};