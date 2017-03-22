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
});
