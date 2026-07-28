import * as mediasoup from 'mediasoup';
import { Worker } from 'mediasoup/node/lib/types';
import { config } from '../config';

export type WorkerCrashCallback = (workerPid: number) => void;

export class WorkerManager {
  private workers: Worker[] = [];
  private nextWorkerIdx = 0;
  private onWorkerCrashCallbacks: WorkerCrashCallback[] = [];

  /**
   * Initializes the pool of mediasoup workers equal to CPU cores (or config).
   */
  async init(): Promise<void> {
    const numWorkers = config.mediasoup.numWorkers;
    console.log(`[WorkerManager] Spawning ${numWorkers} mediasoup worker(s)...`);

    for (let i = 0; i < numWorkers; i++) {
      await this.createWorker();
    }

    console.log(`[WorkerManager] Initialized worker pool with ${this.workers.length} active workers.`);
  }

  /**
   * Spawns a single mediasoup worker and attaches death listener.
   */
  private async createWorker(): Promise<Worker> {
    const worker = await mediasoup.createWorker(config.mediasoup.workerSettings);

    console.log(`[WorkerManager] Worker spawned [PID: ${worker.pid}]`);

    worker.on('died', (error) => {
      console.error(`[WorkerManager] CRITICAL: mediasoup Worker died [PID: ${worker.pid}]`, error);

      // Remove dead worker from active pool
      const deadPid = worker.pid;
      this.workers = this.workers.filter((w) => w.pid !== deadPid);

      // Respawn replacement worker process immediately
      console.log(`[WorkerManager] Respawning replacement worker process...`);
      this.createWorker().catch((err) => {
        console.error('[WorkerManager] Failed to respawn worker:', err);
      });

      // Notify registered room migration listeners
      this.onWorkerCrashCallbacks.forEach((cb) => cb(deadPid));
    });

    this.workers.push(worker);
    return worker;
  }

  hasWorkers(): boolean {
    return this.workers.length > 0;
  }

  /**
   * Gets the next worker in round-robin sequence to distribute room routers.
   */
  getNextWorker(): Worker {
    if (this.workers.length === 0) {
      throw new Error('[WorkerManager] No active mediasoup workers available in pool');
    }

    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  /**
   * Registers a callback for worker crash events to trigger room router migration.
   */
  onWorkerCrash(cb: WorkerCrashCallback): void {
    this.onWorkerCrashCallbacks.push(cb);
  }

  /**
   * Returns stats for all running workers.
   */
  async getWorkerStats(): Promise<Array<{ pid: number; usage: unknown }>> {
    const stats = [];
    for (const worker of this.workers) {
      try {
        const usage = await worker.getResourceUsage();
        stats.push({ pid: worker.pid, usage });
      } catch (err) {
        console.error(`[WorkerManager] Failed to get stats for worker ${worker.pid}:`, err);
      }
    }
    return stats;
  }
}

export const workerManager = new WorkerManager();
