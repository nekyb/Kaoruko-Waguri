import { isAdmin, styleText } from '../lib/utils.js';

export default {
    commands: ['porn'],

    async execute(ctx) {
        const { chatId, sender, args, isGroup, bot } = ctx;
        if (!isGroup) {
            return await ctx.reply(styleText('ꕤ Este comando solo funciona en grupos.'));
        }
        const admin = await isAdmin(bot.sock, chatId, sender);
        if (!admin) {
            return await ctx.reply(styleText('ꕤ Solo los administradores pueden usar este comando.'));
        }
        if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
            return await ctx.reply(styleText('ꕤ Uso » *#porn* <on/off>'));
        }
        const enable = args[0].toLowerCase() === 'on';
        if (!global.db?.groups?.[chatId]) {
            global.db.groups = global.db.groups || {};
            global.db.groups[chatId] = { settings: {} };
        }
        if (!global.db.groups[chatId].settings) {
            global.db.groups[chatId].settings = {};
        }
        global.db.groups[chatId].settings.porn = enable;
        await ctx.reply(styleText(`ꕤ Comandos NSFW ${enable ? 'activados' : 'desactivados'}.`));
    }
};
