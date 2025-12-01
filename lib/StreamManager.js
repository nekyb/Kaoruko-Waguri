import axios from 'axios';
import { PassThrough } from 'stream';

class StreamManager {
    constructor() {
        this.activeStreams = new Map();
    }

    /**
     * Creates a stream from a URL
     * @param {string} url - The URL to stream from
     * @param {object} options - Axios options
     * @returns {Promise<import('stream').Readable>}
     */
    async getStream(url, options = {}) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                ...options
            });

            return response.data;
        } catch (error) {
            console.error('StreamManager Error:', error.message);
            throw error;
        }
    }

    /**
     * Pipes a stream to a PassThrough stream (useful for multiple consumers if needed, 
     * though Baileys usually consumes it once)
     * @param {import('stream').Readable} sourceStream 
     * @returns {PassThrough}
     */
    createPassThrough(sourceStream) {
        const pass = new PassThrough();
        sourceStream.pipe(pass);
        return pass;
    }
}

export default StreamManager;
