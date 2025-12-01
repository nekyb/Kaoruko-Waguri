import NodeCache from 'node-cache';

class CacheManager {
    constructor(ttlSeconds = 60 * 5) { // Default 5 minutes TTL
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2 });
    }

    /**
     * Get value from cache
     * @param {string} key 
     * @returns {any}
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl - Optional TTL in seconds
     */
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }

    /**
     * Check if key exists
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Delete key
     * @param {string} key 
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Get or set (fetch if missing)
     * @param {string} key 
     * @param {function} fetchFn 
     * @param {number} ttl 
     */
    async getOrSet(key, fetchFn, ttl) {
        const cached = this.get(key);
        if (cached) return cached;

        const value = await fetchFn();
        this.set(key, value, ttl);
        return value;
    }
}

export default CacheManager;
