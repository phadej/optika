"use strict";

var u = require("./utils.js");

function key(k, x0) {
  /* jshint validthis:true */
  u.assert(arguments.length === 2, "key: there should be 1 argument");
  u.assert(u.isString(k), "key: k should be a string");

  // eslint-disable-next-line no-invalid-this
  var dict = this;

  function getter(s) {
    return [s[k], s];
  }

  function setter(p) {
    var s = p[1];
    var t = {};
    for (var l in s) {
      if (l === k) {
        t[l] = p[0];
      } else if (u.hasOwn(s, l)) {
        t[l] = s[l];
      }
    }
    return t;
  }

  // execution
  var x1 = dict.first(x0);
  var x2 = dict.dimap(getter, setter, x1);
  return x2;
}

// convenience adds convenience functions to the dictionaries
function convenience(dict) {
  if (dict.classes.indexOf("strong") !== -1) {
    if (!dict.key) { dict.key = key; }
  }

  return dict;
}

module.exports = convenience;
