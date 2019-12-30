import { task } from './async-chainable'

class Chainable {
  public value: any
  public path: any

  constructor(value, path) {
    this.value = value;
    this.path = path;
  }

  static of(value, path) {
    return new Chainable(value, path);
  }

  static left(value) {
    return Chainable.of(value, "left");
  }

  static right(value) {
    return Chainable.of(value, "right");
  }

  static ok(value) {
    return Chainable.of(value, "ok");
  }

  static error(value) {
    return Chainable.of(value, "error");
  }

  static nothing() {
    return Chainable.of(undefined, "nothing");
  }

  buildChainable(fn) {
    const runFn = fn(this.value);
    this.value = runFn.value;
    this.path = runFn.path;
    return this;
  }


  chain(fn) {
    if (this.path === "error" || this.path === "nothing") {
      return this;
    }

    const runFn = fn(this.value);
    this.value = runFn.value;
    this.path = runFn.path;
    return this;
  }

  task(fn) {
    if (this.path === "error" || this.path === "nothing") {
      return task(Promise.resolve(Chainable.of(this.value, this.path)));
    }
    return task(fn(this.value));
  }

  check(fn) {
    if (this.path === "error" || this.path === "nothing") {
      return this;
    }

    const runFn = fn(this.value);

    if (runFn === true) {
      return this;
    }

    this.value = runFn.value;
    this.path = runFn.path;
    return this;
  }

  taskCheck(fn) {
    if (this.path === "error" || this.path === "nothing") {
      return task(Promise.resolve(Chainable.of(this.value, this.path)));
    }
    return task(
      fn(this.value).then(runFn => {
        if (runFn === true) {
          return Chainable.of(this.value, this.path);
        }
        return Chainable.of(runFn.value, runFn.path);
      })
    );
  }

  match(matcher) {
    return matcher[this.path](this);
  }

  either(LFn, RFn) {
    if (this.path === 'left') {
      return this.buildChainable(LFn)
    } else if (this.path === 'right') {
      return this.buildChainable(RFn)
    }
    return this
  }

  isLeft(fn) {
    if (this.path === 'left') {
      return this.buildChainable(fn)
    }
    return this
  }

  isRight(fn) {
    if (this.path === 'right') {
      return this.buildChainable(fn)
    }
    return this
  }

  matchEither(LFn, RFn) {
    return this.match({
      left: x => LFn(x.value),
      right: x => RFn(x.value),
      nothing: () => "nothing"
    });
  }

  result(OkFn, ErrorFn) {
    return this.match({
      ok: x => OkFn(x.value),
      error: x => ErrorFn(x.value),
      nothing: () => "nothing"
    });
  }

  just(OkFn, NothingFn = () => "nothing") {
    return this.match({
      ok: x => OkFn(x.value),
      nothing: () => NothingFn()
    });
  }

  getOk() {
    return this.path === "ok" ? this.value : null;
  }
  getLeft() {
    return this.path === "left" ? this.value : null;
  }
  getRight() {
    return this.path === "right" ? this.value : null;
  }
  getError() {
    return this.path === "error" ? this.value : null;
  }
  getNothing() {
    return this.path === "nothing" ? true : null;
  }
}

// function hi<T>(x:  T): T {
//   return x
// }
// const yo = (x: string) => x
// hi(yo)

export { Chainable };
