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

/* ForgetNone
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

/* ForgetMaybe
************************************************************************/

var forgetMaybeDef = function () {};

function ForgetMaybe(run) {
  this.classes = "bicontra-choice-strong";
  this.runForgetMaybe = run;
}

ForgetMaybe.def = forgetMaybeDef;

ForgetMaybe.prototype.dimap = function (f, g) {
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  var self = this;
  return new ForgetMaybe(function (x) {
    return self.runForgetMaybe(f(x));
  });
};

ForgetMaybe.prototype.cimap = ForgetMaybe.prototype.dimap;

ForgetMaybe.prototype.first = function () {
  var self = this;
  return new ForgetMaybe(function (x) {
    return self.runForgetMaybe(x[0]);
  });
};

ForgetMaybe.prototype.right = function () {
  var self = this;
  // (a -> r) -> Either c a -> r
  return new ForgetMaybe(function (x) {
    return x[0] ? self.runForgetMaybe(x[1]) : forgetMaybeDef;
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

/* Tagged
************************************************************************/

function Tagged(value) {
  this.classes = "choice";
  this.runTagged = value;
}

Tagged.prototype.dimap = function (f, g) {
  u.assert(u.isFunction(f), "dimap: f should be a function");
  u.assert(u.isFunction(g), "dimap: g should be a function");

  var x = this.runTagged;
  return new Tagged(g(x));
};

Tagged.prototype.right = function () {

  var x = this.runTagged;
  return new Tagged([true, x]);
};

/* Exports
************************************************************************/

module.exports = {
  normaliseClasses: normaliseClasses,
  classesToOpticName: classesToOpticName,
  Forget: Forget,
  ForgetMaybe: ForgetMaybe,
  ForgetNone: ForgetNone,
  Func: Func,
  Tagged: Tagged,
};
