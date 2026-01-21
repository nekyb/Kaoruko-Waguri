import QRCode from 'qrcode'
import { Bot, LocalAuth } from '@imjxsx/wapi'
import Logger from '@imjxsx/logger'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { DatabaseService } from './services/DatabaseService.js'
import { GachaService } from '../lib/GachaService.js'
import { SubBotOrchestrator } from './services/SubBotOrchestrator.js'
import { MessageQueue } from './services/MessageQueue.js'
import { EconomySeason } from './services/EconomySeason.js'
import { RateLimiter } from './services/RateLimiter.js'
import { PluginMarketplace } from './services/PluginMarketplace.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = new Logger({ level: 'INFO' })

const uuid = '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713'
const auth = new LocalAuth(uuid, 'sessions')
const account = { jid: '', pn: '', name: '' }

const dbService = new DatabaseService()
const gachaService = new GachaService()
const subBotOrchestrator = new SubBotOrchestrator(dbService)
const messageQueue = new MessageQueue()
const economySeason = new EconomySeason(dbService)
const rateLimiter = new RateLimiter()
const pluginMarketplace = new PluginMarketplace(dbService)

await dbService.load()
await gachaService.load()

global.dbService = dbService
global.gachaService = gachaService
global.subBotOrchestrator = subBotOrchestrator
global.messageQueue = messageQueue
global.economySeason = economySeason
global.rateLimiter = rateLimiter
global.pluginMarketplace = pluginMarketplace
global.plugins = {}
global.commandMap = new Map()

const botOwner = '573115434166@s.whatsapp.net'
global.botOwner = botOwner

const bot = new Bot(uuid, auth, account, logger)

const loadPlugins = async () => {
  const pluginsPath = path.join(__dirname, '../plugins')
  const files = fs.readdirSync(pluginsPath).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const fileUrl = pathToFileURL(path.join(pluginsPath, file)).href
      const module = await import(fileUrl)
      const plugin = module.default
      if (!plugin || typeof plugin.execute !== 'function' || !Array.isArray(plugin.commands)) continue
      global.plugins[file] = plugin
      for (const cmd of plugin.commands) {
        global.commandMap.set(cmd.toLowerCase().trim(), plugin)
      }
    } catch {}
  }
}

await loadPlugins()

bot.on('qr', async qr => {
  const qrText = await QRCode.toString(qr, { type: 'terminal' })
  console.log(qrText)
})

bot.on('open', acc => {
  bot.logger.info(`Conectado: ${acc?.name || 'Bot'}`)
})

bot.use(async (ctx, next) => {
  const sender = ctx.from?.jid || ctx.sender
  const chatId = ctx.chat?.jid || ctx.chatId
  if (!sender || !chatId) return next()

  const isGroup = chatId.endsWith('@g.us')
  const userData = await dbService.getUser(sender)

  userData.stats = userData.stats || {}
  userData.stats.messages = (userData.stats.messages || 0) + 1

  if (isGroup) await dbService.getGroup(chatId)

  ctx.sender = sender
  ctx.chatId = chatId
  ctx.isGroup = isGroup
  ctx.userData = userData
  ctx.dbService = dbService
  ctx.gachaService = gachaService
  ctx.subBotOrchestrator = subBotOrchestrator
  ctx.economySeason = economySeason
  ctx.pluginMarketplace = pluginMarketplace

  dbService.markDirty()
  await next()
})

bot.on('message', async ctx => {
  const body = ctx.body || ctx.text || ''
  if (!body) return
  if (!body.startsWith('#') && !body.startsWith('/')) return

  const args = body.slice(1).trim().split(/ +/)
  const command = args.shift().toLowerCase().trim()

  const rate = await rateLimiter.checkCommandLimit(ctx.sender)
  if (!rate.allowed) return ctx.reply(rate.message)

  ctx.userData.stats.commands = (ctx.userData.stats.commands || 0) + 1
  dbService.markDirty()

  const plugin = global.commandMap.get(command)
  if (!plugin) return

  ctx.args = args
  ctx.command = command
  ctx.body = body

  if (messageQueue.enabled) {
    await messageQueue.addCommand(ctx, plugin, command, 0)
  } else {
    await plugin.execute(ctx)
  }
})

bot.on('group.participant.add', async ctx => {
  const groupId = ctx.chat?.jid
  if (!groupId) return
  const group = await dbService.getGroup(groupId)
  if (!group.settings?.welcome) return

  for (const user of ctx.participants) {
    await bot.sock.sendMessage(groupId, {
      text: `ꕥ ¡Bienvenido/a @${user.split('@')[0]}!`,
      mentions: [user]
    })
  }
})

setInterval(async () => {
  await messageQueue.cleanOldJobs(24)
}, 3600000)

await bot.login('qr')
