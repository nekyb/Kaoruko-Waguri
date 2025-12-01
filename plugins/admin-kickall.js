import { isAdmin, isBotAdmin } from '../lib/utils.js';

export default {
    commands: ['kickall', 'eliminaratodos'],
    tags: ['admin'],
    help: ['kickall'],

    async execute(ctx) {
        const { isGroup, chatId, sender, bot } = ctx;

        if (!isGroup) {
            return await ctx.reply('ꕤ Este comando solo funciona en grupos.');
        }

        const senderIsAdmin = await isAdmin(bot, chatId, sender);
        if (!senderIsAdmin) {
            return await ctx.reply('ꕤ Solo los administradores pueden usar este comando.');
        }

        const botIsAdmin = await isBotAdmin(bot, chatId);
        if (!botIsAdmin) {
            return await ctx.reply('ꕤ Necesito ser administrador para eliminar miembros.');
        }

        try {
            const metadata = await bot.groupMetadata(chatId);
            const participants = metadata.participants;
            const botLid = bot.sock.user?.lid?.split(':')[0]?.split('@')[0];
            const botNumber = bot.sock.user?.id?.split(':')[0]?.split('@')[0];
            const toKick = participants.filter(p => {
                if (p.admin === 'admin' || p.admin === 'superadmin') return false;
                const participantId = p.id.split(':')[0].split('@')[0];
                if (participantId === botLid || participantId === botNumber) return false;
                return true;
            });

            if (toKick.length === 0) {
                return await ctx.reply('ꕤ No hay miembros para eliminar (solo hay administradores).');
            }

            await ctx.reply(`⚠️ *Iniciando eliminación masiva*\n📊 Eliminando ${toKick.length} miembros...`);
            const batchSize = 5;
            let kicked = 0;
            let failed = 0;

            for (let i = 0; i < toKick.length; i += batchSize) {
                const batch = toKick.slice(i, i + batchSize);
                const jids = batch.map(p => p.id);

                try {
                    await bot.groupParticipantsUpdate(chatId, jids, 'remove');
                    kicked += jids.length;
                    if (i + batchSize < toKick.length) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (error) {
                    console.error('Error eliminando batch:', error);
                    failed += jids.length;
                }
            }

            await ctx.reply(`✅ *Eliminación completada*\n• Eliminados: ${kicked}\n• Fallidos: ${failed}`);

        } catch (error) {
            console.error('Error en kickall:', error);
            await ctx.reply('ꕤ Error al eliminar miembros del grupo.');
        }
    }
};
