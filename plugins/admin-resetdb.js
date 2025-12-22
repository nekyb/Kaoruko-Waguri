import { styleText } from '../lib/utils.js';

export default {
    commands: ['resetdb', 'cleardb'],

    async execute(ctx) {
        console.log('[DEBUG] admin-resetdb: Inicio del comando');
        console.log('[DEBUG] admin-resetdb: sender:', ctx.sender);

        // Extraer el número del sender (funciona con @s.whatsapp.net y @lid)
        const senderNumber = ctx.sender.split('@')[0].split(':')[0];
        const ownerNumber = '573115434166'; // Tu número de WhatsApp

        console.log('[DEBUG] admin-resetdb: senderNumber:', senderNumber);
        console.log('[DEBUG] admin-resetdb: ownerNumber:', ownerNumber);

        // Solo el owner puede usar este comando
        if (senderNumber !== ownerNumber) {
            console.log('[DEBUG] admin-resetdb: Usuario no es owner');
            return await ctx.reply(styleText('⛔ Solo el owner puede usar este comando.'));
        }

        try {
            console.log('[DEBUG] admin-resetdb: Iniciando reseteo de base de datos');

            // Contar usuarios y grupos antes de eliminar
            const usersCount = Object.keys(ctx.dbService.users).length;
            const groupsCount = Object.keys(ctx.dbService.groups).length;

            console.log('[DEBUG] admin-resetdb: Usuarios antes:', usersCount);
            console.log('[DEBUG] admin-resetdb: Grupos antes:', groupsCount);

            // FIX: LocalDB no usa deleteMany como Prisma
            // Limpiar directamente los objetos
            ctx.dbService.users = {};
            ctx.dbService.groups = {};

            console.log('[DEBUG] admin-resetdb: Objetos limpiados');

            // Marcar como dirty para guardar cambios
            ctx.dbService.markDirty();
            console.log('[DEBUG] admin-resetdb: Marcado como dirty');

            // Forzar guardado inmediato
            await ctx.dbService.save();
            console.log('[DEBUG] admin-resetdb: Guardado forzado completado');

            await ctx.reply(styleText(
                `✅ *Base de datos reseteada*\n\n` +
                `👥 Usuarios eliminados: ${usersCount}\n` +
                `📱 Grupos eliminados: ${groupsCount}\n\n` +
                `La base de datos está ahora vacía.`
            ));
        } catch (error) {
            console.error('[DEBUG] admin-resetdb: Error completo:', error);
            console.error('[DEBUG] admin-resetdb: Stack trace:', error.stack);
            await ctx.reply(styleText('❌ Error al resetear la base de datos: ' + error.message));
        }
    }
};
