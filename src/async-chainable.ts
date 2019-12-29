import { Chainable } from "./chainable";

const dataStore = new WeakMap();

class AsyncAF {
  public data: any
  constructor(data) {
    dataStore.set(this, Promise.resolve(data));
  }

  static of(data) {
    return new AsyncAF(data);
  }

  then(resolve: (x) => any, reject?) {
    return new AsyncAF(dataStore.get(this).then(resolve, reject));
  }

  chain(fn) {
    return this.then((result) => {
      if (result.path === "error" || result.path === "nothing") {
        return Chainable.of(result.value, result.path);
      }
      return result.chain(fn);
    });
  }

  check(fn) {
    return this.then(result => {
      if (result.path === "error" || result.path === "nothing") {
        return Chainable.of(result.value, result.path);
      }
      return result.check(fn);
    });
  }

  chainP(fn) {
    return this.then(result => {
      return result.chainP(fn);
    });
  }

  checkP(fn) {
    return this.then(result => {
      return result.checkP(fn);
    });
  }

  willMatch(matcher) {
    return this.then(result => {
      return result.match(matcher)
    }).catch(e => {
      return e.match(matcher)
    });
  }

  catch(reject) {
    return this.then(null, reject);
  }

  finally(onFinally) {
    return dataStore.get(this).finally(onFinally);
  }
}

const task = AsyncAF.of;

export { AsyncAF, task };
