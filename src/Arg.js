import { Box } from "./Box.js";
import { CLI } from "./CLI.js";
import { ArgParser } from "./ArgParser.js";

/**
 * Arg represents the parsing of a single _argument_. An argument is here
 * interpreted in a very wide meaning: It can be a flag (-f), an option
 */
export class Arg {
  constructor() {
    this.expectsValue = false;
  }

  /**
   * Defines the runner for the argument. Only a single runner can be defined.
   * @param {(cli: CLI, parser: ArgParser) => void | Promise<void>} runner
   */
  run(runner) {
    if (this._runner) throw new Error("duplicate runner configured");
    this._runner = runner;
  }

  /**
   * Declares the argument as accepting a value.
   * @param {(value: string) => void | Promise<void>} runner
   */
  runWithValue(runner) {
    this.expectsValue = true;

    this.run((_cli, parser) => {
      let value = parser.readValue();
      return runner(value);
    });
  }

  /**
   * Declares the argument as accepting an optional value.
   * @param {(value: string | undefined) => void | Promise<void>} runner
   */
  runWithOptionalValue(runner) {
    this.expectsValue = true;

    this.run((_cli, parser) => {
      let value = parser.readOptionalValue();
      return runner(value);
    });
  }

  /**
   * Internal method used for processing the argument.
   * @param {CLI} cli
   * @param {ArgParser} parser
   */
  async process(cli, parser) {
    if (!this._runner) {
      throw new Error("unexpected argument");
    }

    await this._runner(cli, parser);
  }

  /**
   * Declares the argument as a command.
   *
   * @param {(cli: CLI) => void} cb
   */
  command(cb) {
    this.run((cli) => {
      cb(cli);
    });
  }

  /**
   * Declares the argument as an option which takes a value, and returns a
   * {@see Box} which contains it. The box will be empty if the argument
   * is not present.
   */
  string() {
    /** @type Box<string> */
    let box = Box.empty();

    this.runWithValue((val) => {
      box.setContent(val);
    });

    return box;
  }

  /**
   * Declares the argument as an option which takes an optional value, and returns a
   * {@see Box} which will contain one of:
   *
   * - false, when the argument was not present
   * - true, when the argument was present (e.g. `-d`)
   * - string, when the argument was present with a value (e.g. `-d=5`)
   *
   * Note that it's only considered a value if there was an explicit `=`
   * given as argument. `-d=foo` will assign `foo` as the value of `-d`, but
   * in `-d foo` the `foo` will be parsed separately.
   */
  maybeString() {
    /** @type Box<string | boolean> */
    let box = Box.withDefault(false);

    this.expectsValue = true;

    this.runWithOptionalValue((val) => {
      if (val === undefined) {
        box.setContent(true);
      } else {
        box.setContent(val);
      }
    });

    return box;
  }

  /**
   * Declares the argument as a value option which can be passed multiple
   * times. Returns a {@see Box} which contains a list of all of the
   * values.
   */
  strings() {
    /** @type Box<string[]> */
    let box = Box.withDefault([]);

    this.runWithValue((val) => {
      box.mutateContent((state) => {
        state.push(val);
      });
    });

    return box;
  }

  /**
   * Declares the argument as a non-value flag which can be passed once.
   * Returns a {@see Box} which contains true if the argument was present,
   * and false otherwise.
   */
  boolean() {
    /** @type Box<boolean> */
    let box = Box.withDefault(false);

    this.run(() => {
      box.setContent(true);
    });

    return box;
  }

  /**
   * Declares the argument as a non-value flag which can be passed multiple
   * times. Returns a {@see Box} which contains a count of how many times
   * the argument was present (defaulting to 0).
   */
  count() {
    /** @type Box<number> */
    let box = Box.withDefault(0);

    this.run(() => {
      box.updateContent((state) => state + 1);
    });

    return box;
  }
}
