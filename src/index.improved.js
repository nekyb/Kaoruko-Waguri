import QRCode from 'qrcode';
import { Bot, LocalAuth } from '@imjxsx/wapi';
import Logger from '@imjxsx/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseService } from './services/DatabaseService.js';
import { GachaService } from '../lib/GachaService.js';
import { SubBotOrchestrator } from './services/SubBotOrchestrator.js';
import { MessageQueue } from './services/MessageQueue.js';
import { EconomySeason } from './services/EconomySeason.js';
import { RateLimiter } from './services/RateLimiter.js';
import { PluginMarketplace } from './services/PluginMarketplace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger({ level: 'INFO' });

console.log('🚀 Iniciando Kaoruko Bot - Sistema Mejorado v2.0\n');

const uuid = '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713';
const auth = new LocalAuth(uuid, 'sessions');
const account = { jid: '', pn: '', name: '' };

const dbService = new DatabaseService();
const gachaService = new GachaService();
const subBotOrchestrator = new SubBotOrchestrator(dbService);
const messageQueue = new MessageQueue();
const economySeason = new EconomySeason(dbService);
const rateLimiter = new RateLimiter();
const pluginMarketplace = new PluginMarketplace(dbService);

global.db = dbService.load();
global.dbService = dbService;
global.gachaService = gachaService;
global.subBotOrchestrator = subBotOrchestrator;
global.messageQueue = messageQueue;
global.economySeason = economySeason;
global.rateLimiter = rateLimiter;
global.pluginMarketplace = pluginMarketplace;
global.plugins = {};
global.commandMap = new Map();

gachaService.load();

const botOwner = '573115434166@s.whatsapp.net';
global.botOwner = botOwner;

const bot = new Bot(uuid, auth, account, logger);

const loadPlugins = async () => {
    const pluginsPath = path.join(__dirname, '../plugins');
    const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith('.js'));

    console.log(`ꕤ Cargando ${files.length} plugins...\n`);

    for (const file of files) {
        try {
            const filePath = path.join(pluginsPath, file);
            const module = await import(filePath);
            const plugin = module.default;
            
            global.plugins[file] = plugin;
            
            if (plugin.commands) {
                plugin.commands.forEach(cmd => {
                    global.commandMap.set(cmd.toLowerCase(), plugin);
                });
            }
            
            console.log(`  ✓ ${file}`);
        } catch (error) {
            console.error(`  ✗ ${file}: ${error.message}`);
        }
    }
    console.log('');
};

await loadPlugins();

bot.on('qr', async (qr) => {
    qr = await QRCode.toString(qr, { type: 'terminal', small: true });
    console.log('\n📱 Escanea el código QR para conectar:\n');
    console.log(qr);
    console.log('\n✨ Esperando escaneo del código QR...\n');
});

bot.on('open', (accountInfo) => {
    bot.logger.info(`✅ Conexión exitosa! Bot @${accountInfo.name} (${accountInfo.pn}) activo`);
});

bot.on('close', (reason) => {
    bot.logger.warn(`❌ Conexión cerrada: ${reason}`);
});

bot.on('error', (err) => {
    bot.logger.error(`⚠️ Error: ${err.message}`);
});

bot.use(async (ctx, next) => {
    try {
        const sender = ctx.from?.jid || ctx.sender;
        const chatId = ctx.chat?.jid || ctx.chatId;
        
        if (!sender || !chatId) {
            return await next();
        }

        const isGroup = chatId.endsWith('@g.us');
        
        const userData = await dbService.getUser(sender);
        userData.stats.messages++;
        dbService.markDirty();

        if (isGroup) {
            await dbService.getGroup(chatId);
        }

        ctx.isGroup = isGroup;
        ctx.sender = sender;
        ctx.chatId = chatId;
        ctx.userData = userData;
        ctx.dbService = dbService;
        ctx.gachaService = gachaService;
        ctx.db = global.db;
        ctx.subBotOrchestrator = subBotOrchestrator;
        ctx.economySeason = economySeason;
        ctx.pluginMarketplace = pluginMarketplace;

        await next();
    } catch (error) {
        bot.logger.error(`Error en middleware: ${error.message}`);
    }
});

bot.command('ping', async (ctx) => {
    await ctx.reply(`> ¡Pong! \`\`\`${bot.ping.toFixed(2)} ms\`\`\``);
});

bot.on('message', async (ctx) => {
    try {
        const body = ctx.body || ctx.text || '';
        
        if (!body) return;
        
        if (!body.startsWith('#') && !body.startsWith('/')) return;

        const args = body.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const rateLimitCheck = await rateLimiter.checkCommandLimit(ctx.sender);
        if (!rateLimitCheck.allowed) {
            await ctx.reply(rateLimitCheck.message);
            return;
        }

        console.log(`ꕤ ${body[0]}${command} | ${ctx.sender.split('@')[0]}`);

        if (ctx.userData) {
            ctx.userData.stats.commands++;
            dbService.markDirty();
        }

        const plugin = global.commandMap.get(command);
        
        if (plugin) {
            try {
                ctx.args = args;
                ctx.command = command;
                ctx.body = body;
                
                if (messageQueue.enabled) {
                    await messageQueue.addCommand(ctx, plugin, command, 0);
                } else {
                    await plugin.execute(ctx);
                }
            } catch (error) {
                console.error(`ꕤ Error ejecutando plugin:`, error);
                await ctx.reply('ꕤ Ocurrió un error al ejecutar el comando.');
            }
        }
    } catch (error) {
        bot.logger.error(`Error procesando mensaje: ${error.message}`);
    }
});

bot.on('group.participant.add', async (ctx) => {
    try {
        const groupId = ctx.chat?.jid;
        if (!groupId) return;

        const groupSettings = (await dbService.getGroup(groupId)).settings;
        
        if (groupSettings.welcome) {
            for (const participant of ctx.participants) {
                await bot.sock.sendMessage(groupId, {
                    text: `ꕥ ¡Bienvenido/a @${participant.split('@')[0]} al grupo!`,
                    mentions: [participant]
                });
            }
        }
    } catch (error) {
        bot.logger.error(`Error en evento de grupo: ${error.message}`);
    }
});

setInterval(async () => {
    try {
        await messageQueue.cleanOldJobs(24);
    } catch (error) {
        console.error('Error limpiando trabajos antiguos:', error);
    }
}, 3600000);

await bot.login('qr');

console.log('\n✅ Bot iniciado correctamente');
console.log('📊 Características activas:');
console.log(`  • Redis Cache: ${dbService.redis ? '✓' : '✗'}`);
console.log(`  • Message Queue: ${messageQueue.enabled ? '✓' : '✗'}`);
console.log(`  • Sub-Bot Orchestrator: ✓`);
console.log(`  • Economy Seasons: ✓`);
console.log(`  • Plugin Marketplace: ✓`);
console.log('');
