import { Chainable } from "./chainable"
import { AsyncAF, task } from "./async-chainable"

let C = Chainable

const logR = x => {
  return C.right(x + 1)
}
const logL = x => {
  return C.left(x + 1)
}
const logO = x => {
  return C.ok(x + 1)
}
const logE = x => {
  return C.error(x + 1)
}
const logN = x => {
  return C.nothing()
}

const promiseOk = x => {
  return Promise.resolve(C.ok(x + 1))
}
const promiseError = x => {
  return Promise.reject(C.error(x + 1))
}


describe("asyncaf test", () => {
  const runAAF = () => {
    const AAF = new AsyncAF(Promise.resolve(1));
    return AAF;
  };
  const runOk = x => {
    const AAF = new AsyncAF(Promise.resolve(C.ok(x + 1)));
    return AAF;
  };
  const promisedOk = x => Promise.resolve(C.ok(x + 1));
  const promisedError = x => Promise.resolve(C.error(x + 1));
  const promisedNothing = x => Promise.resolve(C.nothing());
  it("runs something", async () => {
    const result1 = await runAAF().then(x => x + 4);
    const result2 = await runAAF().then(x => x + 1);
    expect(result1).toBe(5);
    expect(result2).toBe(2);
  });

  it("runs match on ok", async () => {
    const result1 = await runOk(1)
      .chain(logO)
      .chain(logO)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`
      });
    expect(result1).toBe("ok 4");
      })

  it("runs match on error", async () => {
    const result2 = await runOk(1)
      .chain(logE)
      .chain(logO)
      .chain(logO)
      .chain(logO)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`
      });

    expect(result2).toBe("error 3");
  });

  it("runs promise on Chainable chain", async () => {
    const result1 = await logO(1)
      .task(promiseOk)
      .chain(logO)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`
      });
    expect(result1).toBe("ok 4");
  });

  it("runs multiple promises", async () => {
    const result1 = await task(promiseOk(1))
      .task(promiseOk)
      .task(promiseOk)
      .chain(logO)
      .task(promiseOk)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`
      });
    expect(result1).toBe("ok 6");
  });

  it("runs multiple promises into errors", async () => {
    const result1 = await task(promiseOk(1))
      .task(promiseError)
      .task(promiseOk)
      .chain(logO)
      .task(promiseOk)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`
      });
    expect(result1).toBe("error 3");
  });

  it("stops if returns a nothing", async () => {
    const result1 = await task(promiseOk(1))
      .task(promisedNothing)
      .task(promiseOk)
      .chain(logO)
      .task(promiseOk)
      .willMatch({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`,
        nothing: () => "nothing"
      });
    expect(result1).toBe("nothing");
  });
});
