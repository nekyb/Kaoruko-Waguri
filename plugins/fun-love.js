import { styleText } from '../lib/utils.js';

export default {
    commands: ['love', 'amor', 'ship'],
    tags: ['fun'],
    help: ['love @user'],

    async execute(ctx) {
        const { msg, bot, text } = ctx
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
        const sender = ctx.sender

        let target = ''
        if (mentionedJid && mentionedJid.length > 0) {
            target = mentionedJid[0]
        } else if (text) {
            // Handle text name? For now just require mention
            return await ctx.reply(styleText('ꕤ Etiqueta a alguien para calcular el amor.'))
        } else {
            return await ctx.reply(styleText('ꕤ Etiqueta a alguien para calcular el amor.'))
        }

        const percentage = Math.floor(Math.random() * 101)
        let message = ''

        if (percentage < 25) {
            message = '💔 No hay futuro aquí...'
        } else if (percentage < 50) {
            message = '😐 Podría funcionar con esfuerzo.'
        } else if (percentage < 75) {
            message = '❤️ Hay buena química.'
        } else {
            message = '💖 ¡Son almas gemelas!'
        }

        const response = `*Calculadora de Amor* 💘\n\n` +
            `🔻 *${sender.split('@')[0]}* + *${target.split('@')[0]}*\n` +
            `📊 *Porcentaje:* ${percentage}%\n` +
            `📝 *Resultado:* ${message}`

        await ctx.reply(styleText(response), { mentions: [sender, target] })
    }
}
