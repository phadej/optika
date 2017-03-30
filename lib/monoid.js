"use strict";

var u = require("./utils.js");

var array = {
  init: function () { return []; },
  empty: [],
  snoc: function (xs, x) {
    xs.push(x);
    return xs;
  },
  append: function (a, b) {
    if (u.isArray(b)) {
      /* if (a.length === 0) {
        return a.concat(b); // we cannot return just `b`, as it might be mutated.
      } else */ if (b.length === 0) {
        return a;
      } else {
        return a.concat(b);
      }
    } else {
      b.forEach(function (x) {
        a.push(x);
      });
      return a;
    }
  },
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

var sum = {
  init: function () { return 0; },
  empty: 0,
  snoc: function (a, b) {
    return a + b;
  },
  append: function (acc, xs) {
    if (u.isArray(xs)) {
      var i = 0;
      var l = xs.length;
      while (i < l) {
        acc += xs[i];
        i += 1;
      }

    } else {
      xs.forEach(function (x) {
        acc += x;
      });
    }

    return acc;
  },
  foldMap: function (f, xs) {
    var acc = 0;
    if (u.isArray(xs)) {
      var i = 0;
      var l = xs.length;
      while (i < l) {
        acc += f(xs[i]);
        i += 1;
      }
      return acc;
    } else {
      xs.forEach(function (x) {
        acc += f(x);
      });
      return acc;
    }
  },
};

module.exports = {
  array: array,
  sum: sum,
};
