export class PluginMarketplace {
  constructor(dbService) {
    this.dbService = dbService
    this.revenueShare = 0.7
    if (!this.dbService.db.plugins) this.dbService.db.plugins = {}
  }

  async publishPlugin(authorId, pluginData) {
    const { name, description, code, price = 0 } = pluginData || {}
    if (!name || !code) throw new Error('Datos inválidos')

    const normalized = name.toLowerCase().trim()
    const exists = Object.values(this.dbService.db.plugins)
      .some(p => p.name.toLowerCase().trim() === normalized)

    if (exists) throw new Error('Ya existe un plugin con ese nombre')

    const pluginId = `${Date.now()}-${Math.random()}`
    const plugin = {
      id: pluginId,
      name: name.trim(),
      description: description || '',
      authorId,
      price: Math.max(0, Number(price) || 0),
      code,
      downloads: 0,
      rating: 0,
      ratings: [],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: null,
      revenue: 0
    }

    this.dbService.db.plugins[pluginId] = plugin
    this.dbService.markDirty()

    return { success: true, pluginId }
  }

  async purchasePlugin(userId, pluginId) {
    const plugin = this.dbService.db.plugins[pluginId]
    if (!plugin || !plugin.enabled) throw new Error('Plugin no disponible')

    const user = await this.dbService.getUser(userId)
    user.purchasedPlugins = user.purchasedPlugins || []

    if (user.purchasedPlugins.includes(pluginId)) {
      throw new Error('Plugin ya comprado')
    }

    if (user.economy.coins < plugin.price) {
      throw new Error('Fondos insuficientes')
    }

    user.economy.coins -= plugin.price
    user.purchasedPlugins.push(pluginId)
    this.dbService.updateUser(userId, user)

    plugin.downloads++
    const authorRevenue = Math.floor(plugin.price * this.revenueShare)
    plugin.revenue += authorRevenue

    const author = await this.dbService.getUser(plugin.authorId)
    author.economy.coins += authorRevenue
    this.dbService.updateUser(plugin.authorId, author)

    await this.dbService.addTransaction(
      userId,
      'plugin_purchase',
      -plugin.price,
      plugin.name
    )

    await this.dbService.addTransaction(
      plugin.authorId,
      'plugin_revenue',
      authorRevenue,
      plugin.name
    )

    this.dbService.markDirty()

    return {
      success: true,
      plugin: {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description
      }
    }
  }

  async ratePlugin(userId, pluginId, rating, comment = '') {
    const value = Number(rating)
    if (value < 1 || value > 5) throw new Error('Rating inválido')

    const plugin = this.dbService.db.plugins[pluginId]
    if (!plugin) throw new Error('Plugin no encontrado')

    const user = await this.dbService.getUser(userId)
    if (!user.purchasedPlugins?.includes(pluginId)) {
      throw new Error('Compra requerida')
    }

    const existing = plugin.ratings.find(r => r.userId === userId)
    if (existing) {
      existing.rating = value
      existing.comment = comment
      existing.updatedAt = Date.now()
    } else {
      plugin.ratings.push({
        userId,
        rating: value,
        comment,
        createdAt: Date.now()
      })
    }

    const total = plugin.ratings.reduce((s, r) => s + r.rating, 0)
    plugin.rating = Number((total / plugin.ratings.length).toFixed(2))

    this.dbService.markDirty()

    return { success: true, rating: plugin.rating }
  }

  async searchPlugins(query = '', sortBy = 'downloads') {
    const q = query.toLowerCase().trim()

    const list = Object.values(this.dbService.db.plugins)
      .filter(p => p.enabled)
      .filter(p =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )

    const sorters = {
      downloads: (a, b) => b.downloads - a.downloads,
      rating: (a, b) => b.rating - a.rating,
      price: (a, b) => a.price - b.price,
      newest: (a, b) => b.createdAt - a.createdAt
    }

    list.sort(sorters[sortBy] || sorters.downloads)

    return list.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      downloads: p.downloads,
      rating: p.rating,
      createdAt: p.createdAt
    }))
  }

  async getPluginDetails(pluginId) {
    const plugin = this.dbService.db.plugins[pluginId]
    if (!plugin || !plugin.enabled) throw new Error('Plugin no encontrado')

    const authorPlugins = Object.values(this.dbService.db.plugins)
      .filter(p => p.authorId === plugin.authorId && p.enabled)

    return {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      price: plugin.price,
      downloads: plugin.downloads,
      rating: plugin.rating,
      createdAt: plugin.createdAt,
      updatedAt: plugin.updatedAt,
      author: {
        id: plugin.authorId,
        totalPlugins: authorPlugins.length
      },
      recentRatings: plugin.ratings
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
    }
  }

  async getUserPlugins(userId) {
    const user = await this.dbService.getUser(userId)

    const purchased = (user.purchasedPlugins || [])
      .map(id => this.dbService.db.plugins[id])
      .filter(Boolean)

    const published = Object.values(this.dbService.db.plugins)
      .filter(p => p.authorId === userId)

    return {
      purchased,
      published,
      totalRevenue: published.reduce((s, p) => s + (p.revenue || 0), 0)
    }
  }

  async updatePlugin(authorId, pluginId, updates = {}) {
    const plugin = this.dbService.db.plugins[pluginId]
    if (!plugin) throw new Error('Plugin no encontrado')
    if (plugin.authorId !== authorId) throw new Error('Sin permisos')

    const allowed = ['description', 'price', 'code']
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        plugin[key] = key === 'price'
          ? Math.max(0, Number(updates[key]) || 0)
          : updates[key]
      }
    }

    plugin.updatedAt = Date.now()
    this.dbService.markDirty()

    return { success: true }
  }
            }
