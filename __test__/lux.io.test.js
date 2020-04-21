const { lx } = require("..");

const runPromiseTimeout = (promise, TIME) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => promise.then(resolve).catch(reject), TIME)
  );
};

describe("LuxIo class", () => {
  it("Two promises with the same id should be resolved from cache, with a MAX_CONCURRENT_REQUEST of 1", () => {
    const LxStream = new lx(1);
    const operation = {
      id: 1,
      onResponse: () => null,
      definition: () => Promise.resolve(1),
    };
    LxStream.push(operation);
    return new Promise((resolve) => {
      const operation = {
        id: 1,
        onResponse: (_result, fromCache) =>
          resolve(expect(fromCache).toBe(true)),
        definition: () => Promise.resolve(1),
      };
      LxStream.push(operation);
    });
  });

  it("Promise with cache attribute false should not be resolved from cache", () => {
    const LxStream = new lx(1);
    const operation = {
      id: 1,
      onResponse: () => null,
      definition: () => Promise.resolve(1),
    };
    LxStream.push(operation);
    return new Promise((resolve) => {
      const operation = {
        id: 1,
        cache: false,
        onResponse: (_result, fromCache) =>
          resolve(expect(fromCache).toBe(false)),
        definition: () => Promise.resolve(1),
      };
      LxStream.push(operation);
    });
  });

  it("Promise result should be instance of Error", () => {
    return new Promise((resolve) => {
      const LxStream = new lx(1);
      const operation = {
        id: 1,
        onResponse: (result) =>
          resolve(expect(result instanceof Error).toBe(true)),
        definition: () => Promise.reject(new Error("TEST")),
      };
      LxStream.push(operation);
    });
  });

  it("Should executate the operationThree last", () => {
    return new Promise((resolve) => {
      const LxStream = new lx(2);
      const responseOne = jest.fn();
      const responseTwo = jest.fn();
      const responseThree = jest.fn();
      const operationOne = {
        id: 1,
        onResponse: responseOne,
        definition: () => runPromiseTimeout(Promise.resolve(1), 1000),
      };
      const operationTwo = {
        id: 2,
        onResponse: responseTwo,
        definition: () => runPromiseTimeout(Promise.resolve(2), 500),
      };
      const operationThree = {
        id: 3,
        onResponse: responseThree,
        definition: () => runPromiseTimeout(Promise.resolve(3), 100),
      };
      LxStream.push(operationOne);
      LxStream.push(operationTwo);
      LxStream.push(operationThree);
      setTimeout(
        () =>
          resolve(expect(responseOne).toHaveBeenCalledBefore(responseThree)),
        2000
      );
    });
  });
});
