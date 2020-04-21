function promiseTimeout(cb, TIME) {
  return new Promise((resolve, reject) => {
    setTimeout(() => cb().then(resolve).catch(reject), TIME);
  });
}

module.exports = promiseTimeout;
