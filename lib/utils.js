"use strict";

function isString(s) {
  return typeof s === "string";
}

function isFunction(f) {
  return typeof f === "function";
}

function isArray(a) {
  return Array.isArray(a);
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

/*
function fst(p) {
  return p[0];
}
*/

function snd(p) {
  return p[1];
}

function arraySingleton(x) {
  return [x];
}

module.exports = {
  arraySingleton: arraySingleton,
  assert: assert,
  hasOwn: hasOwn,
  identity: identity,
  isArray: isArray,
  isFunction: isFunction,
  isString: isString,
  snd: snd,
};
