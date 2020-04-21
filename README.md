# Lux-io
Lux io is a simple class that allow you to perform promises excecutions in queue, the excecution queue have a maximum number of concurrent promises that can be execute at the same time.

The applications in this library have no limits, only your imagination.

# Instalation
```
npm install lux-io --save
```

# Get started
In order to use lux-io you should import it first, then create a new instance of the class lx, now the instance have the main method of lux-io which is `push`, this method allow you to add n amount of operations, a operation is defined as and object that have all information to perform a promise execution

```javascript
// import lux-io
import { Lx } from 'lux-io'; #import lux-io as lx
const stream = new Lx(1);// as unique argument the contructor receive the maximum number of promises to executate at the same time.
const operation = {
  id: 1,
  onResult: ({result, fromCache}) => console.log({ result, fromCache }), // { result: 1, fromCache: false }
  definition: () => Promise.resolve(1)
}; # define operation to perform

stream.push(operation);
```
The operation object must have this shape:

| key        | value            | required  | default    | description                                                | 
|:----------:|:-----------------|:----------|:-----------|:-----------------------------------------------------------|
| id         | Number or String | true      | undefined  | Unique identifier                                          |
| cache      | Function         | true      | undefined  | Flag that allows you to save the promise result in cache   |
| definition | Function         | true      | undefined  | A function that must return the  promise to execute        |
| onResponse | Function         | false     | undefined  | A function that is called when the promise finish          |

# Use cases
`lux-io` can be very handy in the cases like:
- Reduce the server load by limiting the amount in requests sended by the client at the same time.
- Use the cache for speed the time response of a program like an ajax call, or database request.

# Examples

## Push multiples operations
In this example you will notice that only 2 promises are executed at a time regardless of the time it takes to finish, this behavior occurs because the maximum number of promises to execute at the same time is 2, in this case lux-io will give you execution priority to the first 2 promises pushed, when one of those ends it will continue with the next one in the pending list.

```javascript
import { lx } from 'lux-io';// import lux-io as lx
const LxStream = new Lx(2);

function promiseTimeout(cb, TIME) {
  return new Promise((resolve, reject) => {
    setTimeout(() => cb().then(resolve).catch(reject), TIME);
  });
};

const operationOne = {
  id: 1,
  cache: true,
  onResponse: ({result}) => console.log({result}),
  definition: () => promiseTimeout(() => Promise.resolve(1), 1000),
};

const operationTwo = {
  id: 2,
  cache: true,
  onResponse: ({result}) => console.log({result}),
  definition: () => promiseTimeout(() => Promise.resolve(2), 500),
};

const operationThree = {
  id: 3,
  cache: true,
  onResponse: ({result}) => console.log({result}),
  definition: () => promiseTimeout(() => Promise.resolve(3), 100),
};
LxStream.push(operationOne);// { result: 1 }
LxStream.push(operationTwo);// { result: 2 }
LxStream.push(operationThree);// { result: 3 }
```

## Using cache
`lux-io` will try to cache the result of the promises executed in previous executions and if other operation with an id equals to a previus operation execuated is pushed into the stream `lux-io` will return the result from cache aslong the cache property is set to true.

Note that this feature really depends of the time execution, this also depends of the maximum concurrent promises allowed settled in the creation of the instance, so for this reaseon the cache maybe not work if the first promise execution don't match in the time that other promise with the same id is pushed into the stream,  this escenation the cache could be empty.

You can also can deactivate the `cache` by set the property to `false` in that case all the cache thing will be ignored

```javascript
 const LxStream = new Lx(1);

 const operationOne = {
  id: 1,
  cache: true,
  onResult: ({ fromCache }) => console.log({fromCache}),// { fromCache: false }
  definition: () => Promise.resolve(1),
};
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
import { lx } from 'lux-io';
const LxStream = new LuxIo(2);

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


# Inner workings

When you try to push more promises than are allowed into the queue those  promises wait in a pending list of promises whitout execute, until at least one of the promises in the main queue get resolved or rejected,  when that happend one of the pending promises get push into the main queue.

The same process get execuate over and over againt until all the promises get exectuted.

So this is all for now, be in touch if you have some issue or want to contribute to this project

