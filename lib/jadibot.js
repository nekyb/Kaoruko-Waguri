import { Bot, LocalAuth } from '@imjxsx/wapi';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class JadibotManager {
    constructor() {
        this.subbots = new Map();
        this.codes = new Map();
    }

    generateCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    createCode(userId) {
        const code = this.generateCode();
        this.codes.set(code, { userId, createdAt: Date.now() });

        setTimeout(() => {
            this.codes.delete(code);
        }, 5 * 60 * 1000);

        return code;
    }

    async startSubbot(code, chatId, mainSock, phoneNumber = null) {
        let userId;

        if (phoneNumber) {
            // Normalize phone number and add WhatsApp suffix
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
            userId = `${cleanPhone}@s.whatsapp.net`;
        } else {
            const codeData = this.codes.get(code);
            if (!codeData) {
                return { success: false, message: 'ꕤ Código inválido o expirado' };
            }
            userId = codeData.userId;
        }

        // Extract clean phone number for file system operations
        const cleanUserId = userId.split('@')[0];

        if (this.subbots.has(userId)) {
            return { success: false, message: 'ꕤ Ya tienes un sub-bot activo' };
        }

        try {
            const authPath = path.join(process.cwd(), 'subbots', cleanUserId);
            if (!fs.existsSync(authPath)) {
                fs.mkdirSync(authPath, { recursive: true });
            }

            // Generate a valid UUID for the subbot
            const uuid = crypto.randomUUID();
            const auth = new LocalAuth(uuid, `subbots/${cleanUserId}`);
            const account = { jid: '', pn: '', name: '' };

            const bot = new Bot(uuid, auth, account);

            // Setup event listeners before login
            bot.on('qr', async (qr) => {
                if (!phoneNumber) {
                    await mainSock.sendMessage(chatId, {
                        image: await QRCode.toBuffer(qr, { scale: 8 }),
                        caption: 'ꕤ Escanea este código QR con WhatsApp\nEl sub-bot se conectará automáticamente'
                    });
                }
            });

            bot.on('code', async (code) => {
                if (phoneNumber) {
                    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

                    // Send formatted message with instructions
                    await mainSock.sendMessage(chatId, {
                        text: `ꕤ *Tu Código de Vinculación:*\n\n\`${formattedCode}\`\n\n1. Abre WhatsApp en tu celular\n2. Ve a Dispositivos Vinculados > Vincular dispositivo\n3. Toca "Vincular con número de teléfono" abajo\n4. Ingresa este código.`
                    });

                    // Send plain code in second message for easy copying
                    await mainSock.sendMessage(chatId, {
                        text: code
                    });
                }
            });

            bot.on('open', async (openAccount) => {
                this.subbots.set(userId, {
                    bot,
                    chatId,
                    authPath
                });

                await mainSock.sendMessage(chatId, {
                    text: `ꕥ Sub-bot conectado exitosamente: ${openAccount.name || 'Usuario'}`
                });

                if (code) this.codes.delete(code);

                this.setupSubbotHandlers(bot, userId, mainSock);
            });

            bot.on('close', async (reason) => {
                // Handle disconnection
                // The Bot class handles reconnection automatically usually, but we might want to clean up if it's a permanent logout
                console.log(`Subbot ${userId} closed: ${reason}`);
                if (reason === 'logged out') { // Check actual reason string from wapi
                    this.subbots.delete(userId);
                    await mainSock.sendMessage(chatId, { text: 'ꕤ Sub-bot desconectado (Cerró sesión)' });
                }
            });

            // Start the bot
            // If phoneNumber is provided, we use pairing code method
            if (phoneNumber) {
                // Use clean phone number for login
                await bot.login('code', cleanUserId);
            } else {
                await bot.login('qr');
            }

            return { success: true, message: 'ꕥ Iniciando sub-bot...' };

        } catch (error) {
            console.error('Error iniciando subbot:', error);
            return { success: false, message: 'ꕤ Error al iniciar sub-bot' };
        }
    }

    setupSubbotHandlers(subBot, userId, mainSock) {
        // We need to access the underlying socket to listen to messages
        // wapi Bot exposes .ws (the socket)
        subBot.ws.ev.on('messages.upsert', async ({ messages }) => {
            const m = messages[0];
            if (!m.message || m.key.fromMe) return;

            console.log(`Sub-bot ${userId} recibió mensaje`);

            // Here we could potentially forward messages or handle commands
            // For now, we just log to show it's working
        });
    }

    stopSubbot(userId) {
        const subbotData = this.subbots.get(userId);
        if (!subbotData) {
            return { success: false, message: 'ꕤ No tienes un sub-bot activo' };
        }

        try {
            // Close the bot connection
            // wapi Bot doesn't have a direct 'end' or 'logout' method exposed easily in documentation?
            // Assuming we can just kill the socket or if there is a method.
            // Looking at index.js, it seems we just let it be or process.exit. 
            // But for subbot we need to stop just one.

            // Try closing the socket directly
            if (subbotData.bot.ws) {
                subbotData.bot.ws.end(undefined);
            }

            this.subbots.delete(userId);

            return { success: true, message: 'ꕥ Sub-bot detenido' };
        } catch (error) {
            console.error('Error deteniendo subbot:', error);
            return { success: false, message: 'ꕤ Error al detener sub-bot' };
        }
    }

    getSubbots() {
        return Array.from(this.subbots.entries()).map(([userId, data]) => ({
            userId,
            chatId: data.chatId
        }));
    }
}

export const jadibotManager = new JadibotManager();
