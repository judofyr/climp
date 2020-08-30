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
  setRunner(runner) {
    if (this._runner) throw new Error("duplicate runner configured");
    this._runner = runner;
  }

  /**
   * Defines a runner which will be invoked immediately when the argument
   * is given. This can be used to modify the CLI object to tweak argument
   * parsing on the fly.
   *
   * @param {(cli: CLI) => void | Promise<void>} runner
   */
  accept(runner) {
    this.setRunner((cli) => runner(cli));
  }

  /**
   * Defines a runner which will be invoked _deferred_ when the the argument is given.
   * Note that the runner is invoked after all argument parsing has occured.
   *
   * @param {(cli: CLI) => void | Promise<void>} runner
   */
  do(runner) {
    this.setRunner((cli) => cli.do(runner));
  }

  /**
   * Defines a runner which will be invoked immediately when the argument
   * is given a value.
   *
   * @param {(value: string, cli: CLI) => void | Promise<void>} runner
   */
  acceptValue(runner) {
    this.expectsValue = true;

    this.setRunner((cli, parser) => {
      let value = parser.readValue();
      return runner(value, cli);
    });
  }

  /**
   * Declares the argument as accepting an optional value.
   *
   * @param {(value: string | undefined, cli: CLI) => void | Promise<void>} runner
   */
  acceptOptionalValue(runner) {
    this.expectsValue = true;

    this.setRunner((cli, parser) => {
      let value = parser.readOptionalValue();
      return runner(value, cli);
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
    this.setRunner((cli) => {
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

    this.acceptValue((val) => {
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

    this.acceptOptionalValue((val) => {
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

    this.acceptValue((val) => {
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

    this.setRunner(() => {
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

    this.setRunner(() => {
      box.updateContent((state) => state + 1);
    });

    return box;
  }
}
