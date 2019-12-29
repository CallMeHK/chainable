import { Chainable } from './chainable'
import { AsyncAF, task } from './async-chainable'

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

describe('chainable', () => {
  describe('#chain', () => {
    it('can do basic chaining', async () => {
      const result = logR(1)
        .chain(logR)
        .chain(logR).value
      expect(result).toBe(4)
    })
  })

  describe('#left and #right', () => {
    it('can match right', () => {
      const result = logR(1).match({
        left: x => `left ${x.value}`,
        right: x => `right ${x.value}`,
      })
      expect(result).toBe('right 2')
    })

    it('can match left', () => {
      const result = logL(1).match({
        left: x => `left ${x.value}`,
        right: x => `right ${x.value}`,
      })
      expect(result).toBe('left 2')
    })

    it('can match left after right', () => {
      const result = logR(1)
        .chain(logL)
        .match({
          left: x => `left ${x.value}`,
          right: x => `right ${x.value}`,
        })
      expect(result).toBe('left 3')
    })
  })

  describe('#ok and #error', () => {
    it('works for ok', () => {
      const result = logO(1).match({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`,
      })
      expect(result).toBe('ok 2')
    })

    it('works for error', () => {
      const result = logE(1).match({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`,
      })
      expect(result).toBe('error 2')
    })

    it('skips to end on error', () => {
      const result = logO(1)
        .chain(logE)
        .chain(logO)
        .match({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })
      expect(result).toBe('error 3')
    })
  })

  describe('#nothing', () => {
    it('works for nothing', () => {
      const result = logN(1).match({
        ok: x => `ok ${x.value}`,
        nothing: () => 'nothing',
      })
      expect(result).toBe('nothing')
    })

    it('skips to end on nothing', () => {
      const result = logO(1)
        .chain(logN)
        .chain(logO)
        .match({
          ok: x => `ok ${x.value}`,
          nothing: () => 'nothing',
        })
      expect(result).toBe('nothing')
    })
  })

  describe('#chain promises and #willMatch', () => {
    it('matches ok with promise', async () => {
      const result = (await promiseOk(1)).chain(logO).match({
        ok: x => `ok ${x.value}`,
        error: x => `error ${x.value}`,
      })
      expect(result).toBe('ok 3')
    })
  })


  describe('#check and #checkP', () => {
    const checkTrue = () => true
    const checkError = x => C.error(x + 1)
    const checkTrueP = () => Promise.resolve(true)
    const checkErrorP = x => Promise.resolve(C.error(x + 1))


    it('doesnt break for check', () => {
      const result = logO(1)
        .check(checkTrue)
        .match({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('ok 2')
    })

    it('breaks for error check', () => {
      const result = logO(1)
        .check(checkError)
        .match({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('error 3')
    })

    it('keeps going after check', () => {
      const result = logO(1)
        .check(checkTrue)
        .chain(logO)
        .chain(logO)
        .chain(logO)
        .match({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('ok 5')
    })

    it('skips to end on error', () => {
      const result = logO(1)
        .check(checkError)
        .chain(logO)
        .chain(logO)
        .chain(logO)
        .match({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('error 3')
    })

    it('works for async', async () => {
      const result = await logO(1)
        .check(checkTrue)
        .chainP(promiseOk)
        .check(checkTrue)
        .chainP(promiseOk)
        .willMatch({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('ok 4')
    })

    it('errors properly for async', async () => {
      const result = await logO(1)
        .check(checkTrue)
        .chainP(promiseOk)
        .check(checkError)
        .chainP(promiseOk)
        .chainP(promiseOk)
        .willMatch({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('error 4')
    })

    it('runs with checkP', async () => {
      const result = await logO(1)
        .chainP(promiseOk)
        .checkP(checkTrueP)
        .chainP(promiseOk)
        .chainP(promiseOk)
        .willMatch({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('ok 5')
    })

    it('stops on error with checkP', async () => {
      const result = await logO(1)
        .chainP(promiseOk)
        .checkP(checkErrorP)
        .chainP(promiseOk)
        .chainP(promiseOk)
        .willMatch({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('error 4')
    })

    it('checkP works in multiples', async () => {
      const result = await logO(1)
        .chainP(promiseOk)
        .checkP(checkTrueP)
        .checkP(checkTrueP)
        .checkP(checkTrueP)
        .chainP(promiseOk)
        .checkP(checkTrueP)
        .chainP(promiseOk)
        .willMatch({
          ok: x => `ok ${x.value}`,
          error: x => `error ${x.value}`,
        })

      expect(result).toBe('ok 5')
    })
  })

})
