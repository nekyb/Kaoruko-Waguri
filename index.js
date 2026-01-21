import { Bot, LocalAuth } from '@imjxsx/wapi'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

import DatabaseService from './lib/DatabaseService.js'
import GachaService from './lib/GachaService.js'
import StreamManager from './lib/StreamManager.js'
import QueueManager from './lib/QueueManager.js'
import CacheManager from './lib/CacheManager.js'
import TokenService from './lib/TokenService.js'
import PrembotManager from './lib/PrembotManager.js'
import { ShopService } from './lib/ShopService.js'
import { LevelService } from './lib/LevelService.js'
import { MessageHandler } from './lib/MessageHandler.js'
import { WelcomeHandler } from './lib/WelcomeHandler.js'
import { setupCommandWorker } from './workers/commandWorker.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.on('uncaughtException', err => console.error(err))
process.on('unhandledRejection', err => console.error(err))

const dbService = new DatabaseService()
const gachaService = new GachaService()
const streamManager = new StreamManager()
const queueManager = new QueueManager()
const cacheManager = new CacheManager()
const tokenService = new TokenService()
const prembotManager = new PrembotManager(tokenService)
const shopService = new ShopService(dbService)
const levelService = new LevelService(dbService)

await dbService.load()
await gachaService.load()
await tokenService.load()

global.dbService = dbService
global.gachaService = gachaService
global.streamManager = streamManager
global.queueManager = queueManager
global.cacheManager = cacheManager
global.tokenService = tokenService
global.prembotManager = prembotManager
global.shopService = shopService
global.levelService = levelService
global.commandMap = new Map()
global.beforeHandlers = []

const messageHandler = new MessageHandler(
  dbService,
  gachaService,
  streamManager,
  queueManager,
  cacheManager,
  shopService,
  levelService
)

const welcomeHandler = new WelcomeHandler(dbService)

const UUID = '1f1332f4-7c2a-4b88-b4ca-bd56d07ed713'
const auth = new LocalAuth(UUID, 'sessions')
const account = { jid: '', pn: '', name: '' }
const bot = new Bot(UUID, auth, account)

const pluginsDir = path.join(__dirname, 'plugins')
const pluginFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

for (const file of pluginFiles) {
  const filePath = pathToFileURL(path.join(pluginsDir, file)).href
  const plugin = await import(filePath)
  const p = plugin.default
  if (!p || typeof p.execute !== 'function' || !Array.isArray(p.commands)) continue
  if (typeof p.before === 'function') {
    global.beforeHandlers.push({ plugin: file, handler: p.before })
  }
  for (const cmd of p.commands) {
    global.commandMap.set(cmd.toLowerCase().trim(), {
      execute: p.execute,
      plugin: file
    })
  }
}

bot.on('qr', async qr => {
  const qrText = await QRCode.toString(qr, { type: 'terminal' })
  console.log(qrText)
})

bot.on('open', acc => {
  console.log(acc?.name || 'Bot conectado')
})

bot.ws.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    messageHandler.handleMessage(bot, m).catch(() => {})
  }
})

bot.ws.ev.on('group-participants.update', async event => {
  welcomeHandler.handle(bot, event).catch(() => {})
})

bot.on('close', reason => console.log(reason))
bot.on('error', err => console.error(err))

setupCommandWorker(bot, {
  dbService,
  gachaService,
  streamManager,
  queueManager,
  cacheManager,
  tokenService,
  prembotManager,
  shopService,
  levelService
})

const shutdown = async () => {
  await dbService.gracefulShutdown()
  await gachaService.gracefulShutdown()
  await tokenService.gracefulShutdown()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

await bot.login('qr')
