"use strict";

function isString(s) {
  return typeof s === "string";
}

function isFunction(f) {
  return typeof f === "function";
}

function assert(cond, msg) {
  if (!cond) {
    if (isFunction(msg)) {
      msg = msg();
    }

    throw new Error(msg);
  }
}

function identity(x) {
  return x;
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = {
  identity: identity,
  isString: isString,
  isFunction: isFunction,
  assert: assert,
  hasOwn: hasOwn,
};
