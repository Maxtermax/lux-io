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
    const { definition, onResult } = incomingPromise;
    return definition()
      .then((result) => onResult({ result, fromCache: true, error: true }))
      .catch((result) => onResult({ result, fromCache: true, error: true }));
  }

  removeFinishPromise(queue, id) {
    return queue.filter((promise) => promise.id !== id);
  }

  handlePromiseResult(
    { id, cache, onResult, error },
    result,
    fromCache = false
  ) {
    this.promiseQueue = this.promiseQueue.filter(
      (promise) => promise.id !== id
    );
    if (cache) this.promisesCache[id] = { result, error };
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
