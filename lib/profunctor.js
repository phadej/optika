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
