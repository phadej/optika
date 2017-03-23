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

describe("examples", function () {
  it("arrayOf", function () {
    var actual = o.key("foo").traversed().key("bar").arrayOf(value);
    var expected = [2, 4];
    assert.deepStrictEqual(actual, expected);
  });

  it("arrayOf: immutable", function () {
    var actual = o.imkey("foo").traversed().imkey("bar").arrayOf(imValue);
    var expected = [2, 4];
    assert.deepStrictEqual(actual, expected);
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

  it("set", function () {
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

  it("getter", function () {
    var actual = o.key("foo").to(function (xs) { return xs[0]; }).get(value);
    var expected = value.foo[0];
    assert.strictEqual(actual, expected);
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

  // todo: firstOf
});
