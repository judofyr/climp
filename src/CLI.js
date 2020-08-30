import { ArgParser } from "./ArgParser.js";
import { Arg } from "./Arg.js";

export class CLI {
  /**
   * @param {(cli: CLI) => void} [setup]
   */
  constructor(setup) {
    /** @type Map<string, Arg> */
    this.triggers = new Map();

    this.rest = new Arg();

    /** @type {Array<(cli: CLI) => void | Promise<void>>} */
    this.tasks = [];

    if (setup) setup(this);
  }

  /**
   *
   * @param {(cli: CLI) => void | Promise<void>} code
   */
  do(code) {
    this.tasks.push(code);
  }

  /**
   *
   * @param  {...string} triggers
   */
  on(...triggers) {
    let arg = new Arg();
    for (let name of triggers) {
      this.triggers.set(name, arg);
    }
    return arg;
  }

  /**
   * @param {string[]} argv
   */
  async run(argv) {
    await this.processArgUntilError(argv);
    await this.processTasks();
  }

  /**
   * @param {string[]} argv
   */
  async processArgUntilError(argv) {
    let parser = new ArgParser(argv);
    for (let current; (current = parser.current) !== undefined; ) {
      try {
        let arg = this._resolveArg(parser, current);
        await arg.process(this, parser);
      } catch (err) {
        // TODO: How to handle errors?
        throw err;
      }
    }
  }

  async processTasks() {
    for (let task of this.tasks) {
      await task(this);
    }
  }

  /**
   * @param {ArgParser} parser
   * @param {string} current
   */
  _resolveArg(parser, current) {
    if (parser.isRest) {
      return this.rest;
    }

    let arg = this.triggers.get(current);

    if (!arg) {
      if (parser.isFlag) {
        throw new Error("unexpected flag");
      }

      return this.rest;
    }

    if (arg.expectsValue) {
      parser.nextValue();
    } else {
      parser.next();
      if (parser.isValue) {
        throw new Error("unexpected value");
      }
    }

    return arg;
  }
}
