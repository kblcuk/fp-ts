import * as assert from 'assert'
import { Apply } from '../src/Apply'
import { FromTask } from '../src/FromTask'
import { pipe } from '../src/function'
import { HKT, Kind } from '../src/HKT'
import * as T from '../src/Task'
import * as Se from '../src/Semigroup'
import * as fc from 'fast-check'
import { Eq } from '../src/Eq'

export const deepStrictEqual = <A>(actual: A, expected: A) => {
  assert.deepStrictEqual(actual, expected)
}

export const strictEqual = <A>(actual: A, expected: A) => {
  assert.strictEqual(actual, expected)
}

export const double = (n: number): number => n * 2

export interface AssertParSeq {
  <F extends HKT>(
    F: Apply<F>,
    MT: FromTask<F>,
    run: (fa: Kind<F, unknown, unknown, unknown, unknown>) => Promise<unknown>
  ): Promise<void>
}
export const assertParSeq = (expected: ReadonlyArray<string>): AssertParSeq => async <F extends HKT>(
  F: Apply<F>,
  MT: FromTask<F>,
  run: (fa: Kind<F, unknown, unknown, unknown, unknown>) => Promise<unknown>
): Promise<void> => {
  const log: Array<string> = []
  const a = MT.fromTask(T.delay(100)(T.fromIO(() => log.push('a'))))
  const b = MT.fromTask(T.fromIO(() => log.push('b')))
  const tuple = <A>(a: A) => <B>(b: B): readonly [A, B] => [a, b]
  const ab = pipe(a, F.map(tuple), F.ap(b))
  await run(ab)
  deepStrictEqual(log, expected)
}

export const assertPar = assertParSeq(['b', 'a'])

export const assertSeq = assertParSeq(['a', 'b'])

// -------------------------------------------------------------------------------------
// laws
// -------------------------------------------------------------------------------------

export const laws = {
  semigroup: {
    associativity: <A>(S: Se.Semigroup<A>, E: Eq<A>) => (a: A, b: A, c: A): boolean =>
      E.equals(pipe(a, S.concat(b), S.concat(c)))(pipe(a, S.concat(pipe(b, S.concat(c)))))
  }
}

// -------------------------------------------------------------------------------------
// properties
// -------------------------------------------------------------------------------------

export const properties = {
  semigroup: {
    associativity: <A>(S: Se.Semigroup<A>, E: Eq<A>) => (arb: fc.Arbitrary<A>) =>
      fc.property(arb, arb, arb, laws.semigroup.associativity(S, E))
  }
}
