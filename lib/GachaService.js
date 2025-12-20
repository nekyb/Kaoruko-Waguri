import { LocalDB } from '@imjxsx/localdb'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class GachaService {
  constructor () {
    this.localDB = null
    this.charactersCollection = null
    this.characters = []
    this.charactersByGender = { male: [], female: [], other: [] }
    this.charactersBySource = {}
    this.isDirty = false
    this.saveInterval = null
  }

  async load () {
    const dbPath = path.join(__dirname, '..', 'database')
    const gachaJsonPath = path.join(dbPath, 'gacha.json')

    const jsonData = JSON.parse(fs.readFileSync(gachaJsonPath, 'utf8'))
    const catalogCharacters = jsonData.characters || []

    this.localDB = new LocalDB(dbPath).db('gacha')
    await this.localDB.load()
    this.charactersCollection = this.localDB.collection('characters')

    const dbCharacters = this.charactersCollection.find()
    const dbMap = new Map(dbCharacters.map(c => [c.id, c]))

    this.characters = catalogCharacters.map(char => {
      const saved = dbMap.get(char.id)
      if (!saved) {
        this.charactersCollection.insertOne({ id: char.id })
        return { ...char }
      }
      return {
        ...char,
        owner: saved.owner,
        claimedAt: saved.claimedAt,
        transferredAt: saved.transferredAt,
        votes: saved.votes,
        voteCount: saved.voteCount
      }
    })

    for (const old of dbCharacters) {
      if (!catalogCharacters.find(c => c.id === old.id)) {
        this.characters.push({
          id: old.id,
          name: old.name || old.id,
          disabled: true,
          owner: old.owner,
          claimedAt: old.claimedAt
        })
      }
    }

    this.indexCharacters()
    this.startAutoSave()
  }

  indexCharacters () {
    this.charactersByGender = { male: [], female: [], other: [] }
    this.charactersBySource = {}

    for (const char of this.characters) {
      const gender = char.gender?.toLowerCase() || 'other'
      if (this.charactersByGender[gender]) {
        this.charactersByGender[gender].push(char)
      }

      const source = char.source || 'Unknown'
      if (!this.charactersBySource[source]) {
        this.charactersBySource[source] = []
      }
      this.charactersBySource[source].push(char)
    }
  }

  getRandom () {
    const available = this.characters.filter(c => !c.owner && !c.disabled)
    if (!available.length) return null
    return available[Math.floor(Math.random() * available.length)]
  }

  getById (id) {
    return this.characters.find(c => c.id === id)
  }

  getUserCharacters (userId) {
    return this.characters.filter(c => c.owner === userId)
  }

  claim (userId, characterId) {
    const char = this.getById(characterId)
    if (!char || char.disabled) return { success: false, message: 'Personaje no disponible' }
    if (char.owner) return { success: false, message: 'Este personaje ya tiene dueño' }

    char.owner = userId
    char.claimedAt = Date.now()

    this.charactersCollection.updateOne(
      { id: characterId },
      { $set: { owner: userId, claimedAt: char.claimedAt } }
    )

    this.markDirty()
    return { success: true, character: char }
  }

  release (userId, characterId) {
    const char = this.getById(characterId)
    if (!char || char.owner !== userId) {
      return { success: false, message: 'No eres el dueño' }
    }

    delete char.owner
    delete char.claimedAt

    this.charactersCollection.updateOne(
      { id: characterId },
      { $unset: { owner: '', claimedAt: '' } }
    )

    this.markDirty()
    return { success: true }
  }

  markDirty () {
    this.isDirty = true
  }

  async save () {
    if (!this.isDirty) return
    await this.localDB.save()
    this.isDirty = false
  }

  startAutoSave () {
    this.saveInterval = setInterval(() => this.save(), 10000)
  }

  async gracefulShutdown () {
    if (this.saveInterval) clearInterval(this.saveInterval)
    await this.save()
  }
}

export default GachaService
