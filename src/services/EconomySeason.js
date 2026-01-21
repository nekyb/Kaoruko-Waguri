export class EconomySeason {
  constructor(dbService) {
    this.dbService = dbService
    this.currentSeason = null
    this.loadCurrentSeason()
  }

  loadCurrentSeason() {
    const season = this.dbService.getCurrentSeason()
    if (season) {
      this.currentSeason = season
      return
    }
    this.createDefaultSeason()
  }

  createDefaultSeason() {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    this.currentSeason = this.dbService.createSeason(
      `Temporada ${now.getMonth() + 1}/${now.getFullYear()}`,
      now.getTime(),
      endDate.getTime(),
      {
        top1: { coins: 100000, badge: '🏆' },
        top2: { coins: 75000, badge: '🥈' },
        top3: { coins: 50000, badge: '🥉' },
        top10: { coins: 25000, badge: '⭐' }
      }
    )
  }

  async getSeasonLeaderboard(limit = 50) {
    if (!this.currentSeason) return []
    return this.dbService.getLeaderboard(this.currentSeason.id, limit)
  }

  async getUserRank(userId) {
    const leaderboard = await this.getSeasonLeaderboard(1000)
    const total = leaderboard.length
    if (!total) return { rank: null, total: 0, percentile: 0 }

    const index = leaderboard.findIndex(u => u.id === userId)
    if (index === -1) {
      return { rank: null, total, percentile: 0 }
    }

    return {
      rank: index + 1,
      total,
      percentile: (((total - index) / total) * 100).toFixed(1)
    }
  }

  async endSeason() {
    if (!this.currentSeason) return null

    const leaderboard = await this.getSeasonLeaderboard(100)
    const rewards = this.currentSeason.rewards
    const results = {
      season: this.currentSeason.name,
      endDate: Date.now(),
      winners: []
    }

    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i]
      let reward = null

      if (i === 0 && rewards.top1) reward = rewards.top1
      else if (i === 1 && rewards.top2) reward = rewards.top2
      else if (i === 2 && rewards.top3) reward = rewards.top3
      else if (i < 10 && rewards.top10) reward = rewards.top10

      if (!reward) continue

      const user = await this.dbService.getUser(entry.id)
      user.economy.coins += reward.coins
      user.badges = user.badges || []
      user.badges.push({
        season: this.currentSeason.name,
        rank: i + 1,
        badge: reward.badge
      })

      this.dbService.updateUser(entry.id, user)

      results.winners.push({
        userId: entry.id,
        rank: i + 1,
        reward
      })
    }

    this.currentSeason.active = false
    this.createDefaultSeason()

    return results
  }

  getTimeRemaining() {
    if (!this.currentSeason) return null

    const remaining = this.currentSeason.endDate - Date.now()
    if (remaining <= 0) return { expired: true }

    const days = Math.floor(remaining / 86400000)
    const hours = Math.floor((remaining % 86400000) / 3600000)

    return {
      expired: false,
      days,
      hours,
      total: remaining
    }
  }

  async getSeasonStats() {
    if (!this.currentSeason) return null

    const leaderboard = await this.getSeasonLeaderboard(1000)
    const participants = leaderboard.length
    const totalCoins = leaderboard.reduce((s, u) => s + (u.coins || 0), 0)

    return {
      name: this.currentSeason.name,
      startDate: this.currentSeason.startDate,
      endDate: this.currentSeason.endDate,
      participants,
      totalCoins,
      averageCoins: participants ? Math.floor(totalCoins / participants) : 0,
      timeRemaining: this.getTimeRemaining()
    }
  }
}
