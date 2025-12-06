export class Worker {
  constructor() {
    throw new Error('worker_threads is not available in this build');
  }
}

export function isMainThread() {
  return false;
}

export const parentPort = null;
export const workerData = null;
