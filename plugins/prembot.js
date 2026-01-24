import { styleText } from '../lib/utils.js';

export default {
    commands: ['prembot'],

    async execute(ctx) {
        const { args } = ctx;
        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || subCommand === 'help') {
            return await ctx.reply(styleText(
                `ꕥ *PREMBOT - Sub-Bot Premium*\n\n` +
                `*Comandos disponibles:*\n\n` +
                `> *#prembot buy*\n` +
                `>   Comprar token ($13 USD)\n\n` +
                `> *#prembot TOKEN-XXXX*\n` +
                `>   Vincular con tu token\n\n` +
                `> *#prembot status*\n` +
                `>   Ver estado de tu Prembot\n\n` +
                `> *#prembot stop*\n` +
                `>   Detener tu Prembot\n\n` +
                `> _Los Prembots tienen todas las funciones premium_`
            ));
        }


        
        if (subCommand === 'generate' && args[1] === 'token') {
            if (!ctx.isOwner) {
                return await ctx.reply(styleText('❌ No tienes permiso para usar este comando.'));
            }
            const tokenService = ctx.tokenService;
            const token = tokenService.createToken(ctx.sender, '30d');
            
            await ctx.reply(
                styleText(`ꕥ *Token Generado*\n\n` +
                `> *ID* » `) + `\`${token.id}\`` + styleText(`\n` +
                `> *Duración* » 30 días\n\n` +
                `> _Usa #prembot_ `) + token.id + styleText(` _para activar_`)
            );
            return;
        }

        if (subCommand === 'buy') {
            const tokenService = ctx.tokenService;

            if (!tokenService?.paypal?.clientId) {
                return await ctx.reply(styleText(
                    `ꕥ *PREMBOT - Comprar Token*\n\n` +
                    `> *Precio:* $13 USD\n` +
                    `> *Duración:* 30 días\n\n` +
                    `*Métodos de pago:*\n\n` +
                    `> *PayPal:* paypal.me/\n\n` +
                    `*Después de pagar:*\n` +
                    `> 1. Envía captura del pago al owner\n` +
                    `> 2. El owner te enviará tu token\n` +
                    `> 3. Usa #prembot TOKEN-XXXX para vincular\n\n` +
                    `> _Contacta al owner para más info_`
                ));
            }
            await ctx.reply(styleText('ꕤ Generando enlace de pago...'));
            try {
                const userId = ctx.senderPhone ? `${ctx.senderPhone}@s.whatsapp.net` : ctx.sender;
                const result = await tokenService.createPayPalOrder(userId);
                if (result.success) {
                    await ctx.reply(
                        styleText(`ꕥ *PREMBOT - Pago PayPal*\n\n` +
                        `> *Precio* » *$13 USD*\n` +
                        `> *Order* » `) + result.orderId + styleText(`\n\n` +
                        `*Haz clic para pagar:*\n` +
                        `> `) + result.approvalUrl + styleText(`\n\n` +
                        `*> Después de pagar:*\n` +
                        `> Envía "#prembot verify `) + result.orderId + styleText(`"\n\n` +
                        `> _El enlace expira en 3 horas_`)
                    );
                } else {
                    await ctx.reply(styleText(`❌ Error: ${result.error}`));
                }
            } catch (error) {
                await ctx.reply(styleText(
                    `ꕥ *PREMBOT - Comprar Token*\n\n` +
                    `> *Precio* » $13 USD\n\n` +
                    `> PayPal no está configurado.\n` +
                    `> Contacta al owner para comprar.`
                ));
            }
            return;
        }
        if (subCommand === 'verify' && args[1]) {
            const tokenService = ctx.tokenService;
            const orderId = args[1];
            await ctx.reply(styleText('ꕤ Verificando pago...'));
            try {
                const result = await tokenService.capturePayPalOrder(orderId);
                if (result.success) {
                    const payment = tokenService.getPayment(orderId);
                    await ctx.reply(
                        styleText(`ꕥ *Pago verificado*\n\n` +
                        `> *Tu Token* » \n`) +
                        `\`${payment.tokenId}\`` + styleText(`\n\n` +
                        `*Ahora ejecuta:*\n` +
                        `> #prembot `) + payment.tokenId + styleText(`\n\n` +
                        `> _El token es válido por 30 días_`)
                    );
                } else {
                    await ctx.reply(styleText(`ꕤ Pago no completado » ${result.error || 'Verifica que hayas pagado'}`));
                }
            } catch (error) {
                await ctx.reply(styleText(`ꕤ Error verificando » ${error.message}`));
            }
            return;
        }

        if (subCommand === 'status') {
            const prembotManager = ctx.prembotManager;
            const userId = ctx.senderPhone ? `${ctx.senderPhone}@s.whatsapp.net` : ctx.sender;
            const status = prembotManager?.getPrembotStatus(userId);
            if (!status) {
                return await ctx.reply(styleText(
                    `ꕤ No tienes un Prembot activo.\n\n` +
                    `> Usa #prembot buy para comprar uno.`
                ));
            }
            const statusIcon = status.active ? '🟢' : '🔴';
            const bannedText = status.banned ? '⛔ BANEADO' : '';

            await ctx.reply(styleText(
                `ꕥ *PREMBOT - Estado*\n\n` +
                `${statusIcon} *Estado:* ${status.active ? 'Activo' : 'Inactivo'} ${bannedText}\n` +
                `> *Expira* » ${status.expiresAt}\n` +
                `> *Días restantes* » ${status.daysRemaining}\n\n` +
                `> Estadísticas:*\n` +
                `> • Mensajes » ${status.stats.messages}\n` +
                `> • Comandos » ${status.stats.commands}\n\n` +
                `> *Límites* » \n` +
                `> • Grupos » ${status.limits.groups}\n` +
                `> • Cmds/min » ${status.limits.commandsPerMin}`
            ));
            return;
        }

        if (subCommand === 'stop') {
            const prembotManager = ctx.prembotManager;
            const userId = ctx.senderPhone ? `${ctx.senderPhone}@s.whatsapp.net` : ctx.sender;
            const result = prembotManager?.stopPrembot(userId);
            if (result?.success) {
                await ctx.reply(styleText(result.message));
            } else {
                await ctx.reply(styleText(result?.message || 'ꕤ No tienes un Prembot activo'));
            }
            return;
        }

        if (subCommand.startsWith('token-')) {
            const tokenId = subCommand.toUpperCase();
            const phone = ctx.senderPhone;

            if (!phone || phone.length < 10) {
                return await ctx.reply(styleText(
                    'ꕤ No se detectó tu número de teléfono.\n' +
                    '> Intenta desde un chat privado con el bot.'
                ));
            }
            const tokenService = ctx.tokenService;
            const prembotManager = ctx.prembotManager;
            const validation = tokenService?.validateToken(tokenId);
            if (!validation?.valid) {
                return await ctx.reply(styleText(`ꕤ ${validation?.error || 'Token inválido'}`));
            }
            await ctx.reply(styleText(`ꕤ Iniciando vinculación para ${phone}...`));
            const result = await prembotManager.startPrembot(
                tokenId,
                ctx.chatId,
                ctx.bot,
                phone
            );
            if (!result.success) {
                await ctx.reply(styleText(result.message));
            }
            return;
        }

        await ctx.reply(styleText(
            `ꕤ Comando no reconocido.\n\n` +
            `> Usa *#prembot help* para ver comandos.`
        ));
    }
};
