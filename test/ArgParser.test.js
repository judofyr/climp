import { ArgParser } from "../src/ArgParser.js";
import chai from "chai";

const { assert } = chai;

/**
 *
 * @param {string[]} argv
 */
function parse(argv) {
  let parser = new ArgParser(argv);
  let result = [];
  while (!parser.isDone) {
    result.push({
      current: parser.current,
      isFlag: parser.isFlag,
      isValue: parser.isValue,
    });
    parser.next();
  }
  return result;
}

/** @type {Record<string, any[] | undefined>} */
const CASES = {
  production: [{ current: "production", isFlag: false, isValue: false }],
  "index.js": [{ current: "index.js", isFlag: false, isValue: false }],
  "--force": [{ current: "--force", isFlag: true, isValue: false }],
  "--env": [{ current: "--env", isFlag: true, isValue: false }],
  "--env=production": [
    { current: "--env", isFlag: true, isValue: false },
    { current: "production", isFlag: false, isValue: true },
  ],
  "-f": [{ current: "-f", isFlag: true, isValue: false }],
  "-f=true": [
    { current: "-f", isFlag: true, isValue: false },
    { current: "true", isFlag: false, isValue: true },
  ],
  "-abc": [
    { current: "-a", isFlag: true, isValue: false },
    { current: "-b", isFlag: true, isValue: false },
    { current: "-c", isFlag: true, isValue: false },
  ],
  "-abc=def": [
    { current: "-a", isFlag: true, isValue: false },
    { current: "-b", isFlag: true, isValue: false },
    { current: "-c", isFlag: true, isValue: false },
    { current: "def", isFlag: false, isValue: true },
  ],
};

/**
 *
 * @param  {string[]} args
 */
function assertParses(args) {
  let argv = [];
  let result = [];
  for (let arg of args) {
    let argResult = CASES[arg];
    if (!argResult) throw new Error(`don't know how to parse ${arg}`);
    argv.push(arg);
    result.push(...argResult);
  }

  assert.deepEqual(parse(argv), result);
}

describe("ArgParser", function () {
  it("parses basic options", function () {
    assertParses(["--force", "--env", "production"]);
  });

  it("parses multiple short options", function () {
    assertParses(["-abc"]);
  });

  it("parses values with short options", function () {
    assertParses(["-abc=def"]);
  });

  it("parses long options", function () {
    assertParses(["--env=production", "index.js", "-f"]);
  });

  it("parses combinations correctly", function () {
    let keys = Object.keys(CASES);

    for (let i = 0; i < 500; i++) {
      let args = [];

      let n = (Math.random() * 10) | 0;
      for (let j = 0; j < n; j++) {
        let argIndex = (Math.random() * keys.length) | 0;
        args.push(keys[argIndex]);
      }

      assertParses(args);
    }
  });

  it("supports nextValue() with short options", function () {
    let parser = new ArgParser(["-f=bar"]);
    assert.equal(parser.current, "-f");
    parser.nextValue();
    assert.equal(parser.current, "bar");
    assert(parser.isValue);
  });

  it("supports nextValue() with multiple short options", function () {
    let parser = new ArgParser(["-abcdef"]);
    assert.equal(parser.current, "-a");
    parser.next();
    assert.equal(parser.current, "-b");
    parser.next();
    assert.equal(parser.current, "-c");
    parser.nextValue();
    assert.equal(parser.current, "def");
    assert(parser.isValue);
  });

  it("supports --", function () {
    let parser = new ArgParser(["abc", "-f", "--", "def", "--force", "--"]);

    assert.equal(parser.current, "abc");

    parser.next();
    assert.equal(parser.current, "-f");
    assert(parser.isFlag);

    parser.next();
    assert.equal(parser.current, "def");
    assert(parser.isRest);
    assert(!parser.isFlag);

    parser.next();
    assert.equal(parser.current, "--force");
    assert(parser.isRest);
    assert(!parser.isFlag);

    parser.next();
    assert.equal(parser.current, "--");
    assert(parser.isRest);
    assert(!parser.isFlag);
  });
});
