"use strict";

var u = require("./utils.js");

var listUnsafe = {
  empty: [],
  /*
  append: function (a, b) {
    if (a.length === 0) {
      return b;
    } else {
      return a.concat(b);
    }
  },
  */
  foldMap: function (f, xs) {
    var acc = [];
    if (u.isArray(xs)) {
      if (f === u.arraySingleton) {
        return xs;
      } else {
        var i = 0;
        var l = xs.length;
        while (i < l) {
          acc = acc.concat(f(xs[i]));
          i += 1;
        }
        return acc;
      }
    } else {
      xs.forEach(function (x) {
        acc = acc.concat(f(x));
      });
      return acc;
    }
  },
};

module.exports = {
  listUnsafe: listUnsafe,
};
