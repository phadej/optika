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

function Optic(classes, parts) {
  u.assert(u.isString(classes), "new Optic: classes should be string");
  u.assert(u.isArray(parts), "new Optic: parts should be an array");

  this.classes = classes;
  this.parts = parts;
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
  u.assert(u.isFunction(f), "over: f should be a function");

  var optic = this;

  // profunctor
  var p = new profunctor.Func(f);

  // run optic
  return optic.run(p).runFunc(value);
};

/**
  - `review(this: Prism<S,T,A,B>, value: B): T`
  - `review(this: Iso<S,T,A,B>, value: B): T`

  Construct value thru `Prism` or `Iso`.
*/
Optic.prototype.review = function (value) {
  var optic = this;

  // profunctor
  var p = new profunctor.Tagged(value);

  // run optic
  return optic.run(p).runTagged;
};

/**
  - `affineView(this: Affine<S,T,A,B>, def: A): A

  For operation working with `Fold`, see `firstOf`.
*/
Optic.prototype.affineView = function (value, def) {
  var optic = this;

  // profunctor
  var p = new profunctor.ForgetMaybe(u.identity);

  // run optic
  var x = optic.run(p).runForgetMaybe(value);
  return x === profunctor.ForgetMaybe.def ? def : x;
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

function lensSetter(tuple) {
  return tuple[1](tuple[0]);
}

/**
 - `lens(getter: S => A, setter: (S, B) => T): Lens<S,T,A,B>`
*/
function lens(getter, setter) {
  u.assert(u.isFunction(getter), "lens: getter should be a function");
  u.assert(u.isFunction(setter), "lens: setter should be a function");

  function getter2(s) {
    return [getter(s), function (b) { return setter(s, b); }];
  }

  return new Optic("strong", [function (p) {
    return p.first().dimap(getter2, lensSetter);
  }]);
}

/**
 - `traversed(): Traversal<F<A>,F<B>,A,B>`

    Creates traversal for everything with `.map` and `.forEach`.
*/
function traversed() {
  return new Optic("wander", [function (p) {
    return p.wander();
  }]);
}

/**
  - `to(f: S => A): Getter<S,A>`
*/
function to(f) {
  return new Optic("bicontra", [function (p) {
    return p.cimap(f, f);
  }]);
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

// prism :: forall s t a b. (b -> t) -> (s -> Either t a) -> Prism s t a b
// prism to fro pab = dimap fro (either id id) (right (rmap to pab))

/**
  - `filtered(pred: A => boolean): Prism<A,A,A',A'>`

  *Note*: The predicate is checked when the value is injected (via `Traversal`)
  or constructed via `Prism`.
*/
function filtered(pred) {
  u.assert(u.isFunction(pred), "filtered: pred should be a function");

  // s -> Either t a
  function filteredGetter(x) {
    return [pred(x), x];
  }

  return new Optic("choice", [function (p) {
    return p.right().dimap(filteredGetter, u.snd);
  }]);
}

/**
  - `safeFiltered(pred: A => boolean): Prism<A,A,A',A'>`

  Like `filtered` but predicate is checked on construction.
*/
function safeFiltered(pred) {
  u.assert(u.isFunction(pred), "safeFiltered: pred should be a function");

  // s -> Either t a
  function filteredGetter(x) {
    return [pred(x), x];
  }

  function check(x) {
    // TODO: throw own exception.
    u.assert(pred(x), "safeFiltered: construction of invalid value");
    return x;
  }

  return new Optic("choice", [function (p) {
    return p.dimap(u.identity, check).right().dimap(filteredGetter, u.snd);
  }]);
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

  return new Optic(classes, other.parts.concat(this.parts));
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

  var parts = this.parts;
  for (var i = 0; i < parts.length; i++) {
    p = parts[i](p);
  }
  return p;
};

// Exports

var constructors = [
  filtered,
  imkey,
  key,
  lens,
  safeFiltered,
  to,
  traversed,
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
/// plain ../implementation-details.md
/// plain ../related-work.md
/// plain ../LICENSE
