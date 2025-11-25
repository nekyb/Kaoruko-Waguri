import { isAdmin, isBotAdmin, extractMentions } from '../lib/utils.js';

export default {
    commands: ['demote'],

    async execute(ctx) {
        console.log('[DEBUG] admin-demote: Inicio del comando');
        console.log('[DEBUG] admin-demote: isGroup:', ctx.isGroup);
        console.log('[DEBUG] admin-demote: sender:', ctx.sender);
        console.log('[DEBUG] admin-demote: chatId:', ctx.chatId);

        if (!ctx.isGroup) {
            console.log('[DEBUG] admin-demote: Comando usado fuera de un grupo');
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        // FIX: Usar ctx.sender en lugar de ctx.from.id para consistencia
        const admin = await isAdmin(ctx.bot.sock, ctx.chatId, ctx.sender);
        console.log('[DEBUG] admin-demote: isAdmin resultado:', admin);

        if (!admin) {
            console.log('[DEBUG] admin-demote: Usuario no es admin');
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        const botAdmin = await isBotAdmin(ctx.bot.sock, ctx.chatId);
        console.log('[DEBUG] admin-demote: isBotAdmin resultado:', botAdmin);

        if (!botAdmin) {
            console.log('[DEBUG] admin-demote: Bot no es admin');
            return await ctx.reply('ꕤ Necesito ser administrador para degradar usuarios.');
        }

        const mentions = extractMentions(ctx);
        console.log('[DEBUG] admin-demote: Menciones extraídas:', mentions);

        if (mentions.length === 0) {
            console.log('[DEBUG] admin-demote: No se encontraron menciones');
            return await ctx.reply('ꕤ Debes mencionar al usuario a degradar.');
        }

        try {
            // Get group metadata to find correct participant IDs
            const groupMetadata = await ctx.bot.sock.groupMetadata(ctx.chatId);
            console.log('[DEBUG] admin-demote: Participantes totales:', groupMetadata.participants.length);

            const participantIds = [];

            for (const mentionedUser of mentions) {
                const phoneNumber = mentionedUser.split('@')[0].split(':')[0];
                console.log('[DEBUG] admin-demote: Buscando número:', phoneNumber);

                const participant = groupMetadata.participants.find(p => {
                    const participantNumber = p.id.split('@')[0].split(':')[0];
                    return participantNumber === phoneNumber;
                });

                if (participant) {
                    console.log('[DEBUG] admin-demote: Participante encontrado:', participant.id);
                    participantIds.push(participant.id);
                } else {
                    console.log('[DEBUG] admin-demote: Participante NO encontrado para:', phoneNumber);
                }
            }

            if (participantIds.length === 0) {
                console.log('[DEBUG] admin-demote: No se encontraron participantes válidos');
                return await ctx.reply('ꕤ No se encontró al usuario mencionado en el grupo.');
            }

            console.log('[DEBUG] admin-demote: Degradando usuarios:', participantIds);
            await ctx.bot.sock.groupParticipantsUpdate(ctx.chatId, participantIds, 'demote');
            console.log('[DEBUG] admin-demote: Usuario degradado exitosamente');

            await ctx.reply(`ꕥ @${participantIds[0].split('@')[0]} ya no es administrador.`, {
                mentions: participantIds
            });
        } catch (error) {
            console.error('[DEBUG] admin-demote: Error completo:', error);
            await ctx.reply('ꕤ Error al degradar al usuario: ' + error.message);
        }
    }
};
