export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
};

export const getMentions = (text) => {
    const matches = text.match(/@(\d+)/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1) + '@s.whatsapp.net');
};

import { groupMetadataCache } from './GroupMetadataCache.js';

export const isAdmin = async (bot, chatId, userId) => {
    try {
        const sock = bot.sock || bot;
        const groupMetadata = await groupMetadataCache.get(sock, chatId);

        // FIX: Extraer número base para comparar independientemente del dominio
        // userId puede venir como "170893057728762@s.whatsapp.net"
        // pero el participante puede estar como "170893057728762@lid" o "170893057728762:55@lid"
        const userNumber = userId.split('@')[0].split(':')[0];
        console.log(`[DEBUG] isAdmin: Buscando número base:`, userNumber);

        const participant = groupMetadata.participants.find(p => {
            const participantNumber = p.id.split('@')[0].split(':')[0];
            return participantNumber === userNumber;
        });

        console.log(`[DEBUG] isAdmin: Participante encontrado:`, participant?.id);
        console.log(`[DEBUG] isAdmin: Admin status para ${userId} en ${chatId}:`, participant?.admin);

        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error(`[DEBUG] Error in isAdmin:`, error);
        return false;
    }
};

export const isBotAdmin = async (bot, chatId) => {
    try {
        const sock = bot.sock || bot;
        const groupMetadata = await groupMetadataCache.get(sock, chatId);

        // For linked devices, WhatsApp uses LID (Linked Device ID) in group participants
        // Extract the base LID without the device number (e.g., "84564265443395:2@lid" -> "84564265443395")
        const botLid = sock.user?.lid?.split(':')[0]?.split('@')[0];
        const botNumber = sock.user?.id?.split(':')[0]?.split('@')[0];

        console.log(`[DEBUG] Bot user object:`, sock.user);
        console.log(`[DEBUG] Bot LID: ${botLid}, Bot number: ${botNumber}`);

        // Try to find the bot in participants
        // Participants can be in format: "84564265443395@lid" or "573209287160@s.whatsapp.net"
        const participant = groupMetadata.participants.find(p => {
            const participantId = p.id.split(':')[0].split('@')[0];
            // Match by LID first (for linked devices), then by phone number
            return participantId === botLid || participantId === botNumber;
        });

        console.log(`[DEBUG] isBotAdmin - Found participant:`, participant);

        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch (error) {
        console.error(`[DEBUG] Error in isBotAdmin:`, error);
        return false;
    }
};

export const getBuffer = async (url) => {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
};

export const getRandom = (list) => {
    return list[Math.floor(Math.random() * list.length)];
};

export const getGroupAdmins = (participants) => {
    return participants.filter(p => p.admin).map(p => p.id);
};

export const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

export const getCooldown = (lastTime, cooldownMs) => {
    const now = Date.now();
    const timeLeft = lastTime + cooldownMs - now;
    return timeLeft > 0 ? timeLeft : 0;
};

export const extractMentions = (ctx) => {
    const mentioned = ctx.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned;

    const matches = (ctx.body || ctx.text || '').match(/@(\d+)/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1) + '@s.whatsapp.net');
};

export const isOwner = (userId, ownerNumber = '573115434166@s.whatsapp.net') => {
    return userId === ownerNumber;
};

export const formatCoins = (amount) => {
    return amount.toLocaleString('es-ES');
};

export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
