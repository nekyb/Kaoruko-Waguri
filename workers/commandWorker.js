import { styleText, styleMessage } from '../lib/utils.js'
import { ERRORS } from '../lib/constants.js'

export function setupCommandWorker(bot, services) {
  const queue = services.queueManager.getQueue('commandQueue')

  queue.process(async job => {
    try {
      const { commandName, ctxData } = job.data
      const name = commandName?.toLowerCase().trim()
      const commandData = global.commandMap.get(name)
      if (!commandData) return

      const styled = styleMessage(
        ctxData.msg?.pushName || 'Usuario',
        ctxData.text
      )

      const replyBuilder = async payload => {
        if (payload.text) {
          payload.text = `${styled}\n\n${payload.text}`
        }
        if (payload.caption) {
          payload.caption = `${styled}\n\n${payload.caption}`
        }
        return bot.ws.sendMessage(
          ctxData.chatId,
          payload,
          { quoted: ctxData.msg }
        )
      }

      const ctx = {
        ...services,
        ...ctxData,
        bot: {
          sendMessage: (jid, content, options) =>
            bot.ws.sendMessage(jid, content, options),
          sock: bot.ws,
          groupMetadata: jid => bot.ws.groupMetadata(jid),
          groupParticipantsUpdate: (jid, participants, action) =>
            bot.ws.groupParticipantsUpdate(jid, participants, action)
        },
        reply: text => replyBuilder({ text }),
        replyWithImage: (url, options = {}) =>
          replyBuilder({ image: { url }, ...options }),
        replyWithVideo: (url, options = {}) =>
          replyBuilder({ video: { url }, ...options }),
        replyWithAudio: (url, options = {}) =>
          replyBuilder({ audio: { url }, mimetype: 'audio/mpeg', ...options }),
        download: async message => {
          const msg = message || ctxData.msg
          const type = Object.keys(msg.message)[0]
          const content = msg.message[type]
          const stream = await bot.ws.downloadContentFromMessage(
            content,
            type.replace('Message', '')
          )
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }
          return buffer
        },
        userData: ctxData.userData || {}
      }

      await commandData.execute(ctx)

      ctx.userData.stats = ctx.userData.stats || {}
      ctx.userData.stats.commands =
        (ctx.userData.stats.commands || 0) + 1

      services.dbService.markDirty()
    } catch {
      try {
        await bot.ws.sendMessage(
          job.data.ctxData.chatId,
          { text: styleText(ERRORS.GENERIC_ERROR) },
          { quoted: job.data.ctxData.msg }
        )
      } catch {}
    }
  })
}
