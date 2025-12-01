import { Bot, LocalAuth } from '@imjxsx/wapi';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import DatabaseService from './lib/DatabaseService.js';
import GachaService from './lib/GachaService.js';
import StreamManager from './lib/StreamManager.js';
import QueueManager from './lib/QueueManager.js';
import CacheManager from './lib/CacheManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Global Error Handlers ---
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- Services Initialization ---
const dbService = new DatabaseService();
const gachaService = new GachaService();
const streamManager = new StreamManager();
const queueManager = new QueueManager();
const cacheManager = new CacheManager();

global.db = await dbService.load();
global.dbService = dbService;
global.gachaService = gachaService;
global.streamManager = streamManager;
global.queueManager = queueManager;
global.cacheManager = cacheManager;
global.streamManager = streamManager;
global.queueManager = queueManager;
global.cacheManager = cacheManager;
global.commandMap = new Map();
global.beforeHandlers = [];

await gachaService.load();

// --- Bot Configuration ---
const UUID = '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713';
const auth = new LocalAuth(UUID, 'kaoruko-session');
const account = { jid: '', pn: '', name: '' };
const OWNER_JID = '573115434166@s.whatsapp.net';
const PREFIX = '#';

const bot = new Bot(UUID, auth, account);

// --- Plugin Loader ---
const pluginsDir = path.join(__dirname, 'plugins');
const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

console.log(`ꕤ Cargando ${pluginFiles.length} plugins...`);

for (const file of pluginFiles) {
    try {
        const filePath = pathToFileURL(path.join(pluginsDir, file)).href;
        const plugin = await import(filePath);
        const pluginExport = plugin.default;

        if (pluginExport && pluginExport.commands) {
            // Optimization: Store before handler separately
            if (pluginExport.before && typeof pluginExport.before === 'function') {
                global.beforeHandlers.push({
                    plugin: file,
                    handler: pluginExport.before
                });
            }

            for (const cmd of pluginExport.commands) {
                global.commandMap.set(cmd, {
                    execute: pluginExport.execute,
                    plugin: file
                });
            }
            console.log(`ꕥ Plugin cargado: ${file}`);
        }
    } catch (error) {
        console.error(`ꕤ Error cargando plugin ${file}:`, error.message);
    }
}

// --- Event Handlers ---
console.log('📌 Registrando event handlers...');

bot.on('qr', async (qr) => {
    console.log('\n✨ Escanea este código QR con WhatsApp ✨\n');
    const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
    console.log(qrString);
});

bot.on('open', (account) => {
    console.log('🎉 EVENTO OPEN DISPARADO!');
    console.log('✅ Conexión exitosa!');
    console.log(`📱 Bot conectado: ${account.name || 'Kaoruko Waguri'}`);

    bot.ws.ev.on('messages.upsert', async ({ messages, type }) => {
        // console.log(`📨 Received ${messages.length} messages, type: ${type}`);

        for (const m of messages) {
            try {
                // Skip own messages
                if (!m.message || m.key.fromMe) {
                    continue;
                }

                const chatId = m.key.remoteJid;
                let sender = m.key.participant || m.key.remoteJid;

                // Convert LID to normal JID if needed
                if (sender.includes('@lid')) {
                    const lidMatch = sender.match(/^(\d+)/);
                    if (lidMatch) {
                        const lidNumber = lidMatch[1];
                        sender = `${lidNumber}@s.whatsapp.net`;
                    }
                }

                const isGroup = chatId.endsWith('@g.us');

                // Extract text
                const messageType = Object.keys(m.message)[0];
                let text = '';
                if (messageType === 'conversation') {
                    text = m.message.conversation;
                } else if (messageType === 'extendedTextMessage') {
                    text = m.message.extendedTextMessage?.text || '';
                } else if (messageType === 'imageMessage') {
                    text = m.message.imageMessage?.caption || '';
                } else if (messageType === 'videoMessage') {
                    text = m.message.videoMessage?.caption || '';
                }

                // Build context EARLY
                const ctx = {
                    bot: {
                        sendMessage: async (jid, content, options) => {
                            return await bot.ws.sendMessage(jid, content, options);
                        },
                        sock: bot.ws,
                        groupMetadata: async (jid) => {
                            return await bot.ws.groupMetadata(jid);
                        },
                        groupParticipantsUpdate: async (jid, participants, action) => {
                            return await bot.ws.groupParticipantsUpdate(jid, participants, action);
                        }
                    },
                    msg: m,
                    sender: sender,
                    chatId: chatId,
                    isGroup: isGroup,
                    body: text,
                    text: text, // Alias for compatibility
                    args: [],
                    userData: dbService.getUser(sender),
                    dbService: dbService,
                    gachaService: gachaService,
                    streamManager: streamManager,
                    queueManager: queueManager,
                    cacheManager: cacheManager,
                    from: {
                        id: sender,
                        jid: sender,
                        name: m.pushName || 'Usuario'
                    },
                    reply: async (text, options = {}) => {
                        return await bot.ws.sendMessage(chatId, { text, ...options }, { quoted: m });
                    },
                    replyWithAudio: async (url, options = {}) => {
                        return await bot.ws.sendMessage(chatId, {
                            audio: { url },
                            mimetype: options.mimetype || 'audio/mpeg',
                            fileName: options.fileName
                        }, { quoted: m });
                    },
                    replyWithVideo: async (url, options = {}) => {
                        return await bot.ws.sendMessage(chatId, {
                            video: { url },
                            caption: options.caption,
                            fileName: options.fileName
                        }, { quoted: m });
                    },
                    replyWithImage: async (url, options = {}) => {
                        return await bot.ws.sendMessage(chatId, {
                            image: { url },
                            caption: options.caption
                        }, { quoted: m });
                    },
                    download: async (message) => {
                        // Import dynamically to avoid top-level dependency issues if possible, 
                        // or assume it's available since we saw it in node_modules
                        const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                        return await downloadMediaMessage(message || m, 'buffer', {}, {
                            logger: console,
                            reuploadRequest: bot.ws.updateMediaMessage
                        });
                    },
                    prefix: PREFIX
                };

                // 1. Run 'before' handlers from all plugins
                // Optimization: Use pre-calculated array
                for (const { handler, plugin } of global.beforeHandlers) {
                    try {
                        await handler(ctx);
                    } catch (err) {
                        console.error(`Error in before handler for ${plugin}:`, err);
                    }
                }

                // 2. Process Commands
                const PREFIXES = ['/', '!', '#'];
                const prefix = PREFIXES.find(p => text.startsWith(p));

                if (!text || !prefix) {
                    continue;
                }

                // Parse command and args
                const args = text.slice(prefix.length).trim().split(/\s+/);
                const commandName = args.shift()?.toLowerCase();
                ctx.args = args;
                ctx.command = commandName;

                if (!commandName) continue;

                // Find command
                const commandData = global.commandMap.get(commandName);
                if (!commandData) {
                    continue;
                }

                // Execute plugin
                // console.log(`✨ Ejecutando comando: ${commandName} de ${ctx.from.name}`);
                await commandData.execute(ctx);
                // console.log(`✅ Comando ${commandName} ejecutado exitosamente`);

            } catch (error) {
                console.error('ꕤ Error procesando mensaje:', error);
                const chatId = m.key.remoteJid;
                try {
                    await bot.ws.sendMessage(chatId, {
                        text: 'ꕤ Ocurrió un error al ejecutar el comando.'
                    }, { quoted: m });
                } catch { }
            }
        }
    });
});

bot.on('close', (reason) => {
    console.log('⚠️ Conexión cerrada:', reason);
});

bot.on('error', (err) => {
    console.error('❌ Error del bot:', err);
});

// --- Graceful Shutdown ---
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} recibido. Cerrando gracefully...`);
    await dbService.gracefulShutdown();
    await gachaService.gracefulShutdown();
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// --- Start Bot ---
console.log('🚀 Iniciando bot con @imjxsx/wapi...');
await bot.login('qr');
