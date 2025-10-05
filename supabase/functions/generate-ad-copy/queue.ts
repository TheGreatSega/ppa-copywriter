import { logger } from './logger.ts';

// Request queue for managing concurrent operations per user
interface QueuedRequest {
  id: string;
  userId: string;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queues: Map<string, QueuedRequest[]>;
  private processing: Map<string, number>;
  private readonly MAX_CONCURRENT_PER_USER = 3;
  private readonly MAX_QUEUE_SIZE = 10;
  private readonly TIMEOUT_MS = 60 * 1000; // 60 seconds

  constructor() {
    this.queues = new Map();
    this.processing = new Map();
    
    // Clean up stale requests every minute
    setInterval(() => this.cleanupStale(), 60 * 1000);
    logger.info('RequestQueue initialized', { 
      maxConcurrent: this.MAX_CONCURRENT_PER_USER, 
      maxQueueSize: this.MAX_QUEUE_SIZE 
    });
  }

  async enqueue<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    const currentProcessing = this.processing.get(userId) || 0;
    const currentQueue = this.queues.get(userId) || [];

    // If under concurrent limit, execute immediately
    if (currentProcessing < this.MAX_CONCURRENT_PER_USER) {
      return this.executeRequest(userId, operation);
    }

    // Check if queue is full
    if (currentQueue.length >= this.MAX_QUEUE_SIZE) {
      logger.warn('Request queue full', { userId, queueSize: currentQueue.length });
      throw new Error('Request queue is full. Please try again in a few moments.');
    }

    // Add to queue and wait
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: crypto.randomUUID(),
        userId,
        timestamp: Date.now(),
        resolve: async () => {
          try {
            const result = await this.executeRequest(userId, operation);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        reject,
      };

      if (!this.queues.has(userId)) {
        this.queues.set(userId, []);
      }
      this.queues.get(userId)!.push(request);

      logger.info('Request queued', { userId, queueSize: this.queues.get(userId)!.length });
    });
  }

  private async executeRequest<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    // Increment processing count
    const currentProcessing = this.processing.get(userId) || 0;
    this.processing.set(userId, currentProcessing + 1);

    try {
      // Execute with timeout
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), this.TIMEOUT_MS)
        ),
      ]);

      return result;
    } finally {
      // Decrement processing count
      const newCount = (this.processing.get(userId) || 1) - 1;
      if (newCount <= 0) {
        this.processing.delete(userId);
      } else {
        this.processing.set(userId, newCount);
      }

      // Process next in queue
      this.processNext(userId);
    }
  }

  private processNext(userId: string): void {
    const queue = this.queues.get(userId);
    if (!queue || queue.length === 0) return;

    const currentProcessing = this.processing.get(userId) || 0;
    if (currentProcessing >= this.MAX_CONCURRENT_PER_USER) return;

    const nextRequest = queue.shift();
    if (nextRequest) {
      logger.info('Processing queued request', { userId, remaining: queue.length });
      nextRequest.resolve(null);
    }

    if (queue.length === 0) {
      this.queues.delete(userId);
    }
  }

  private cleanupStale(): void {
    const now = Date.now();
    let totalCleaned = 0;
    
    for (const [userId, queue] of this.queues.entries()) {
      const initialLength = queue.length;
      const validRequests = queue.filter((req) => {
        const isStale = now - req.timestamp > this.TIMEOUT_MS * 2;
        if (isStale) {
          req.reject(new Error('Request expired'));
        }
        return !isStale;
      });

      totalCleaned += initialLength - validRequests.length;

      if (validRequests.length === 0) {
        this.queues.delete(userId);
      } else {
        this.queues.set(userId, validRequests);
      }
    }

    if (totalCleaned > 0) {
      logger.info('Stale requests cleaned from queue', { cleaned: totalCleaned });
    }
  }

  getQueueStats(): { totalQueued: number; userQueues: Record<string, number> } {
    const userQueues: Record<string, number> = {};
    let totalQueued = 0;

    for (const [userId, queue] of this.queues.entries()) {
      userQueues[userId] = queue.length;
      totalQueued += queue.length;
    }

    return { totalQueued, userQueues };
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();
