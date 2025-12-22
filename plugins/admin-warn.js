import { isBotAdmin, isAdmin, extractMentions, styleText } from '../lib/utils.js';

export default {
    commands: ['warn', 'advertir', 'unwarn', 'delwarn'],
    tags: ['admin'],
    help: ['warn @user', 'unwarn @user'],

    async execute(ctx) {
        const { bot, chatId, isGroup, args, sender, command, reply, dbService } = ctx;
        const conn = bot?.sock;

        if (!isGroup) {
            return await reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }

        if (!await isAdmin(conn, chatId, sender)) {
            return await reply(styleText('ꕤ Necesitas ser administrador para usar este comando.'));
        }

        const mentioned = extractMentions(ctx);
        const quoted = ctx.msg.message?.extendedTextMessage?.contextInfo?.participant;
        let targetUser = null;

        if (mentioned.length > 0) {
            targetUser = mentioned[0];
        } else if (quoted) {
            targetUser = quoted;
        }

        if (!targetUser) {
            return await reply(styleText('ꕤ Por favor etiqueta o responde al usuario.'));
        }

        if (await isAdmin(conn, chatId, targetUser)) {
            return await reply(styleText('ꕤ No puedo advertir a un administrador.'));
        }

        const userData = dbService.getUser(targetUser);
        if (!userData.warns) userData.warns = 0;

        const isUnwarn = ['unwarn', 'delwarn'].includes(command);

        if (isUnwarn) {
            if (userData.warns > 0) {
                userData.warns -= 1;
                dbService.markDirty();
                await reply(styleText(`✅ Advertencia eliminada para @${targetUser.split('@')[0]}\nAdvertencias actuales: ${userData.warns}/3`), { mentions: [targetUser] });
            } else {
                await reply(styleText('ꕤ El usuario no tiene advertencias.'));
            }
        } else {
            userData.warns += 1;
            dbService.markDirty();

            const reason = args.slice(1).join(' ') || 'Sin razón especificada';
            const warns = userData.warns;

            if (warns >= 3) {
                await reply(styleText(`⚠️ *Usuario Eliminado* ⚠️\n\n@${targetUser.split('@')[0]} ha acumulado 3 advertencias.\n\n> Motivo última advertencia: ${reason}`), { mentions: [targetUser] });

                if (await isBotAdmin(conn, chatId)) {
                    await conn.groupParticipantsUpdate(chatId, [targetUser], 'remove');
                    userData.warns = 0; // Reset warns on kick
                    dbService.markDirty();
                } else {
                    await reply(styleText('ꕤ No puedo eliminar al usuario porque no soy administrador.'));
                }
            } else {
                await reply(styleText(
                    `⚠️ *Advertencia Agregada* ⚠️\n\n` +
                    `👤 Usuario: @${targetUser.split('@')[0]}\n` +
                    `📄 Razón: ${reason}\n` +
                    `🔢 Advertencias: ${warns}/3\n\n` +
                    `> _Acumular 3 advertencias resultará en expulsión._`
                ), { mentions: [targetUser] });
            }
        }
    }
};
