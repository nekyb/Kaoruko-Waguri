import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerManager {
    constructor() {
        this.workers = new Map();
    }

    /**
     * Get or create a worker
     * @param {string} name - Worker name (e.g., 'db')
     * @param {string} scriptPath - Path to worker script relative to project root
     * @returns {Worker}
     */
    getWorker(name, scriptPath) {
        if (!this.workers.has(name)) {
            const absolutePath = path.join(__dirname, '..', scriptPath);
            const worker = new Worker(absolutePath);

            worker.on('error', (err) => {
                console.error(`❌ Worker ${name} error:`, err);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`❌ Worker ${name} stopped with exit code ${code}`);
                    this.workers.delete(name); // Remove so it can be recreated if needed
                }
            });

            this.workers.set(name, worker);
            console.log(`🔧 Worker ${name} started`);
        }
        return this.workers.get(name);
    }

    /**
     * Terminate a worker
     * @param {string} name 
     */
    async terminate(name) {
        const worker = this.workers.get(name);
        if (worker) {
            await worker.terminate();
            this.workers.delete(name);
            console.log(`🔧 Worker ${name} terminated`);
        }
    }

    /**
     * Terminate all workers
     */
    async terminateAll() {
        for (const name of this.workers.keys()) {
            await this.terminate(name);
        }
    }
}

export default WorkerManager;
