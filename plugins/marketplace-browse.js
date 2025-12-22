import { styleText } from '../lib/utils.js';

export default {
    commands: ['marketplace', 'market', 'tienda'],
    category: 'plugins',
    description: 'Explorar el marketplace de plugins',
    usage: '#marketplace [search|buy|publish]',

    async execute(ctx) {
        const [action, ...params] = ctx.args;

        if (!action || action === 'browse') {
            const plugins = await ctx.pluginMarketplace.searchPlugins('', 'downloads');

            if (plugins.length === 0) {
                return await ctx.reply(styleText('📦 El marketplace aún está vacío.\nUsa #marketplace publish para publicar el primer plugin!'));
            }

            let message = '🛒 *MARKETPLACE DE PLUGINS*\n\n';

            plugins.slice(0, 5).forEach((plugin, index) => {
                message += `${index + 1}. *${plugin.name}*\n`;
                message += `   ${plugin.description}\n`;
                message += `   💰 ${plugin.price} monedas | ⬇️ ${plugin.downloads} | ⭐ ${plugin.rating}\n\n`;
            });

            message += `\nComandos:\n`;
            message += `#marketplace search <término>\n`;
            message += `#marketplace buy <ID>\n`;
            message += `#marketplace publish`;

            return await ctx.reply(styleText(message));
        }

        if (action === 'search') {
            const query = params.join(' ');
            if (!query) {
                return await ctx.reply(styleText('⚠️ Uso: #marketplace search <término>'));
            }

            const plugins = await ctx.pluginMarketplace.searchPlugins(query, 'downloads');

            if (plugins.length === 0) {
                return await ctx.reply(styleText(`❌ No se encontraron plugins para "${query}"`));
            }

            let message = `🔍 Resultados para "${query}":\n\n`;

            plugins.forEach((plugin, index) => {
                message += `${index + 1}. *${plugin.name}*\n`;
                message += `   ${plugin.description}\n`;
                message += `   💰 ${plugin.price} | ⭐ ${plugin.rating}\n\n`;
            });

            return await ctx.reply(styleText(message));
        }

        if (action === 'buy') {
            const pluginId = params[0];
            if (!pluginId) {
                return await ctx.reply(styleText('⚠️ Uso: #marketplace buy <ID>'));
            }

            try {
                const result = await ctx.pluginMarketplace.purchasePlugin(ctx.sender, pluginId);
                await ctx.reply(styleText(`✅ ${result.message}\n\nEl plugin está ahora disponible en tu bot.`));
            } catch (error) {
                await ctx.reply(styleText(`❌ ${error.message}`));
            }
            return;
        }

        if (action === 'publish') {
            await ctx.reply(styleText(
                '📝 *Publicar Plugin*\n\n' +
                'Para publicar un plugin, proporciona:\n' +
                '1. Nombre\n2. Descripción\n3. Precio (en monedas)\n4. Código del plugin\n\n' +
                'Contacta al administrador del bot para más información.'
            ));
            return;
        }

        if (action === 'my') {
            const userPlugins = await ctx.pluginMarketplace.getUserPlugins(ctx.sender);

            let message = '📦 *MIS PLUGINS*\n\n';
            message += `💰 Ingresos totales: ${userPlugins.totalRevenue}\n\n`;

            if (userPlugins.purchased.length > 0) {
                message += `✅ Comprados (${userPlugins.purchased.length}):\n`;
                userPlugins.purchased.forEach(p => {
                    message += `  • ${p.name}\n`;
                });
                message += '\n';
            }

            if (userPlugins.published.length > 0) {
                message += `📝 Publicados (${userPlugins.published.length}):\n`;
                userPlugins.published.forEach(p => {
                    message += `  • ${p.name} (${p.downloads} descargas)\n`;
                });
            }

            if (userPlugins.purchased.length === 0 && userPlugins.published.length === 0) {
                message += 'No tienes plugins aún.\nExplora el marketplace con #marketplace';
            }

            return await ctx.reply(styleText(message));
        }

        await ctx.reply(styleText('Uso: #marketplace [browse|search|buy|publish|my]'));
    }
};
