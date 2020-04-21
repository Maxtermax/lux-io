const Logger = require("../logger");
// const mute = process.env.NODE_ENV === "production";
const logger = new Logger({ level: "info", mute: true });

class LuxIo {
  constructor(MAX_CONCURRENT_REQUEST = 1) {
    this.requestQueue = [];
    this.pendingRequests = [];
    this.cacheRequest = {};
    this.MAX_CONCURRENT_REQUEST = MAX_CONCURRENT_REQUEST;
    logger.log({ MAX_CONCURRENT_REQUEST });
  }

  push(incomingRequest) {
    const isFull = this.requestQueue.length >= this.MAX_CONCURRENT_REQUEST;
    logger.log({ isFull, requestQueue: this.requestQueue.length });
    if (isFull) {
      this.pendingRequests.push(incomingRequest);
    } else {
      this.requestQueue.push(incomingRequest);
      if (this.requestQueue.length) this.requestExecutor(incomingRequest);
    }
  }

  resolveResponse({ id, cache, onResponse }, result, fromCache = false) {
    this.requestQueue = this.requestQueue.filter(
      (request) => request.id !== id
    );
    if (cache) {
      this.cacheRequest[id] = result;
    }
    const [pending] = this.pendingRequests;
    if (pending) {
      this.requestQueue.push(pending);
      this.pendingRequests.splice(0, 1);
      if (this.requestQueue.length) {
        const [request] = this.requestQueue;
        this.requestExecutor(request);
      }
    }
    return onResponse(result, fromCache);
  }

  requestExecutor(payload = {}) {
    const { id = "", definition, cache = true, onResponse } = payload;
    if (cache) {
      const inCache = this.cacheRequest.hasOwnProperty(id);
      if (inCache) {
        return this.resolveResponse.bind(this, { id, cache, onResponse })(
          this.cacheRequest[id],
          true
        );
      }
    }
    return definition()
      .then(this.resolveResponse.bind(this, { id, cache, onResponse }))
      .catch(this.resolveResponse.bind(this, { id, cache, onResponse }));
  }
}

exports.lx = LuxIo;
