const Logger = require("../logger");
const mute = true; //process.env.NODE_ENV === "production";
const logger = new Logger({ level: "info", mute });

class LuxIo {
  constructor(MAX_CONCURRENT_PROMISES = 1) {
    this.promiseQueue = [];
    this.pendingPromises = [];
    this.promisesCache = {};
    this.MAX_CONCURRENT_PROMISES = MAX_CONCURRENT_PROMISES;
    logger.log({ MAX_CONCURRENT_PROMISES });
  }

  pull(id) {
    const queueIndex = this.promiseQueue.map((item) => item.id).indexOf(id);
    const pendingIndex = this.pendingPromises
      .map((item) => item.id)
      .indexOf(id);

    if (queueIndex !== -1) this.promiseQueue.splice(queueIndex, 1);
    if (pendingIndex !== -1) this.pendingPromises.splice(pendingIndex, 1);
  }

  getFromCache(id) {
    return this.promisesCache[id];
  }

  clearCache() {
    this.promisesCache = {};
  }

  removeFromCache(id) {
    delete this.promisesCache[id];
  }

  push(incomingPromise) {
    const isFull = this.promiseQueue.length >= this.MAX_CONCURRENT_PROMISES;
    logger.log({
      isFull,
      promiseQueue: this.promiseQueue.length,
      pendingPromises: this.pendingPromises,
    });
    if (incomingPromise.cache) {
      const inCache = this.promisesCache.hasOwnProperty(incomingPromise.id);
      if (inCache) return this.responseFromCache(incomingPromise);
    }
    if (isFull) return this.pendingPromises.push(incomingPromise);
    this.promiseQueue.push(incomingPromise);
    this.promiseExecutor(incomingPromise);
  }

  responseFromCache(incomingPromise) {
    const { id, onResult } = incomingPromise;
    const { error, result } = this.promisesCache[id];
    return onResult({ result, fromCache: true, error });
  }

  removeFinishPromise(queue, id) {
    return queue.filter((promise) => promise.id !== id);
  }

  handlePromiseResult(
    { id, cache, onResult, error },
    result,
    fromCache = false
  ) {
    this.promiseQueue = this.removeFinishPromise(this.promiseQueue, id);
    const shouldSaveInCache = cache && !error;
    if (shouldSaveInCache) this.promisesCache[id] = { result, error };
    const [pending] = this.pendingPromises;
    if (pending) {
      this.push(pending);
      this.pendingPromises.splice(0, 1);
    }
    return onResult({ result, fromCache, error });
  }

  promiseExecutor(payload = {}) {
    const { id = "", definition, cache = true, onResult } = payload;
    return definition()
      .then(
        this.handlePromiseResult.bind(this, {
          id,
          cache,
          onResult,
          error: false,
        })
      )
      .catch(
        this.handlePromiseResult.bind(this, {
          id,
          cache,
          onResult,
          error: true,
        })
      );
  }
}

exports.Lx = LuxIo;
