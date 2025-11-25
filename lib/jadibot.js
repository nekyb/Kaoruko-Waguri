import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

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

    async startSubbot(code, chatId, mainSock) {
        const codeData = this.codes.get(code);
        if (!codeData) {
            return { success: false, message: 'ꕤ Código inválido o expirado' };
        }

        const userId = codeData.userId;

        if (this.subbots.has(userId)) {
            return { success: false, message: 'ꕤ Ya tienes un sub-bot activo' };
        }

        try {
            const authPath = path.join(process.cwd(), 'subbots', userId);
            if (!fs.existsSync(authPath)) {
                fs.mkdirSync(authPath, { recursive: true });
            }

            // Use standard Baileys with multi-file auth state
            const { state, saveCreds } = await useMultiFileAuthState(authPath);
            const { version } = await fetchLatestBaileysVersion();

            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }),
                browser: ['Kaoruko Sub-Bot', 'Chrome', '1.0.0']
            });

            // Save credentials on update
            sock.ev.on('creds.update', saveCreds);

            return new Promise((resolve) => {
                sock.ev.on('connection.update', async (update) => {
                    const { connection, lastDisconnect, qr } = update;

                    if (qr) {
                        await mainSock.sendMessage(chatId, {
                            image: await this.generateQRImage(qr),
                            caption: 'ꕤ Escanea este código QR con WhatsApp\nEl sub-bot se conectará automáticamente'
                        });
                    }

                    if (connection === 'open') {
                        this.subbots.set(userId, {
                            sock,
                            chatId,
                            authPath
                        });

                        await mainSock.sendMessage(chatId, {
                            text: 'ꕥ Sub-bot conectado exitosamente'
                        });

                        this.codes.delete(code);

                        this.setupSubbotHandlers(sock, userId, mainSock);

                        resolve({ success: true, message: 'ꕥ Sub-bot conectado' });
                    }

                    if (connection === 'close') {
                        const statusCode = lastDisconnect?.error?.output?.statusCode;
                        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                        if (!shouldReconnect) {
                            this.subbots.delete(userId);
                            if (chatId) {
                                await mainSock.sendMessage(chatId, {
                                    text: 'ꕤ Sub-bot desconectado'
                                });
                            }
                        }
                    }
                });

                setTimeout(() => {
                    if (!this.subbots.has(userId)) {
                        resolve({ success: false, message: 'ꕤ Tiempo de espera de inicialización agotado (pero puede seguir intentando en segundo plano)' });
                    }
                }, 60000);
            });

        } catch (error) {
            console.error('Error iniciando subbot:', error);
            return { success: false, message: 'ꕤ Error al iniciar sub-bot' };
        }
    }

    setupSubbotHandlers(sock, userId, mainSock) {
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const m = messages[0];
            if (!m.message || m.key.fromMe) return;

            console.log(`Sub-bot ${userId} recibió mensaje`);
            // Here you would add logic to handle messages for the subbot
            // For now, just logging.
        });
    }

    async generateQRImage(qr) {
        const QRCode = await import('qrcode');
        return await QRCode.toBuffer(qr, { scale: 8 });
    }

    stopSubbot(userId) {
        const subbotData = this.subbots.get(userId);
        if (!subbotData) {
            return { success: false, message: 'ꕤ No tienes un sub-bot activo' };
        }

        try {
            // Close the Baileys socket connection
            subbotData.sock.end();
            this.subbots.delete(userId);

            // Optionally clean up session files
            // if (subbotData.authPath && fs.existsSync(subbotData.authPath)) {
            //     fs.rmSync(subbotData.authPath, { recursive: true, force: true });
            // }

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
