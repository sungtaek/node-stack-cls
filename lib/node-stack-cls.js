'use strict';

var crypto = require('crypto');

var contexts = {};

var nsclsConfig = {
  wrapperPrefix: 'nscls-wrapper',
  wrapperWaitTime: 60000
}

function config(options) {
  nsclsConfig = Object.assign(nsclsConfig, options);
}

function wrapper(func) {
  var key = findKey() || `${nsclsConfig.wrapperPrefix}-${uuid()}`;

  allocContext(key);
  var runWaitTimer = setTimeout(() => {
    releaseContext(key);
  }, nsclsConfig.wrapperWaitTime);

  var _wrapper = async (...args) => {
    clearTimeout(runWaitTimer);
    try {
      return await func(...args);
    } finally {
      releaseContext(key);
    }
  }
  Object.defineProperty(_wrapper, 'name', {value: key, writable: false});
  return _wrapper;
}

function allocContext(key) {
  if (contexts[key]) {
    contexts[key]._ref++;
  } else {
    contexts[key] = {
      _ref: 1
    };
  }
}

function releaseContext(key) {
  if (contexts[key]) {
    contexts[key]._ref--;
    if (contexts[key]._ref <= 0) {
      delete contexts[key];
    }
  }
}

function setContext(name, value) {
  var key = findKey();
  if (key) {
    var context = contexts[key];
    if (context) {
      context[name] = value;
    }
  }
}

function getContext(name) {
  var key = findKey();
  if (key) {
    var context = contexts[key];
    if (context)
      return context[name];
  }
}

function findKey() {
  var oldStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, structuredStackTrace) => structuredStackTrace;
  var stack = new Error().stack;
  Error.prepareStackTrace = oldStackTrace;
  for (var i = stack.length - 1 ; i >= 0; i--) {
    var funcName = stack[i].getFunctionName();
    if (funcName && funcName.startsWith(nsclsConfig.wrapperPrefix)) {
      return funcName;
    }
  }
}

function uuid() {
  return crypto.randomBytes(16).toString('hex');
}

var nscls = {
  config,
  wrapper,
  setContext,
  getContext,
};

module.exports = nscls;
module.exports.default = nscls;
