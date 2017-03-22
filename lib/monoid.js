"use strict";

var listUnsafe = {
  empty: [],
  append: function (a, b) {
    if (a.length === 0) {
      return b;
    } else {
      return a.concat(b);
    }
  },
};

module.exports = {
  listUnsafe: listUnsafe,
};
