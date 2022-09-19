/**
 * @since 3.0.0
 */
import type { Lazy } from './function'
import type { Monoid } from './Monoid'
import type { Semigroup } from './Semigroup'
import * as EqModule from './Eq'
import * as BooleanAlgebraModule from './BooleanAlgebra'
import * as OrdModule from './Ord'
import * as ShowModule from './Show'
import type { Refinement } from './Refinement'

// -------------------------------------------------------------------------------------
// refinements
// -------------------------------------------------------------------------------------

/**
 * @category refinements
 * @since 3.0.0
 */
export const isBoolean: Refinement<unknown, boolean> = (u: unknown): u is boolean => typeof u === 'boolean'

// -------------------------------------------------------------------------------------
// destructors
// -------------------------------------------------------------------------------------

/**
 * Defines the match over a boolean value.
 * Takes two thunks `onTrue`, `onFalse` and a `boolean` value.
 * If `value` is `false`, `onFalse()` is returned, otherwise `onTrue()`.
 *
 * @example
 * import { some, map } from 'fp-ts/Option'
 * import { pipe } from 'fp-ts/function'
 * import { match } from 'fp-ts/boolean'
 *
 * assert.deepStrictEqual(
 *  pipe(
 *    some(true),
 *    map(match(() => 'false', () => 'true'))
 *  ),
 *  some('true')
 * )
 *
 * @category destructors
 * @since 3.0.0
 */
export const match =
  <A, B = A>(onFalse: Lazy<A>, onTrue: Lazy<B>) =>
  (value: boolean): A | B =>
    value ? onTrue() : onFalse()

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * @category instances
 * @since 3.0.0
 */
export const Eq: EqModule.Eq<boolean> = EqModule.EqStrict

/**
 * @category instances
 * @since 3.0.0
 */
export const BooleanAlgebra: BooleanAlgebraModule.BooleanAlgebra<boolean> = {
  meet: (second) => (first) => first && second,
  join: (second) => (first) => first || second,
  zero: false,
  one: true,
  implies: (second) => (first) => !first || second,
  not: (x) => !x
}

/**
 * `boolean` semigroup under conjunction.
 *
 * @example
 * import { SemigroupAll } from 'fp-ts/boolean'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(true, SemigroupAll.concat(true)), true)
 * assert.deepStrictEqual(pipe(true, SemigroupAll.concat(false)), false)
 *
 * @category instances
 * @since 3.0.0
 */
export const SemigroupAll: Semigroup<boolean> = {
  concat: (second) => (first) => first && second
}

/**
 * `boolean` semigroup under disjunction.
 *
 * @example
 * import { SemigroupAny } from 'fp-ts/boolean'
 * import { pipe } from 'fp-ts/function'
 *
 * assert.deepStrictEqual(pipe(true, SemigroupAny.concat(true)), true)
 * assert.deepStrictEqual(pipe(true, SemigroupAny.concat(false)), true)
 * assert.deepStrictEqual(pipe(false, SemigroupAny.concat(false)), false)
 *
 * @category instances
 * @since 3.0.0
 */
export const SemigroupAny: Semigroup<boolean> = {
  concat: (second) => (first) => first || second
}

/**
 * `boolean` monoid under conjunction.
 *
 * The `empty` value is `true`.
 *
 * @category instances
 * @since 3.0.0
 */
export const MonoidAll: Monoid<boolean> = {
  concat: SemigroupAll.concat,
  empty: true
}

/**
 * `boolean` monoid under disjunction.
 *
 * The `empty` value is `false`.
 *
 * @category instances
 * @since 3.0.0
 */
export const MonoidAny: Monoid<boolean> = {
  concat: SemigroupAny.concat,
  empty: false
}

/**
 * @category instances
 * @since 3.0.0
 */
export const Ord: OrdModule.Ord<boolean> = {
  compare: (second) => (first) => first < second ? -1 : first > second ? 1 : 0
}

/**
 * @category instances
 * @since 3.0.0
 */
export const Show: ShowModule.Show<boolean> = {
  show: (a) => JSON.stringify(a)
}
