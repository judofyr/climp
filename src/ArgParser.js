/**
 * ArgParser parses arguments in an incremental way: You instantiate it with a
 * list of input arguments, and it provides properties about the first argument.
 * Once you're done processing it you can call `next()` (or `nextValue()`) which
 * advances the parser onto the next argument.
 */
export class ArgParser {
  /**
   * @param {string[]} argv
   */
  constructor(argv) {
    this.i = 0;
    this.argv = argv;

    /** @type {string | undefined} */
    this.current = undefined;

    /** @type {"default" | "dash" | "value"} */
    this.state = "default";

    /** @type {string} */
    this.buffer = "";

    /**
     * True if the argument comes after `--`.
     */
    this.isRest = false;

    /**
     * True if the argument is considered flag.
     * This happens when it starts with a dash and isRest=false.
     */
    this.isFlag = false;

    /**
     * True if the argument can _only_ be interpreted as a value.
     * This happens when it's
     */
    this.isValue = false;

    this._process(this.argv[this.i]);
  }

  /**
   * True when `current` is undefined.
   */
  get isDone() {
    return this.current === undefined;
  }

  /**
   * Advanced the parser onto the next argument.
   */
  next() {
    switch (this.state) {
      case "default": {
        this._process(this.argv[++this.i]);
        break;
      }
      case "dash": {
        this._handleDash();
        break;
      }
      case "value": {
        this.isFlag = false;
        this.isValue = true;
        this.current = this.buffer;
        this._clearBuffer();
      }
    }
  }

  /**
   * Same as `next()`, but with the goal of parsing a value.
   *
   * This currently only behaves different while parsing multiple short flags.
   * If the input is `-abc`, the first argument will then be `-a`. If then
   * invoke `nextValue()` the result will be an argument of `bc`. If you used
   * `next()` instead you would get `-b`.
   */
  nextValue() {
    if (this.state === "dash" && this.buffer[0] !== "=") {
      this.current = this.buffer;
      this.isFlag = false;
      this.isValue = true;
      this._clearBuffer();
      return;
    }

    this.next();
  }

  /**
   * Checks if the current argument can be considered a value (i.e. it's present
   * and not a flag). If so, it returns it and advances the state (using `next()`).
   *
   * Otherwise it throws with an error.
   *
   * Note that this does _not_ imply that `isValue` is true. `isValue`
   * is true when the argument can _only_ be interpreted as a value.
   *
   * @returns {string}
   */
  readValue() {
    let current = this.current;

    if (current === undefined) throw new Error("expected value");
    if (this.isFlag) throw new Error("expected value, not flag");

    this.next();
    return current;
  }

  /**
   * Checks if the current argument can only be interpreted as a value.
   * If so, it returns it and advances the state (using `next()`).
   *
   * Otherwise it returns undefined.
   *
   * @returns {string | undefined}
   */
  readOptionalValue() {
    return this.isValue ? this.readValue() : undefined;
  }

  /**
   * @private
   */
  _clearBuffer() {
    this.state = "default";
    this.buffer = "";
  }

  /**
   * The main processing.
   *
   * @private
   * @param {string | undefined} str
   */
  _process(str) {
    if (str === undefined || this.isRest) {
      this.current = str;
      this.isFlag = false;
      this.isValue = false;
      return;
    }

    if (str === "--") {
      this.isRest = true;
      this.isFlag = false;
      this.isValue = false;
      this.next();
      return;
    }

    this.isValue = false;

    if (str.startsWith("--")) {
      this.isFlag = true;

      let eq = str.indexOf("=");
      if (eq >= 0) {
        this.state = "value";
        this.buffer = str.slice(eq + 1);
        this.current = str.slice(0, eq);
      } else {
        this.current = str;
      }

      return;
    }

    if (str.startsWith("-")) {
      this.isFlag = true;
      this.state = "dash";
      this.buffer = str.slice(1);
      this._handleDash();

      return;
    }

    this.isFlag = false;
    this.current = str;
  }

  _handleDash() {
    if (this.buffer[0] === "=") {
      this.isFlag = false;
      this.isValue = true;
      this.current = this.buffer.slice(1);
      this._clearBuffer();
    } else {
      this.current = "-" + this.buffer[0];

      if (this.buffer.length > 1) {
        this.buffer = this.buffer.slice(1);
      } else {
        this._clearBuffer();
      }
    }
  }
}
