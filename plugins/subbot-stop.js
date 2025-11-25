import { jadibotManager } from '../lib/jadibot.js';

export default {
    commands: ['stopjadibot', 'stopbot'],

    async execute(ctx) {
        const result = jadibotManager.stopSubbot(ctx.sender);
        await ctx.reply(result.message);
    }
};
