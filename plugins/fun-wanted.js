import axios from 'axios'
import { styleText } from '../lib/utils.js';

export default {
    commands: ['wanted', 'sebusca'],
    tags: ['fun'],
    help: ['wanted @usuario', 'wanted (responde a mensaje)'],

    async execute(ctx) {
        const { msg, bot, chatId } = ctx
        try {
            let targetJid
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
            if (mentionedJid && mentionedJid.length > 0) { targetJid = mentionedJid[0] }
            else if (msg.message?.extendedTextMessage?.contextInfo?.participant) { targetJid = msg.message.extendedTextMessage.contextInfo.participant }
            else { targetJid = ctx.sender }
            let profilePicUrl
            try {
                profilePicUrl = await bot.sock.profilePictureUrl(targetJid, 'image')
            } catch {
                profilePicUrl = 'https://i.ibb.co/3Fh9V6p/avatar-contact.png'
            }

            const wantedUrl = `https://api.popcat.xyz/wanted?image=${encodeURIComponent(profilePicUrl)}`
            await bot.sock.sendMessage(chatId, {
                image: { url: wantedUrl },
                caption: styleText(`🚨 *SE BUSCA* 🚨\n\n⚠️ Usuario: @${targetJid.split('@')[0]}\n💰 Recompensa: 1,000,000 coins`),
                mentions: [targetJid]
            }, { quoted: msg })
        } catch (error) {
            console.error('Error en wanted:', error)
            await ctx.reply(styleText('ꕤ Error al crear el poster. Intenta de nuevo.'))
        }
    }
}