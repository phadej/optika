/* jshint node:true */
/* global describe, it:true */
"use strict";

var o = require("../lib/optika.js");
var assert = require("assert");
var im = require("immutable");

var value = {
  foo: [
    { bar: 2, baz: 3 },
    { bar: 4, baz: 5 },
  ],
  quu: "foobar",
};

var imValue = im.fromJS(value);

function nonEmpty(x) { return x !== ""; }
function constTrue() { return true; }
function odd(x) { return x % 2 === 1; }
function inc2(x) { return x + 2; }

describe("examples", function () {
  describe("arrayOf", function () {
    it("readme", function () {
      var actual = o.key("foo").traversed().key("bar").arrayOf(value);
      var expected = [2, 4];
      assert.deepStrictEqual(actual, expected);
    });

    it("array", function () {
      var xs = [1, 2, 3, 4, 5];
      var actual = o.traversed().arrayOf(xs);
      var expected = xs;
      // not not deep equal!
      assert.strictEqual(actual, expected);
    });

    it("immutable", function () {
      var actual = o.imkey("foo").traversed().imkey("bar").arrayOf(imValue);
      var expected = [2, 4];
      assert.deepStrictEqual(actual, expected);
    });

    it("with filtered", function () {
      var xss = [[1, 2], [3, 4, 5], [6, 7]];
      var actual = o.traversed().traversed().filtered(odd).arrayOf(xss);
      var expected = [1, 3, 5, 7];
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe("sumOf", function () {
    it("readme", function () {
      var actual = o.key("foo").traversed().key("bar").sumOf(value);
      var expected = 6;
      assert.strictEqual(actual, expected);
    });

    it("array", function () {
      var xs = [1, 2, 3, 4, 5];
      var actual = o.traversed().sumOf(xs);
      var expected = 15;
      assert.strictEqual(actual, expected);
    });

    it("immutable", function () {
      var actual = o.imkey("foo").traversed().imkey("bar").sumOf(imValue);
      var expected = 6;
      assert.strictEqual(actual, expected);
    });

    it("with filtered", function () {
      var xss = [[1, 2], [3, 4, 5], [6, 7]];
      var actual = o.traversed().traversed().filtered(odd).sumOf(xss);
      var expected = 16;
      assert.strictEqual(actual, expected);
    });
  });

  it("over", function () {
    var actual = o.key("foo").traversed().key("bar").over(value, function (x) {
      return x + 7;
    });
    var expected = {
      foo: [
        { bar: 9, baz: 3 },
        { bar: 11, baz: 5 },
      ],
      quu: "foobar",
    };
    assert.deepStrictEqual(actual, expected);
  });

  it("over: immutable", function () {
    var actual = o.imkey("foo").traversed().imkey("bar").over(imValue, function imm(x) {
      return x + 7;
    }).toJS();
    var expected = {
      foo: [
        { bar: 9, baz: 3 },
        { bar: 11, baz: 5 },
      ],
      quu: "foobar",
    };
    assert.deepStrictEqual(actual, expected);
  });

  it("over: with filtered", function () {
    var xss = [[1, 2], [3, 4, 5], [6, 7]];
    var actual = o.traversed().traversed().filtered(odd).over(xss, inc2);
    var expected = [[3, 2], [5, 4, 7], [6, 9]];
    assert.deepStrictEqual(actual, expected);
  });

  describe("set", function () {
    it("simple", function () {
      var actual = o.key("foo").traversed().key("bar").set(value, 42);
      var expected = {
        foo: [
          { bar: 42, baz: 3 },
          { bar: 42, baz: 5 },
        ],
        quu: "foobar",
      };
      assert.deepStrictEqual(actual, expected);
    });

    it("idx", function () {
      var actual = o.key("foo").idx(1).key("bar").set(value, 42);
      var expected = {
        foo: [
          { bar: 2, baz: 3 },
          { bar: 42, baz: 5 },
        ],
        quu: "foobar",
      };
      assert.deepStrictEqual(actual, expected);
    });

    it("imidx", function () {
      var actual = o.imkey("foo").imidx(1).imkey("bar").set(imValue, 42).toJS();
      var expected = {
        foo: [
          { bar: 2, baz: 3 },
          { bar: 42, baz: 5 },
        ],
        quu: "foobar",
      };
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe("custom", function () {
    it("lens get", function () {
      var id = function (x) { return x; };
      var l = o.lens(id, id);

      var actual = l.get(42);
      var expected = 42;
      assert.strictEqual(actual, expected);
    });

    it("lens set", function () {
      var id = function (x) { return x; };
      var l = o.lens(id, function (s, b) { return b; });

      var actual = l.set(42, 7);
      var expected = 7;
      assert.strictEqual(actual, expected);
    });
  });

  describe("getter", function () {
    it("simple", function () {
      var actual = o.key("foo").to(function (xs) { return xs[0]; }).get(value);
      var expected = value.foo[0];
      assert.strictEqual(actual, expected);
    });

    it("idx", function () {
      var actual = o.key("foo").idx(1).key("bar").get(value);
      var expected = 4;
      assert.strictEqual(actual, expected);
    });

    it("imidx", function () {
      var actual = o.imkey("foo").imidx(1).imkey("bar").get(imValue);
      var expected = 4;
      assert.strictEqual(actual, expected);
    });
  });

  it("set with getter throws", function () {
    assert.throws(function () {
      o.key("foo").to(function (x) { return x[0]; }).set(value, 42);
    });
  });

  describe("affineView", function () {
    it("existing value", function () {
      var actual = o.key("quu").affineView(value, "none");
      var expected = "foobar";
      assert.strictEqual(actual, expected);
    });

    it("non-existing value", function () {
      var actual = o.key("quu").filtered(nonEmpty).affineView({ quu: "" }, "none");
      var actual2 = o.key("quu").safeFiltered(nonEmpty).affineView({ quu: "" }, "none");
      var expected = "none";
      assert.strictEqual(actual, expected);
      assert.strictEqual(actual2, expected);
    });

    it("nested non-existing", function () {
      var actual = o.key("quu").filtered(constTrue).filtered(nonEmpty).affineView({ quu: "" }, "none");
      var expected = "none";
      assert.strictEqual(actual, expected);
    });
  });

  describe("review", function () {
    it("works thru prism", function () {
      var actual = o.filtered(nonEmpty).review("foobar");
      var actual2 = o.safeFiltered(nonEmpty).review("foobar");
      var expected = "foobar";
      assert.strictEqual(actual, expected);
      assert.strictEqual(actual2, expected);
    });

    it("works thru violating filtered", function () {
      var actual = o.filtered(nonEmpty).review("");
      var expected = "";
      assert.strictEqual(actual, expected);
    });

    it("throws thru violation safeFiltered", function () {
      assert.throws(function () {
        o.safeFiltered(nonEmpty).review("");
      });
    });
  });

  describe("regressions", function () {
    it("axay", function () {
      var axay = [{ x: [{ y: 1 }] }];
      var actual = o.idx(0).key("x").idx(0).key("y").get(axay);
      var expected = 1;
      assert.strictEqual(actual, expected);
    });
  });

  // todo: firstOf
});
