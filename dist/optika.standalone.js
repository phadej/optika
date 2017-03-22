(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.optika = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
/**
  # Optika

  <img src="https://raw.githubusercontent.com/phadej/optika/master/optika-300.png" align="right" height="100" />

  > Optics: modular data access

  [![Build Status](https://secure.travis-ci.org/phadej/optika.svg?branch=master)](http://travis-ci.org/phadej/optika)
  [![NPM version](https://badge.fury.io/js/optika.svg)](http://badge.fury.io/js/optika)
  [![Dependency Status](https://david-dm.org/phadej/optika.svg)](https://david-dm.org/phadej/optika)
  [![devDependency Status](https://david-dm.org/phadej/optika/dev-status.svg)](https://david-dm.org/phadej/optika#info=devDependencies)

  ## Getting Started

  Install the module with: `npm install optika`

  ## Synopsis

  ```javascript
  var o = require("optika");

  var value = {
    foo: [
      { bar: 2, baz: 3 },
      { bar: 4, baz: 5 },
    ]
  };

  // [2, 4]
  o.key("foo").traversed().key("bar").arrayOf(value);

  // { foo: [ { bar: 9, baz: 3 }, { bar: 11, baz: 5 } ] }
  o.key("foo").traversed().key("bar").over(value, function (x) {
    return x + 7;
  });
  ```

  ## Motivation

  [Immutable.js](https://facebook.github.io/immutable-js/) is great!
  But working with immutable containers & nested records is un-easy:

  ```javascript
  return data.update("months", months =>
    months.map(month =>
      month.update("days", days =>
        days.map(day => injectAuxData(day, auxiliaryData))
      )
    )
  );
  ```

  The `updateIn` isn't powerful enough to make the drilling less boilerplaty
  (and less error-prone).

  If you are a Haskell programmer, you might know that *lenses* are a solution
  to this problem:

  ```haskell
  data_ & months . traversed . days . traversed %~ \day ->
    injectAuxData day auxData

  -- or without operators:
  over
    (months . traversed . days . traversed)
    (\day -> injectAuxData day auxData)
    data_
  ```

  And with this library you can write similar code in JavaScript:

  ```javascript
  o.imkey("months".traversed().imkey("days").traversed().over(data, day =>
    injectAuxData(day, auxData)
  );
  ```
*/

"use strict";

/**
  ## Documentation

  There is small amount of run-time validation.
  For example, if you try to *set* over `Getter`, the exception will be thrown:
  ```javascript
  o.key("foo").to(function (x) { return x[0]; }).set(value, 42);
  // throws: Trying to run Traversal operation via Getter
  ```
*/

// var assert = require("assert");

var monoid = require("./monoid.js");
var profunctor = require("./profunctor.js");
var u = require("./utils.js");

function arraySingleton(x) {
  return [x];
}

function Optic(classes, run) {
  this.classes = classes;
  this.unsafeRun = run;
}

/**
  ### Operations
*/

/**
  - `get(this: Getter<S,A>, value: S): A`
*/
Optic.prototype.get = function (value) {
  var optic = this;

  // profunctor
  var p = new profunctor.ForgetNone(u.identity);

  // run optic
  return optic.run(p).runForgetNone(value);
};

/**
  - `set(this: Traversal<S,T,A,B>, value: S, b: B): T`
*/
Optic.prototype.set = function (value, b) {
  return this.over(value, function () { return b; });
};

/**
  - `over(this: Traversal<S,T,A,B>, value: S, f: A => B): T`
*/
Optic.prototype.over = function (value, f) {
  var optic = this;

  // profunctor
  var p = new profunctor.Func(f);

  // run optic
  return optic.run(p).runFunc(value);
};

/**
  - `arrayOf(this: Fold<S,T,A,B>, value: S): Array<A>`
*/
Optic.prototype.arrayOf = function (value) {
  var optic = this;

  // profunctor
  var p = new profunctor.Forget(monoid.listUnsafe, arraySingleton);

  // run optic
  return optic.run(p).runForget(value);
};

/**
  ### Constructors
*/

/**
 - `lens(getter: S => A, setter: (S, B) => T): Lens<S,T,A,B>`
*/
function lens(getter, setter) {
  u.assert(u.isFunction(getter), "lens: getter should be a function");
  u.assert(u.isFunction(setter), "lens: setter should be a function");

  function getter2(s) {
    return [getter(s), function (b) { return setter(s, b); }];
  }

  function setter2(tuple) {
    return tuple[1](tuple[0]);
  }

  return new Optic("strong", function (p) {
    return p.first().dimap(getter2, setter2);
  });
}

/**
 - `traversed(): Traversal<F<A>,F<B>,A,B>`

    Creates traversal for everything with `.map` and `.forEach`.
*/
function traversed() {
  return new Optic("wander", function (p) {
    return p.wander();
  });
}

/**
  - `to(f: S => A): Getter<S,A>`
*/
function to(f) {
  return new Optic("bicontra", function (p) {
    return p.cimap(f, f);
  });
}

/**
  ### Convenient optics
*/

/**
  - `key(K: keyof (S & T)): Lens<S,T,S[K],T[K]>`

    Works for *plain-old-javascriot-objects*, i.e. POJOs :)
*/
function key(k) {
  u.assert(u.isString(k), "key: k should be a string");

  return lens(function (s) { return s[k]; }, function (s, b) {
    var t = {};
    for (var l in s) {
      if (l === k) {
        t[l] = b;
      } else if (u.hasOwn(s, l)) {
        t[l] = s[l];
      }
    }
    return t;
  });
}

/**
  - `imkey(K: keyof (S & T)): Lens<S,T,S[K],T[K]>`

    Works with everyting supporting `.get` and `.set`, e.g.
    [Immutable](http://facebook.github.io/immutable-js/).
*/
function imkey(k) {
  u.assert(u.isString(k), "key: k should be a string");

  return lens(
    function (s) { return s.get(k); },
    function (s, b) { return s.set(k, b); });
}

/**
  ### Internals

  Functions which you probably never need to use directly.
*/

/**
  `.o(this: Optic<S,T,A,B>, other: Optic<A,B,U,V>): Optic<S,T,U,V>`

  Compose two optics.
*/
Optic.prototype.o = function o(other) {
  var self = this;
  var classes = profunctor.normaliseClasses(self.classes, other.classes);

  // TODO: optimise to compose in `_run`.
  return new Optic(classes, function (p) {
    return self.unsafeRun(other.unsafeRun(p));
  });
};

/**
  `.run(this: Optic<S,T,A,B>, p: Profunctor<A,B>): Profunctor<S,T>`
*/
Optic.prototype.run = function (p) {
  var thisClasses = this.classes;
  var combined = profunctor.normaliseClasses(thisClasses, p.classes);
  u.assert(combined === p.classes, function () {
    return [
      "Trying to run",
      profunctor.classesToOpticName(p.classes),
      "operation via",
      profunctor.classesToOpticName(thisClasses),
    ].join(" ");
  });
  return this.unsafeRun(p);
};

// Exports

var constructors = [
  imkey,
  key,
  lens,
  traversed,
  to,
];

var optics = {};
constructors.forEach(function (ctr) {
  // export
  optics[ctr.name] = ctr;

  // Optics.prototype postcomposed
  Optic.prototype[ctr.name] = function () {
    var other = ctr.apply(undefined, arguments);
    return this.o(other);
  };
});

// Additional exports

module.exports = optics;

// plain ../FAQ.md
/// plain ../CONTRIBUTING.md
/// plain ../CHANGELOG.md
/// plain ../related-work.md
/// plain ../LICENSE

},{"./monoid.js":1,"./profunctor.js":3,"./utils.js":4}],3:[function(require,module,exports){
"use strict";

var u = require("./utils.js");

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

function Forget(monoid, run) {
  this.classes = "bicontra-choice-strong-wander";
  this.monoid = monoid;
  this.runForget = run;
}

Forget.prototype.dimap = function (f, g) {
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  var self = this;
  return new Forget(self.monoid, function (x) {
    return self.runForget(f(x));
  });
};

// Bicontravariant's cimap is the same as dimap!
Forget.prototype.cimap = Forget.prototype.dimap;

Forget.prototype.first = function () {
  var self = this;
  return new Forget(self.monoid, function (x) {
    return self.runForget(x[0]);
  });
};

Forget.prototype.wander = function () {
  var self = this;
  return new Forget(self.monoid, function (xs) {
    var acc = self.monoid.empty;
    xs.forEach(function (x) {
      acc = self.monoid.append(acc, self.runForget(x));
    });
    return acc;
  });
};

/* Forget variants
************************************************************************/

function ForgetNone(run) {
  this.classes = "bicontra-strong";
  this.runForgetNone = run;
}

ForgetNone.prototype.dimap = function (f, g) {
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  var self = this;
  return new ForgetNone(function (x) {
    return self.runForgetNone(f(x));
  });
};

ForgetNone.prototype.cimap = ForgetNone.prototype.dimap;

ForgetNone.prototype.first = function () {
  var self = this;
  return new ForgetNone(function (x) {
    return self.runForgetNone(x[0]);
  });
};

/* Function
************************************************************************/

function Func(run) {
  this.classes = "choice-strong-wander";
  this.runFunc = run;
}

Func.prototype.dimap = function (f, g) {
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  var self = this;
  return new Func(function (x) {
    return g(self.runFunc(f(x)));
  });
};

Func.prototype.first = function () {
  var self = this;
  return new Func(function (p) {
    return [self.runFunc(p[0]), p[1]];
  });
};

Func.prototype.wander = function () {
  var self = this;
  return new Func(function (xs) {
    return xs.map(function (x) {
      return self.runFunc(x);
    });
  });
};

module.exports = {
  normaliseClasses: normaliseClasses,
  classesToOpticName: classesToOpticName,
  Forget: Forget,
  ForgetNone: ForgetNone,
  Func: Func,
};

},{"./utils.js":4}],4:[function(require,module,exports){
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

},{}]},{},[2])(2)
});