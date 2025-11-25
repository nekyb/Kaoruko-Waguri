import { isAdmin, isBotAdmin, extractMentions } from '../lib/utils.js';

export default {
    commands: ['kick'],

    async execute(ctx) {
        console.log('[DEBUG] admin-kick: Inicio del comando');
        console.log('[DEBUG] admin-kick: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-kick: sender:', ctx.sender);
        console.log('[DEBUG] admin-kick: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-kick: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        // FIX: Usar ctx.sender en lugar de ctx.from.id para consistencia
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-kick: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-kick: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        console.log('[DEBUG] admin-kick: isBotAdmin resultado:', botAdmin);

        if (!botAdmin) {
            console.log('[DEBUG] admin-kick: Bot no es admin');
            return await ctx.reply('ꕤ Necesito ser administrador para expulsar usuarios.');
        }

        const mentions = extractMentions(ctx);
        console.log('[DEBUG] admin-kick: Menciones extraídas:', mentions);

        if (mentions.length === 0) {
            console.log('[DEBUG] admin-kick: No se encontraron menciones');
            return await ctx.reply('ꕤ Debes mencionar al usuario a expulsar.');
        }

        try {
            // Get group metadata to find correct participant IDs
            const groupMetadata = await ctx.bot.sock.groupMetadata(ctx.chatId);
            console.log('[DEBUG] admin-kick: Participantes totales:', groupMetadata.participants.length);

            for (const mentionedUser of mentions) {
                try {
                    // Extract phone number from mention (e.g., "573115434166@s.whatsapp.net" -> "573115434166")
                    const phoneNumber = mentionedUser.split('@')[0].split(':')[0];
                    console.log('[DEBUG] admin-kick: Buscando número:', phoneNumber);

                    // Find the participant in the group with matching phone number
                    const participant = groupMetadata.participants.find(p => {
                        const participantNumber = p.id.split('@')[0].split(':')[0];
                        return participantNumber === phoneNumber;
                    });

                    if (!participant) {
                        console.log('[DEBUG] admin-kick: Participante NO encontrado:', phoneNumber);
                        await ctx.reply(`ꕤ No se encontró al usuario @${phoneNumber} en el grupo.`);
                        continue;
                    }

                    console.log('[DEBUG] admin-kick: Expulsando usuario:', participant.id);
                    await ctx.bot.sock.groupParticipantsUpdate(ctx.chatId, [participant.id], 'remove');
                    console.log('[DEBUG] admin-kick: Usuario expulsado exitosamente');

                    await ctx.reply(`ꕥ @${phoneNumber} ha sido expulsado del grupo.`, {
                        mentions: [participant.id]
                    });
                } catch (error) {
                    console.error('[DEBUG] admin-kick: Error expulsando usuario:', error);
                    await ctx.reply('ꕤ Error al expulsar al usuario: ' + error.message);
                }
            }
        } catch (error) {
            console.error('[DEBUG] admin-kick: Error obteniendo metadata:', error);
            await ctx.reply('ꕤ Error al obtener información del grupo: ' + error.message);
        }
    }
};
