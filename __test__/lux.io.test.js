const { Lx } = require("..");

function promiseTimeout(cb, TIME) {
  return new Promise((resolve, reject) => {
    setTimeout(() => cb().then(resolve).catch(reject), TIME);
  });
}

describe("LuxIo", () => {
  it("Two promises with the same id should be resolved from cache, with a MAX_CONCURRENT_REQUEST of 1", () => {
    return new Promise((resolve) => {
      const LxStream = new Lx(1);
      const operationOne = {
        id: 1,
        cache: true,
        onResult: () => null,
        definition: () => promiseTimeout(() => Promise.resolve(1), 0),
      };
      LxStream.push(operationOne);
      const operationTwo = {
        id: 1,
        cache: true,
        onResult: ({ fromCache }) => resolve(expect(fromCache).toBe(true)),
        definition: () => promiseTimeout(() => Promise.resolve(1), 0),
      };
      LxStream.push(operationTwo);
    });
  });

  it("Promise with cache attribute false should not be resolved from cache", () => {
    const LxStream = new Lx(1);
    return new Promise((resolve) => {
      const operationOne = {
        id: 1,
        onResult: () => null,
        definition: () => Promise.resolve(1),
      };
      LxStream.push(operationOne);
      const operationTwo = {
        id: 1,
        cache: false,
        onResult: ({ fromCache }) => resolve(expect(fromCache).toBe(false)),
        definition: () => Promise.resolve(1),
      };
      LxStream.push(operationTwo);
    });
  });

  it("Promise result should have an error property equal to true", () => {
    return new Promise((resolve) => {
      const LxStream = new Lx(1);
      const operation = {
        id: 1,
        onResult: ({ error }) => resolve(expect(error).toBe(true)),
        definition: () => Promise.reject(new Error("TEST")),
      };
      LxStream.push(operation);
    });
  });

  it("Should remove operation from the cache", () => {
    return new Promise((resolve) => {
      let counter = 0;
      const LxStream = new Lx(1);
      const id = 1;
      const operation = {
        id,
        cache: true,
        onResult: ({ fromCache }) => {
          if (counter === 2) resolve(expect(fromCache).toBe(false));
          counter++;
        },
        definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
      };
      LxStream.push(operation);
      LxStream.push(operation);
      setTimeout(() => {
        LxStream.removeFromCache(id);
        LxStream.push(operation);
      }, 1000);
    });
  });

  it("Should remove clear the cache", () => {
    return new Promise((resolve) => {
      let counter = 0;
      const LxStream = new Lx(1);
      const id = 1;
      const operation = {
        id,
        cache: true,
        onResult: ({ fromCache }) => {
          if (counter === 2) resolve(expect(fromCache).toBe(false));
          counter++;
        },
        definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
      };
      LxStream.push(operation);
      LxStream.push(operation);
      setTimeout(() => {
        LxStream.clearCache();
        LxStream.push(operation);
      }, 1000);
    });
  });

  it("Should pull operation from the stream", () => {
    return new Promise((resolve) => {
      const LxStream = new Lx(1);
      const counter = jest.fn(() => true);
      const operationOne = {
        id: 1,
        cache: true,
        onResult: () => counter(),
        definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
      };
      const operationTwo = {
        id: 2,
        cache: true,
        onResult: () => counter(),
        definition: () => promiseTimeout(() => Promise.resolve("TEST"), 1000),
      };
      LxStream.push(operationOne);
      LxStream.push(operationTwo);
      LxStream.pull(2);
      setTimeout(() => resolve(expect(counter).toHaveReturnedTimes(1)), 2000);
    });
  });

  it("Should not save rejected result in the cache", () => {
    return new Promise((resolve) => {
      const LxStream = new Lx(1);
      const id = 1;
      const operationOne = {
        id,
        cache: true,
        onResult: () => null,
        definition: () =>
          promiseTimeout(() => Promise.reject(new Error("TEST")), 0),
      };
      const operationTwo = {
        id,
        cache: true,
        onResult: ({ fromCache }) => resolve(expect(fromCache).toBe(false)),
        definition: () =>
          promiseTimeout(() => Promise.reject(new Error("TEST")), 0),
      };
      LxStream.push(operationOne);
      LxStream.push(operationTwo);
    });
  });

  it("Should executate the operationThree last", () => {
    const LxStream = new Lx(2);
    return new Promise((resolve) => {
      const responseOne = jest.fn();
      const responseTwo = jest.fn();
      const responseThree = jest.fn();
      const operationOne = {
        id: 1,
        onResult: () => responseOne(),
        definition: () => promiseTimeout(() => Promise.resolve(1), 1000),
      };
      const operationTwo = {
        id: 2,
        onResult: () => responseTwo(),
        definition: () => promiseTimeout(() => Promise.resolve(2), 500),
      };
      const operationThree = {
        id: 3,
        onResult: () => responseThree(),
        definition: () => promiseTimeout(() => Promise.resolve(3), 100),
      };
      LxStream.push(operationOne);
      LxStream.push(operationTwo);
      LxStream.push(operationThree);
      setTimeout(
        () =>
          resolve(expect(responseTwo).toHaveBeenCalledBefore(responseThree)),
        2000
      );
    });
  });
});
