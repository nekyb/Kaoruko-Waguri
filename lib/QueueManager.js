class InMemoryQueue {
    constructor(name) {
        this.name = name;
        this.jobs = [];
        this.processor = null;
        this.processing = false;
    }
    async add(data, options = {}) {
        const job = {
            id: Date.now() + Math.random(),
            data,
            options,
            timestamp: Date.now()
        };
        this.jobs.push(job);
        console.log(`ദ്ദി ˉ͈̀꒳ˉ͈́ )✧ Job agregado a cola "${this.name}":`, job.id);
        this.processNext();
        return job;
    }
    process(concurrencyOrProcessor, processor) {
        if (typeof concurrencyOrProcessor === 'function') {
            this.processor = concurrencyOrProcessor;
            console.log(`ദ്ദി ˉ͈̀꒳ˉ͈́ )✧ Processor asignado a cola "${this.name}"`);
        } else {
            this.processor = processor;
            console.log(`ദ്ദി ˉ͈̀꒳ˉ͈́ )✧ Processor asignado a cola "${this.name}" con concurrency ${concurrencyOrProcessor}`);
        }
        this.processNext();
    }
    async processNext() {
        if (this.processing || !this.processor || this.jobs.length === 0) {
            if (!this.processor) {
                console.log(`ඞ Cola "${this.name}": No hay processor asignado`);
            }
            return;
        }
        this.processing = true;
        console.log(`ඞ Procesando ${this.jobs.length} trabajos en cola "${this.name}"`);
        while (this.jobs.length > 0) {
            const job = this.jobs.shift();
            try {
                console.log(`⚡ Ejecutando job ${job.id} en cola "${this.name}"`);
                await this.processor(job);
                console.log(`ദ്ദി ˉ͈̀꒳ˉ͈́ )✧ Job ${job.id} completado`);
            } catch (err) {
                console.error(`ඞ InMemoryQueue ${this.name} job error:`, err);
            }
        }
        this.processing = false;
        console.log(`ദ്ദി ˉ͈̀꒳ˉ͈́ )✧ Cola "${this.name}" procesada completamente`);
    }
}
class QueueManager {
    constructor() {
        this.queues = new Map();
        this.useRedis = false;
        this.Bull = null;
    }
    async init() {
        try {
            const BullModule = await import('bull');
            this.Bull = BullModule.default;
            const testQueue = new this.Bull('test-connection', {
                redis: { port: 6379, host: '127.0.0.1' }
            });
            await testQueue.isReady();
            await testQueue.close();
            this.useRedis = true;
            console.log('✎ QueueManager: Redis disponible');
        } catch (err) {
            this.useRedis = false;
            console.log('ඞ QueueManager: Redis no disponible, usando cola en memoria');
        }
    }
    getQueue(name, options = {}) {
        if (!this.queues.has(name)) {
            let queue;
            if (this.useRedis && this.Bull) {
                queue = new this.Bull(name, {
                    redis: { port: 6379, host: '127.0.0.1' },
                    ...options
                });
                console.log(`✎ Cola "${name}" creada con Redis`);
            } else {
                queue = new InMemoryQueue(name);
                console.log(`✎ Cola "${name}" creada en memoria`);
            }
            this.queues.set(name, queue);
        }
        return this.queues.get(name);
    }
    async addJob(queueName, data, options = {}) {
        const queue = this.getQueue(queueName);
        return await queue.add(data, options);
    }
    process(queueName, processor, concurrency = 1) {
        const queue = this.getQueue(queueName);
        queue.process(concurrency, processor);
    }
    isUsingRedis() {
        return this.useRedis;
    }
}

export default QueueManager;
