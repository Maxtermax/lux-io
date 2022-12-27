# Lux-io
Lux io is a simple class that allow you to perform promises excecutions in queue, the excecution queue have a maximum number of concurrent promises that can be execute at the same time.

The applications in this library have no limits, only your imagination.

# Installation
```
npm i @maxtermax/lux-io --save
```

# Get started
In order to use lux-io you should import it first, then create a new instance of the class lx, now the instance have the main method of lux-io which is `push`, this method allow you to add n amount of operations, a operation is defined as and object that have all information to perform a promise execution

```javascript
import { Lx } from '@maxtermax/lux-io'; //import lux-io
const MAX_CONCURRENT_PROMISES = 1;
const LxStream = new Lx(MAX_CONCURRENT_PROMISES);
// as unique argument the contructor receive the maximum number of promises to executate at the same time.
const operation = {
  id: 1,
  onResult: ({result, fromCache}) => console.log({ result, fromCache }), // { result: 1, fromCache: false }
  definition: () => Promise.resolve(1)
};// define operation to perform

LxStream.push(operation);
```
The operation object must have this shape:

| key        | value            | required  | default    | description                                                | 
|:----------:|:-----------------|:----------|:-----------|:-----------------------------------------------------------|
| id         | Number or String | true      | undefined  | Unique identifier                                          |
| cache      | Function         | true      | undefined  | Flag that allows you to save the promise result in cache   |
| definition | Function         | true      | undefined  | A function that must return the  promise to execute        |
| onResult   | Function         | true      | undefined  | A function that is called when the promise finish          |

The `onResult` is a callback that give you the result of the operation, with a object with this shape: 

| key        | value    | description                                                                                  |  
|:----------:|:--------:|:---------------------------------------------------------------------------------------------|
| fromCache  | Boolean  | Boolean value that tell you if the result of the operation come from cache or not            |
| result     | Any      | Result of the promise execution could be any type depending on what value the promise return | 
| error      | Boolean  | Boolean value that tell you if the result of the operation was rejected of fulfilled         |


# Use cases
`lux-io` can be very handy in the cases like:
- Reduce the server load by limiting the amount in requests sended by the client at the same time.
- Use the cache for speed the time response of a program like an ajax call, or database request.

# Examples
## Push multiples operations
In this example you will notice that only 2 promises are executed at a time regardless of the time it takes to finish, this behavior occurs because the maximum number of promises to execute at the same time is 2, in this case lux-io will give you execution priority to the first 2 promises pushed, when one of those ends it will continue with the next one in the pending list.

```javascript
import { Lx } from '@maxtermax/lux-io';// import lux-io as lx
const LxStream = new Lx(2);

function promiseTimeout(cb, TIME) {
  return new Promise((resolve, reject) => {
    setTimeout(() => cb().then(resolve).catch(reject), TIME);
  });
};

const operationOne = {
  id: 1,
  cache: true,
  onResult: ({result}) => console.log({result}),//resolve third
  definition: () => promiseTimeout(() => Promise.resolve(1), 1000),
};

const operationTwo = {
  id: 2,
  cache: true,
  onResult: ({result}) => console.log({result}),//resolve first
  definition: () => promiseTimeout(() => Promise.resolve(2), 500),
};

const operationThree = {
  id: 3,
  cache: true,
  onResult: ({result}) => console.log({result}),//resolve second
  definition: () => promiseTimeout(() => Promise.resolve(3), 100),
};
LxStream.push(operationOne);
LxStream.push(operationTwo);
LxStream.push(operationThree);
```

## Using cache
`lux-io` will try to cache the result of the promises executed in previous executions and if other operation with an id equals to a previus operation execuated is pushed into the stream `lux-io` will return the result from cache aslong the cache property is set to true.

Note that this feature really depends of the time execution, this also depends of the maximum concurrent promises allowed settled in the creation of the instance, so for this reaseon the cache maybe not work if the first promise execution don't match in the time that other promise with the same id is pushed into the stream,  this escenation the cache could be empty.

You can also can deactivate the `cache` by set the property to `false` in that case all the cache thing will be ignored

```javascript
import { Lx } from '@maxtermax/lux-io';
const LxStream = new Lx(1);

const operationOne = {
  id: 1,
  cache: true,
  onResult: ({ fromCache }) => console.log({fromCache}),// { fromCache: false }
  definition: () => Promise.resolve(1),
}

LxStream.push(operationOne);

const operationTwo = {
  id: 1,
  cache: true,
  onResult: ({ fromCache }) => console.log({fromCache}),// { fromCache: true }
  definition: () => Promise.resolve(1),
};
LxStream.push(operationTwo);
```

## Make a http call
A great use case for `lux-io` is make http call's, with this aproach you can control the amount of call to you server, 
in this example are allowed only 2 call at the same time.

Note that the todo with `id` 1 is repeated in the array of todos because of that in the second call of the todo with `id` id the response is immediate, because it come from the `cache`.

```javascript
import { Lx } from '@maxtermax/lux-io';
const LxStream = new Lx(2); //Only 2 promises are allowed to be executed at the same time.

async function getTodo(id) {
  return fetch(
    `https://jsonplaceholder.typicode.com/todos/${id}`
  ).then((response) => response.json());
}

const todos = [1, 2, 3, 1, 4, 5];
function fetchAllTodos(todos = []) {
  todos.forEach((todo) =>
    LxStream.push({
      id: todo,
      cache: true,
      onResult: ({ fromCache, result }) => console.log({ todo, fromCache, result }),
      definition: () => getTodo(todo),
    })
  );
}

fetchAllTodos(todos);

/*
{ todo: 1, fromCache: false, result:{...} }
{ todo: 2, fromCache: false, result:{...} }
{ todo: 3, fromCache: false, result:{...} }
{ todo: 1, fromCache: true, result:{...} }// this call came from cache
{ todo: 4, fromCache: false, result:{...} }
{ todo: 5, fromCache: false, result:{...} }
*/
```
Note the request `1` only appears once, and the next request come from the internal cache of `lux-io` so this way avoid to repeat the same http call, for this example also notice that the requests come in pairs
 
![Application network](https://i.imgur.com/bgU8neh.png "Application network")

# Api

## Push
This method allow you to push operations into the stream, this method must receive a operation object.

```javascript
const LxStream = new Lx(1);
const operation = {
  id: 1,
  cache: true,
  onResult: ({result}) => console.log({result}),
  definition: () => Promise.resolve(1)
};
LxStream.push(operation);
```
## Pull
This method allow you to pull operations out the stream, in order the pull an operation this method must receive the
operation id, note this method will only have effect on pending operations.

The pending operations will be in queue for later execution in this example the pending operation will be `operationTwo` because for this particular example the `MAX_CONCURRENT_PROMISES` is `1`.

```javascript
const LxStream = new Lx(1);
const operationOne = {
  id: 1,
  cache: true,
  onResult: () => console.log("just this callback will be called"),
  definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
};
const operationTwo = {
  id: 2,
  cache: true,
  onResult: () => console.log("this callback never will be called"),
  definition: () => promiseTimeout(() => Promise.resolve("TEST"), 1000),
};
LxStream.push(operationOne);
LxStream.push(operationTwo);
LxStream.pull(2);
```
## removeFromCache 
This method allow you to delete operations previously saved in cache, this method must receive the
operation id.

Note this method only will take effect if the operation was previously saved in cache
```javascript
 const LxStream = new Lx(1);
 const id = 1;
 const operation = {
   id,
   cache: true,
   onResult: ({ fromCache }) => console.log({ fromCache }),
   definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
 };
 LxStream.push(operation);
 LxStream.push(operation);// this result will come from cache
 setTimeout(() => {
   LxStream.removeFromCache(id);
   LxStream.push(operation);// this result will not come from cache
 }, 1000)
```

## clearCache 
This method allow you to all delete operations previously saved in cache.

Note this method only will take effect if the operations was previously saved in cache.
```javascript
 const LxStream = new Lx(1);
 const id = 1;
 const operation = {
   id,
   cache: true,
   onResult: ({ fromCache }) => console.log({ fromCache }),
   definition: () => promiseTimeout(() => Promise.resolve("TEST"), 0),
 };
 LxStream.push(operation);
 LxStream.push(operation);// this result will come from cache
 setTimeout(() => {
   LxStream.clearCache();// delete cache
   LxStream.push(operation);// this result will not come from cache
 }, 1000)
```

# Inner workings

When you try to push more promises than are allowed into the queue those  promises wait in a pending list of promises without execute, until at least one of the promises in the main queue get resolved or rejected,  when that happend one of the pending promises get push into the main queue.

The same process get execuate over and over againt until all the promises get exectuted.

So this is all for now, be in touch if you have some issue or want to contribute to this project

Fun fact lux means traffic light in latin.
