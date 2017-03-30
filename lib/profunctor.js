"use strict";

var u = require("./utils.js");
var c = require("./convenience.js");

// adds superclasses and sorts
function normaliseClasses() {
  var bicontra = false;
  var choice = false;
  var strong = false;
  var wander = false;

  for (var i = 0; i < arguments.length; i++) {
    var classes = arguments[i].split(/-/);
    for (var j = 0; j < classes.length; j++) {
      switch (classes[j]) {
        case "bicontra":
          bicontra = true;
          break;
        case "choice":
          choice = true;
          break;
        case "strong":
          strong = true;
          break;
        case "wander":
          choice = true;
          strong = true;
          wander = true;
          break;
        // no default
      }
    }
  }

  var res = [];
  // Note: those are in alphabetic order!
  if (bicontra) { res.push("bicontra"); }
  if (choice) { res.push("choice"); }
  if (strong) { res.push("strong"); }
  if (wander) { res.push("wander"); }

  return res.join("-");
}

var classesMap = {
  "": "Iso",
  bicontra: "Getter",
  "bicontra-strong": "Getter",
  strong: "Lens",
  choice: "Prism",
  "choice-strong": "Affine",
  "choice-strong-wander": "Traversal",
  "bicontra-choice": "Fold",
  "bicontra-choice-strong": "Fold",
  "bicontra-choice-strong-wander": "Fold",
};

function classesToOpticName(classes) {
  return classesMap[classes] || classes;
}

/* Forget
************************************************************************/

// Monoid r => Forget a r = a -> r

function forgetDimap(f, g, self) {
  u.assert(arguments.length === 3, "dimap: there should be 3 arguments");
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  return function (x) {
    return self(f(x));
  };
}

function newDictForget(monoid) {
  return c({
    classes: "bicontra-choice-strong-wander",
    dimap: forgetDimap,
    cimap: forgetDimap,
    first: function (self) {
      u.assert(arguments.length === 1, "first: there should be 1 argument");
      return function (x) {
        return self(x[0]);
      };
    },
    right: function (self) {
      u.assert(arguments.length === 1, "right: there should be 1 argument");
      return function (x) {
        return x[0] ? self(x[1]) : monoid.empty;
      };
    },
    wander: function (self) {
      u.assert(arguments.length === 1, "wander: there should be 1 argument");
      return function (xs) {
        return monoid.foldMap(self, xs);
      };
    },
  });
}

/* ForgetNone
************************************************************************/

// ForgetNone r a b = a -> r

var dictForgetNone = c({
  classes: "bicontra-strong",
  dimap: forgetDimap,
  cimap: forgetDimap,
  first: function (self) {
    u.assert(arguments.length === 1, "first: there should be 1 argument");
    return function (x) {
      return self(x[0]);
    };
  },
});

/* ForgetMaybe
************************************************************************/

// ForgetMaybe r a b = a -> Maybe r

function forgetMaybeDef() {}

var dictForgetMaybe = c({
  classes: "bicontra-choice-strong",
  def: forgetMaybeDef,
  dimap: forgetDimap,
  cimap: forgetDimap,
  first: function (self) {
    u.assert(arguments.length === 1, "first: there should be 1 argument");
    return function (x) {
      return self(x[0]);
    };
  },
  right: function (self) {
    u.assert(arguments.length === 1, "right: there should be 1 argument");
    return function (x) {
      return x[0] ? self(x[1]) : forgetMaybeDef;
    };
  },
});

/* Function
************************************************************************/

// Func a b = a -> b

var dictFunc = c({
  classes: "choice-strong-wander",
  dimap: function (f, g, self) {
    u.assert(arguments.length === 3, "dimap: there should be 3 arguments");
    u.assert(u.isFunction(f), "dimap: f should be a function");
    u.assert(u.isFunction(g), "dimap: g should be a function");

    return function (x) {
      return g(self(f(x)));
    };
  },
  first: function (self) {
    u.assert(arguments.length === 1, "first: there should be 1 argument");
    return function (p) {
      return [self(p[0]), p[1]];
    };
  },
  right: function (self) {
    u.assert(arguments.length === 1, "right: there should be 1 argument");
    return function (x) {
      return [x[0], x[0] ? self(x[1]) : x[1]];
    };
  },
  wander: function (self) {
    u.assert(arguments.length === 1, "wander: there should be 1 argument");
    return function (xs) {
      return xs.map(self);
    };
  },
});

/* Tagged
************************************************************************/

// Tagged a b = b

var dictTagged = c({
  classes: "choice",
  dimap: function (f, g, x) {
    u.assert(arguments.length === 3, "dimap: there should be 3 arguments");
    u.assert(u.isFunction(f), "dimap: f should be a function");
    u.assert(u.isFunction(g), "dimap: g should be a function");
    return g(x);
  },
  right: function (x) {
    u.assert(arguments.length === 1, "right: there should be 1 argument");
    return [true, x];
  },
});

/* Neglect sum
************************************************************************/

// Neglect a b = LMap (c -> a) (Neglect a b) | ...

var firstTag = ["first"];
var wanderTag = ["wander"];
var rightTag = ["right"];

function neglectDimap(f, g, x) {
  u.assert(arguments.length === 3, "dimap: there should be 3 arguments");
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  x.push(f);
  return x;
}

// Warning: functions in dictionary mutate the passed in x
var dictNeglect = c({
  classes: "bicontra-choice-strong-wander",
  dimap: neglectDimap,
  cimap: neglectDimap,
  first: function (x) {
    u.assert(arguments.length === 1, "first: there should be 1 argument");

    x.push(firstTag);
    return x;
  },
  key: function (k, x) {
    u.assert(arguments.length === 2, "key: there should be 2 arguments");
    u.assert(u.isString(k), "key: k should be a string");

    x.push(k);
    return x;
  },
  wander: function (x) {
    u.assert(arguments.length === 1, "wander: there should be 1 argument");

    x.push(wanderTag);
    return x;
  },
  right: function (x) {
    x.push(rightTag);
    return x;
  },

  // tags
  wanderTag: wanderTag,
  firstTag: firstTag,
  rightTag: rightTag,
});

/* Exports
************************************************************************/

module.exports = {
  classesToOpticName: classesToOpticName,
  normaliseClasses: normaliseClasses,

  dictForgetMaybe: dictForgetMaybe,
  dictForgetNone: dictForgetNone,
  dictFunc: dictFunc,
  dictTagged: dictTagged,
  dictNeglect: dictNeglect,
  newDictForget: newDictForget,
};
