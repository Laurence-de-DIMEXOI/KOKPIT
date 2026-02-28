import { Queue, Worker } from "bullmq";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
};

// Queue definitions
export const nurturingQueue = new Queue("nurturing", {
  connection: redisConnection,
});

export const relanceQueue = new Queue("relance", {
  connection: redisConnection,
});

export const slaCheckQueue = new Queue("sla-check", {
  connection: redisConnection,
});

export const sellsySyncQueue = new Queue("sellsy-sync", {
  connection: redisConnection,
});

export const crossSellQueue = new Queue("cross-sell", {
  connection: redisConnection,
});

/**
 * Create a worker for a queue with the specified processor function
 */
export function createWorker(
  queueName: string,
  processor: (job: any) => Promise<void>,
  options?: {
    concurrency?: number;
    settings?: any;
  }
): Worker {
  return new Worker(queueName, processor, {
    connection: redisConnection,
    concurrency: options?.concurrency || 1,
    settings: options?.settings,
  });
}

/**
 * Create queue schedulers for recurring jobs
 */
// export function createQueueScheduler(queueName: string): QueueScheduler {
//   return new QueueScheduler(queueName, {
//     connection: redisConnection,
//   });
// }

// Queue events helpers
export async function getQueueStats(queueName: string) {
  const queue = new Queue(queueName, {
    connection: redisConnection,
  });

  const counts = await queue.getJobCounts();
  const stats = await queue.getMetrics("completed");

  return { counts, stats };
}

/**
 * Clean up completed jobs older than specified milliseconds
 */
export async function cleanQueueJobs(
  queueName: string,
  millisecondsOlderThan: number = 3600000 // 1 hour default
): Promise<string[]> {
  const queue = new Queue(queueName, {
    connection: redisConnection,
  });

  return queue.clean(millisecondsOlderThan, 100, "completed");
}
