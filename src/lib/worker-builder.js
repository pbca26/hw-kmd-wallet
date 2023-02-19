export default class WorkerBuilder extends Worker {
  constructor(worker, opts) {
    if (opts.isBlob) {
      const code = worker.toString();
      const blob = new Blob([`(${code})()`]);
      return new Worker(URL.createObjectURL(blob));
    } else if (opts.scriptName === 'sync') {
      return new Worker(new URL('./sync-worker.js', import.meta.url));
    }
  }
}