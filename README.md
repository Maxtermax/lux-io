# Lux-io
Lux-io is a simple class that allow you to perform promises excecutions in queue, the excecution queue have a maximum number of concurrent promises that can be execute at the same time.

# Instalation
```
npm install lux-io --save
```

# Get started
In order to use lux-io you should import it first, then create a new instance of the class lx, now the instance have the main method of lux-io which is `push`, this method allow you to add n amount of operations, a operation is defined as and object that have all information to perform a promise execution

```javascript
// import lux-io
import { lx } from 'lux-io'; #import lux-io as lx
const stream = new lx(1);// as unique argument the contructor receive the maximum number of promises to executate at the same time.
const operation = {
  id: 1,
  onResponse: (result, fromCache) => console.log({ result, fromCache }), // { result: 1, fromCache: false }
  definition: () => Promise.resolve(1)
}; # define operation to perform

stream.push(operation);
```
The operation object must have this shape:

| key        | value            | required  | default    | description                                                | 
|:----------:|:-----------------|:----------|:-----------|:-----------------------------------------------------------|
| id         | Number or String | true      | undefined  | Unique identifier                                          |
| cache      | Function         | true      | true       | Flag that allows you to save the promise result in cache   |
| definition | Function         | true      | undefined  | A function that must return the  promise to execute        |
| onResponse | Function         | false     | undefined  | A function that is called when the promise finish          |

# Inner workings

When you try to push more promises than are allowed into the queue those  promises wait in a pending list of promises whitout execute, until at least one of the promises in the main queue get resolved or rejected,  when that happend one of the pending promises get push into the main queue.

The same process get execuate over and over againt until all the promises get exectuted.

# Examples
In this example you will notice that only 2 promises are executed at a time regardless of the time it takes to finish, this behavior occurs because the maximum number of promises to execute at the same time is 2, in this case lux-io will give you execution priority to the first 2 promises pushed, when one of those ends it will continue with the next one in the pending list.
```javascript
import { lx } from 'lux-io';// import lux-io as lx
const LxStream = new lx(2);

const runPromiseTimeout = (promise, TIME) => {
  return new Promise((resolve, reject) =>
    setTimeout(() => promise.then(resolve).catch(reject), TIME)
  );
};

const operationOne = {
  id: 1,
  onResponse: (result) => console.log(result),
  definition: () => runPromiseTimeout(Promise.resolve(1), 1000),
};

const operationTwo = {
  id: 2,
  onResponse: (result) => console.log(result),
  definition: () => runPromiseTimeout(Promise.resolve(2), 500),
};

const operationThree = {
  id: 3,
  onResponse: (result) => console.log(result),
  definition: () => runPromiseTimeout(Promise.resolve(3), 100),
};
LxStream.push(operationOne);
LxStream.push(operationTwo);
LxStream.push(operationThree);
```

# Use cases
