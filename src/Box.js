/**
 * A box stores a single value related to an argument.
 *
 * @template T
 */
export class Box {
  /**
   * @param {(v: Box<T>) => void} defaultHandler
   */
  constructor(defaultHandler) {
    this.defaultHandler = defaultHandler;

    /** @type {"pending" | "filled" | "empty"} */
    this.state = "pending";
  }

  /**
   * Creates a new box which defaults to being empty.
   */
  static empty() {
    return new Box((box) => {
      box.setEmpty();
    });
  }

  /**
   * Creates a new box with a default value.
   *
   * @template T
   * @param {T} val
   */
  static withDefault(val) {
    return new Box((box) => {
      box.setContent(val);
    });
  }

  /**
   * Helper method for setting the content.
   * @param {T} content
   */
  setContent(content) {
    if (this.state === "filled") {
      throw new Error("duplicate argument");
    }

    this.state = "filled";
    this.content = content;
  }

  setEmpty() {
    this.state = "empty";
    this.content = undefined;
  }

  /**
   * Helper method used for updating the state using a reducer.
   * @param {(state: T) => T} reducer
   */
  updateContent(reducer) {
    this.content = reducer(this.get());
  }

  /**
   * Helper method used for mutating the state.
   * @param {(state: T) => void} mutator
   */
  mutateContent(mutator) {
    mutator(this.get());
  }

  /**
   * @returns {T}
   */
  get() {
    this._resolve();

    if (this.state === "empty") {
      throw new Error("argument required");
    }

    // @ts-ignore
    return this.content;
  }

  get isEmpty() {
    this._resolve();

    return this.state === "empty";
  }

  /**
   * Maps over the value stored.
   *
   * @template U
   * @param {(content: T) => U} mapper
   * @returns {Box<U>}
   */
  map(mapper) {
    return new Box((box) => {
      if (this.isEmpty) {
        box.setEmpty();
      } else {
        box.setContent(mapper(this.get()));
      }
    });
  }

  /**
   * Creates a new box which will store `content` if this box is empty.
   * @param {T} content
   * @returns {Box<T>}
   */
  or(content) {
    return new Box((box) => {
      box.setContent(this.isEmpty ? content : this.get());
    });
  }

  /**
   * Helper method for resolving a box.
   *
   * @private
   */
  _resolve() {
    if (this.state === "pending") {
      this.defaultHandler(this);
      if (this.state === "pending") {
        throw new Error("handled did not resolve");
      }
    }
  }
}
