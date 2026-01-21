import { PREFIXES, RATE_LIMIT, ERRORS } from './constants.js'
import { styleText, styleMessage } from './utils.js'

export class MessageHandler {
  constructor(dbService, gachaService, streamManager, queueManager, cacheManager, shopService, levelService) {
    this.dbService = dbService
    this.gachaService = gachaService
    this.streamManager = streamManager
    this.queueManager = queueManager
    this.cacheManager = cacheManager
    this.shopService = shopService
    this.levelService = levelService
    this.PREFIX = '#'
    this.prefixes = Array.from(new Set([this.PREFIX, ...(PREFIXES || [])]))
    this.rateLimitMap = new Map()
    this.processedMessages = new Map()
    setInterval(() => this.cleanup(), 30000)
  }

  cleanup() {
    const now = Date.now()
    for (const [userId, data] of this.rateLimitMap) {
      if (now - data.lastCommand > RATE_LIMIT.SPAM_WINDOW) {
        this.rateLimitMap.delete(userId)
      }
    }
    for (const [msgId, timestamp] of this.processedMessages) {
      if (now - timestamp > 5000) {
        this.processedMessages.delete(msgId)
      }
    }
  }

  checkRateLimit(userId) {
    const now = Date.now()
    let userData = this.rateLimitMap.get(userId)
    if (!userData) {
      this.rateLimitMap.set(userId, { lastCommand: now, count: 1, timeout: null })
      return { limited: false }
    }
    if (userData.timeout && now < userData.timeout) {
      return { limited: true, message: ERRORS.SPAM_DETECTED }
    } else if (userData.timeout) {
      userData.timeout = null
      userData.count = 0
    }
    if (now - userData.lastCommand < RATE_LIMIT.COMMAND_COOLDOWN) {
      userData.count++
      if (userData.count >= RATE_LIMIT.SPAM_THRESHOLD) {
        userData.timeout = now + RATE_LIMIT.SPAM_TIMEOUT
        return { limited: true, message: ERRORS.SPAM_DETECTED }
      }
      return { limited: true, message: ERRORS.RATE_LIMITED }
    }
    userData.count = now - userData.lastCommand > RATE_LIMIT.SPAM_WINDOW ? 1 : userData.count + 1
    userData.lastCommand = now
    return { limited: false }
  }

  isDuplicate(messageId) {
    if (this.processedMessages.has(messageId)) return true
    this.processedMessages.set(messageId, Date.now())
    return false
  }

  async handleMessage(bot, m) {
    if (!m.message) return

    const messageType = Object.keys(m.message)[0]
    let text = ''
    if (messageType === 'conversation') text = m.message.conversation
    else if (messageType === 'extendedTextMessage') text = m.message.extendedTextMessage?.text || ''
    else if (messageType === 'imageMessage') text = m.message.imageMessage?.caption || ''
    else if (messageType === 'videoMessage') text = m.message.videoMessage?.caption || ''

    if (!text) return
    if (m.key.fromMe) return
    if (this.isDuplicate(m.key.id)) return

    const prefix = this.prefixes.find(p => text.startsWith(p))
    if (!prefix) return

    const chatId = m.key.remoteJid
    let sender = m.key.participant || m.key.remoteJid
    if (sender.includes('@lid')) {
      const match = sender.match(/^(\d+)/)
      if (match) sender = `${match[1]}@s.whatsapp.net`
    }

    const rateCheck = this.checkRateLimit(sender)
    if (rateCheck.limited) return

    const args = text.slice(prefix.length).trim().split(/\s+/)
    const commandName = args.shift()?.toLowerCase()
    if (!commandName) return

    const commandData = global.commandMap.get(commandName)
    if (!commandData) {
      await bot.sock.sendMessage(chatId, {
        text: styleText(`(ó﹏ò｡) El comando *${commandName}* no existe.`)
      }, { quoted: m })
      return
    }

    await this.queueManager.addJob('commandQueue', {
      commandName,
      ctxData: {
        msg: m,
        sender,
        chatId,
        body: text,
        text,
        args,
        prefix
      }
    })
  }
}
