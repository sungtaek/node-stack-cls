# Call-stack based Continuation Local Storage
Continuation Local Storage(CLS) works like thread-local storage in threaded programming,  
but is based on chains of Node-style callbacks instead of threads.  
CLS is very useaful to share contexts across async calls in [Node.js](https://nodejs.org/en/).  

Most CLS modules are implemented based on [async_hooks](https://nodejs.org/docs/latest-v8.x/api/async_hooks.html).  
async_hook is a very good feature, but it still seems to have performance issues.  
So we made a simple CLS module using call-stack rather than async_hooks.

> Attention:  
> This module is implemented on call-stack basis. so, context cannot be shared in callback function.  
> Because, callback function is performed with a separate call-stack.  
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
  nscle.setContext('foo', 1);
  nscle.setContext('bar', 2);

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
export nscls.wrapper(handler);

```

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

## Expand context to callback function
To expand context to callback function, wrap your callback function once more.
```js
async function handler(ctx) {
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
> In order to prevent memory leaks, if the wrapper is not invoked within a certain time,  
> release the context storage. (default: 60 seconds)  
> So, the callback function must be performed within this time.  
> You can change this value from config.

# API
## Wrap top function for context sharing
**wrapper(func)**  
- *func*: target function to wrap
- *return*: wrapper function
- you can invoke wrapper function with wrapped function args

## Access context
**setContext(key, value)**
- *key*: context key to set
- *value*: context value to set
- *return*: none

**getContext(key, value)**
- *key*: context key to get
- *return*: context value (if not found, return undefined)

## Change config
**config(option)**
- *option*:
  - *wrapperPrefix*: wrapper function name prefix (default: nscls-wrapper)
  - *wrapperWaitTime*: wait msec for wrapper invocation (default: 60000)