import Queue from 'bull';

class QueueManager {
    constructor() {
        this.queues = new Map();
    }

    /**
     * Get or create a queue
     * @param {string} name - Queue name
     * @param {object} options - Bull queue options
     * @returns {Queue.Queue}
     */
    getQueue(name, options = {}) {
        if (!this.queues.has(name)) {
            const queue = new Queue(name, {
                redis: { port: 6379, host: '127.0.0.1' }, // Default Redis config, can be env var
                ...options
            });
            this.queues.set(name, queue);
        }
        return this.queues.get(name);
    }

    /**
     * Add a job to a queue
     * @param {string} queueName 
     * @param {object} data 
     * @param {object} options 
     */
    async addJob(queueName, data, options = {}) {
        const queue = this.getQueue(queueName);
        return await queue.add(data, options);
    }

    /**
     * Process jobs in a queue
     * @param {string} queueName 
     * @param {function} processor 
     * @param {number} concurrency 
     */
    process(queueName, processor, concurrency = 1) {
        const queue = this.getQueue(queueName);
        queue.process(concurrency, processor);
    }
}

export default QueueManager;
