# Node.js Continuation Local Storage (CLS) based on call-stack
Continuation Local Storage(CLS) works like thread-local storage in threaded programming,  
but is based on chains of Node-style callbacks instead of threads.  
CLS is very useful to share contexts across async calls in [Node.js](https://nodejs.org/en/).  

Most CLS modules are implemented based on [async_hooks](https://nodejs.org/dist/latest-v16.x/docs/api/async_hooks.html). It is a good feature for CLS.   
But it is still experimental feature and seems to have performance issues.  
So we made a simple CLS module using [call-stack](https://en.wikipedia.org/wiki/Call_stack), not async_hooks.  
The main concept is to mark the unique context key on the call-stack  
and using this key, share the same context across the functions on call-stack.

> Attention:  
> This module is implemented on call-stack basis. so, context cannot be shared in callback function.  
> Because, callback function is performed with a separated call-stack.  
> To expand the context to callback function, you need to wrap the callback function once more.  
> Therefore, this module is recommended for async/await based processing.

# Installation
This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).  
Before installing, [download and install Node.js](https://nodejs.org/en/download/).
node.js v7.6.0 or higher for ES2015 and async function support.

```console
$ npm install node-stack-cls
```

# Example
By wrapping your event handler function, the wrapped subcalls can share the same context storage.  
Under wrapped function, can set/get context anywhere.

```js
import nscls from 'node-stack-cls';

async function handler(event) {
  // set context
  nscls.setContext('foo', 1);
  nscls.setContext('bar', 2);

  await process1();
  await process2();
  return 'ok'
}

async function process1() {
  // get context
  console.log(nscls.getContext('foo'));
  // console out: 1
}

async function process2() {
  // get context
  console.log(nscls.getContext('bar'));
  // console out: 2
}

// wrap user handler function
export default nscls.wrapper(handler);

```

## Expand context to callback function
To expand context to callback function, wrap your callback function once more.
```js
async function handler(event) {
  nscls.setContext('foo', 1);

  asyncProcess().then(nscls.wrapper(result => {
    nscls.getContext('foo');
    // do asynchronous process
  }));

  setTimeout(nscls.wrapper(() => {
    nscls.getContext('foo');
    // do asynchronous process
  }), 10000);

  return 'ok';
}
```
> Note:  
> The context storage is allocated at the time the wrapper is created (not invoke time)  
> and released at the time the wrapper is completed.  
> If the wrapper is not invoked within a certain time, release the context storage.  
> This is to prevent memory leaks, you can change this timer with config api. (default: 60sec)

## Apply to middleware
If use [Koa](https://koajs.com/), you can apply wrapper to middleware.
```js
import Koa from 'koa';
import nscls from 'node-stack-cls';

const app = new Koa();

app.use(async (ctx, next) => {
  await nscls.wrapper(next)();
});
```
If use [express](http://expressjs.com/), you can also apply wrapper to middleware.
```js
import express from 'express';
import nscls from 'node-stack-cls';

const app = new express();

app.use(async (req, res, next) => {
  await nscls.wrapper(next)();
});
```


# API
## Wrap top function for context sharing
**wrapper(func)**  
- *func*: target function to wrap
- *return*: wrapper function

```js
await nscls.wrapper(async () => {
  // do something
})();

// can invoke wrapper with wrapped function args
await nscls.wrapper(async (arg1, arg2) => {
  // do something
})(arg1, arg2);
```

## Access context
**setContext(key, value)**
- *key*: context key to set
- *value*: context value to set
- *return*: none

**getContext(key)**
- *key*: context key to get
- *return*: context value (if not found, return undefined)

```js
nscls.setContext('foo', 1);

nscls.getContext('foo'); // return 1
nscls.getContext('bar'); // return undefined
```

## Change config
**config(option)**
- *option*: option object
  - *wrapperPrefix*: wrapper function name prefix (default: nscls-wrapper)
  - *wrapperWaitTime*: wait msec for wrapper invocation (default: 60000)
- *return*: none
```js
// if you want to change config, please set before start to handle events.
nscls.config({
  wrapperPrefix: 'myprefix', // default: 'nscls-wrapper'
  wrapperWaitTime: 120000    // default: 60000
});
```
