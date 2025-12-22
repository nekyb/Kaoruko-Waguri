import { isAdmin, isBotAdmin, extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['kick'],

    async execute(ctx) {
        console.log(`[AdminKick] ========== INICIANDO COMANDO KICK ==========`);
        console.log(`[AdminKick] Sender: ${ctx.sender}`);
        console.log(`[AdminKick] SenderLid: ${ctx.senderLid}`);
        console.log(`[AdminKick] ChatId: ${ctx.chatId}`);
        console.log(`[AdminKick] isGroup: ${ctx.isGroup}`);

        if (!ctx.isGroup) {
            return await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        // Usar senderLid para verificación de admin (los participantes del grupo usan LID)
        const userIdForAdmin = ctx.senderLid || ctx.sender;
        console.log(`[AdminKick] Verificando si el usuario es admin con ID: ${userIdForAdmin}`);
        const admin = await isAdmin(ctx.bot, ctx.chatId, userIdForAdmin);
        console.log(`[AdminKick] ¿Usuario es admin?: ${admin}`);

        if (!admin) {
            return await ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }

        // Verificar si el bot es admin
        console.log(`[AdminKick] Verificando si el bot es admin...`);
        const botAdmin = await isBotAdmin(ctx.bot, ctx.chatId);
        console.log(`[AdminKick] ¿Bot es admin?: ${botAdmin}`);

        if (!botAdmin) {
            return await ctx.reply(styleText('ꕤ Necesito ser administrador para expulsar usuarios.'));
        }

        const mentions = extractMentions(ctx);
        console.log(`[AdminKick] Menciones encontradas:`, mentions);

        if (mentions.length === 0) {
            return await ctx.reply(styleText('ꕤ Debes mencionar al usuario a expulsar.\n\n> _Uso: #kick @usuario_'));
        }

        try {
            const groupMetadata = await ctx.bot.groupMetadata(ctx.chatId);
            console.log(`[AdminKick] Participantes en grupo: ${groupMetadata.participants.length}`);

            for (const mentionedUser of mentions) {
                try {
                    const phoneNumber = mentionedUser.split('@')[0].split(':')[0];
                    console.log(`[AdminKick] Buscando usuario con número: ${phoneNumber}`);

                    const participant = groupMetadata.participants.find(p => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === phoneNumber;
                    });

                    if (!participant) {
                        console.log(`[AdminKick] Usuario no encontrado en el grupo`);
                        await ctx.reply(styleText(`ꕤ No se encontró al usuario @${phoneNumber} en el grupo.`), {
                            mentions: [mentionedUser]
                        });
                        continue;
                    }

                    console.log(`[AdminKick] Usuario encontrado: ${participant.id}, admin: ${participant.admin}`);

                    // No permitir kickear admins
                    if (participant.admin === 'admin' || participant.admin === 'superadmin') {
                        await ctx.reply(styleText(`ꕤ No puedo expulsar a @${phoneNumber} porque es administrador.`), {
                            mentions: [participant.id]
                        });
                        continue;
                    }

                    await ctx.bot.groupParticipantsUpdate(ctx.chatId, [participant.id], 'remove');
                    console.log(`[AdminKick] Usuario expulsado exitosamente`);

                    await ctx.reply(styleText(`ꕥ @${phoneNumber} ha sido expulsado del grupo.`), {
                        mentions: [participant.id]
                    });
                } catch (error) {
                    console.error('[AdminKick] Error expulsando usuario:', error);
                    await ctx.reply(styleText('ꕤ Error al expulsar al usuario: ' + error.message));
                }
            }
        } catch (error) {
            console.error('[AdminKick] Error obteniendo metadata:', error);
            await ctx.reply(styleText('ꕤ Error al obtener información del grupo: ' + error.message));
        }

        console.log(`[AdminKick] ========== FIN COMANDO KICK ==========`);
    }
};

