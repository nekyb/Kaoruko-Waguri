import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['code', 'jadibot'],

    async execute(ctx) {
        const code = jadibotManager.createCode(ctx.sender);

        await ctx.reply(
            `ꕤ *Código de Sub-Bot*\n\n` +
            `Tu código de 8 dígitos:\n\n` +
            `Este código expira en 5 minutos.\n` +
            `Usa #qr ${code} para obtener el QR de conexión.`
        );

        // Send code in a separate message for easy copying
        await ctx.reply(code);
    }
};
