/**
 * The `Ord` type class represents types which support comparisons with a _total order_.
 *
 * Instances should satisfy the laws of total orderings:
 *
 * 1. Reflexivity: `a |> compare(a) <= 0`
 * 2. Antisymmetry: if `a |> compare(b) <= 0` and `b |> compare(a) <= 0` then `a <-> b`
 * 3. Transitivity: if `a |> compare(b) <= 0` and `b |> S.compare(c) <= 0` then `a |> compare(c) <= 0`
 *
 * @since 3.0.0
 */
import type * as contravariant from './Contravariant'
import type { Endomorphism } from './Endomorphism'
import type { Eq } from './Eq'
import { flow } from './Function'
import type { TypeLambda } from './HKT'
import type { Monoid } from './Monoid'
import type { Ordering } from './Ordering'
import type { Predicate } from './Predicate'
import type { Semigroup } from './Semigroup'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 3.0.0
 */
export interface Ord<A> {
  readonly compare: (second: A) => (self: A) => Ordering
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 3.0.0
 */
export const fromCompare = <A>(compare: Ord<A>['compare']): Ord<A> => ({
  compare: (second) => (first) => first === second ? 0 : compare(second)(first)
})

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * Given a tuple of `Ord`s returns an `Ord` for the tuple.
 *
 * @example
 * import { tuple } from 'fp-ts/Ord'
 * import * as B from 'fp-ts/boolean'
 * import * as S from 'fp-ts/string'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * const O = tuple(S.Ord, N.Ord, B.Ord)
 * assert.strictEqual(pipe(['a', 1, true], O.compare(['b', 2, true])), -1)
 * assert.strictEqual(pipe(['a', 1, true], O.compare(['a', 2, true])), -1)
 * assert.strictEqual(pipe(['a', 1, true], O.compare(['a', 1, false])), 1)
 *
 * @category combinators
 * @since 3.0.0
 */
export const tuple = <A extends ReadonlyArray<unknown>>(...ords: { [K in keyof A]: Ord<A[K]> }): Ord<Readonly<A>> =>
  fromCompare((second) => (first) => {
    let i = 0
    for (; i < ords.length - 1; i++) {
      const r = ords[i].compare(second[i])(first[i])
      if (r !== 0) {
        return r
      }
    }
    return ords[i].compare(second[i])(first[i])
  })

/**
 * @example
 * import { reverse } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, N.Ord.compare(6)), -1)
 * assert.deepStrictEqual(pipe(5, reverse(N.Ord).compare(6)), 1)
 *
 * @category combinators
 * @since 3.0.0
 */
export const reverse = <A>(O: Ord<A>): Ord<A> => fromCompare((second) => (first) => O.compare(first)(second))

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

/**
 * @example
 * import { contramap } from 'fp-ts/Ord'
 * import { sort } from 'fp-ts/ReadonlyArray'
 * import * as S from 'fp-ts/string'
 * import { pipe } from 'fp-ts/Function'
 *
 * type User = {
 *   readonly name: string
 *   readonly age: number
 * }
 *
 * const byName = pipe(S.Ord, contramap((user: User) => user.name))
 *
 * const users: ReadonlyArray<User> = [
 *   { name: 'b', age: 1 },
 *   { name: 'a', age: 2 }
 * ]
 *
 * assert.deepStrictEqual(pipe(users, sort(byName)), [
 *   { name: 'a', age: 2 },
 *   { name: 'b', age: 1 }
 * ])
 *
 * @category Contravariant
 * @since 3.0.0
 */
export const contramap: <B, A>(f: (b: B) => A) => (fa: Ord<A>) => Ord<B> = (f) => (fa) =>
  fromCompare((second) => (first) => fa.compare(f(second))(f(first)))

// -------------------------------------------------------------------------------------
// type lambdas
// -------------------------------------------------------------------------------------

/**
 * @category type lambdas
 * @since 3.0.0
 */
export interface OrdTypeLambda extends TypeLambda {
  readonly type: Ord<this['In1']>
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

/**
 * Returns a `Semigroup` such that:
 *
 * - `pipe(ord1, combine(ord2))` will order first by `ord1`, and then by `ord2`
 *
 * @category instances
 * @since 3.0.0
 */
export const getSemigroup = <A>(): Semigroup<Ord<A>> => ({
  combine: (second) => (first) =>
    fromCompare((a2) => (a1) => {
      const ox = first.compare(a2)(a1)
      return ox !== 0 ? ox : second.compare(a2)(a1)
    })
})

/**
 * Returns a `Monoid` such that:
 *
 * - `pipe(ord1, combine(ord2))` will order first by `ord1`, and then by `ord2`
 * - its `empty` value is an `Ord` that always considers compared elements equal
 *
 * @example
 * import { sort } from 'fp-ts/ReadonlyArray'
 * import { contramap, reverse, getMonoid } from 'fp-ts/Ord'
 * import { pipe } from 'fp-ts/Function'
 * import { combineAll } from 'fp-ts/Monoid'
 * import * as B from 'fp-ts/boolean'
 * import * as N from 'fp-ts/number'
 * import * as S from 'fp-ts/string'
 *
 * interface User {
 *   id: number
 *   name: string
 *   age: number
 *   rememberMe: boolean
 * }
 *
 * const byName = pipe(
 *   S.Ord,
 *   contramap((p: User) => p.name)
 * )
 *
 * const byAge = pipe(
 *   N.Ord,
 *   contramap((p: User) => p.age)
 * )
 *
 * const byRememberMe = pipe(
 *   B.Ord,
 *   contramap((p: User) => p.rememberMe)
 * )
 *
 * const M = getMonoid<User>()
 *
 * const users: ReadonlyArray<User> = [
 *   { id: 1, name: 'Guido', age: 47, rememberMe: false },
 *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
 *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
 *   { id: 4, name: 'Giulio', age: 44, rememberMe: true }
 * ]
 *
 * // sort by name, then by age, then by `rememberMe`
 * const O1 = combineAll(M)([byName, byAge, byRememberMe])
 * assert.deepStrictEqual(sort(O1)(users), [
 *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
 *   { id: 4, name: 'Giulio', age: 44, rememberMe: true },
 *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
 *   { id: 1, name: 'Guido', age: 47, rememberMe: false }
 * ])
 *
 * // now `rememberMe = true` first, then by name, then by age
 * const O2 = combineAll(M)([reverse(byRememberMe), byName, byAge])
 * assert.deepStrictEqual(sort(O2)(users), [
 *   { id: 4, name: 'Giulio', age: 44, rememberMe: true },
 *   { id: 2, name: 'Guido', age: 46, rememberMe: true },
 *   { id: 3, name: 'Giulio', age: 44, rememberMe: false },
 *   { id: 1, name: 'Guido', age: 47, rememberMe: false }
 * ])
 *
 * @category instances
 * @since 3.0.0
 */
export const getMonoid = <A>(): Monoid<Ord<A>> => ({
  combine: getSemigroup<A>().combine,
  empty: fromCompare(() => () => 0)
})

/**
 * @category instances
 * @since 3.0.0
 */
export const Contravariant: contravariant.Contravariant<OrdTypeLambda> = {
  contramap
}

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * @since 3.0.0
 */
export const trivial: Ord<unknown> = {
  compare: () => () => 0
}

/**
 * @since 3.0.0
 */
export const equals =
  <A>(O: Ord<A>): Eq<A>['equals'] =>
  (second: A) =>
  (self: A) =>
    self === second || O.compare(second)(self) === 0

/**
 * Test whether one value is _strictly less than_ another.
 *
 * @example
 * import { lt } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, lt(N.Ord)(4)), false)
 * assert.deepStrictEqual(pipe(5, lt(N.Ord)(5)), false)
 * assert.deepStrictEqual(pipe(5, lt(N.Ord)(6)), true)
 *
 * @since 3.0.0
 */
export const lt =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): boolean =>
    O.compare(second)(self) === -1

/**
 * Test whether one value is _strictly greater than_ another.
 *
 * @example
 * import { gt } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, gt(N.Ord)(4)), true)
 * assert.deepStrictEqual(pipe(5, gt(N.Ord)(5)), false)
 * assert.deepStrictEqual(pipe(5, gt(N.Ord)(6)), false)
 *
 * @since 3.0.0
 */
export const gt =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): boolean =>
    O.compare(second)(self) === 1

/**
 * Test whether one value is _non-strictly less than_ another.
 *
 * @example
 * import { leq } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, leq(N.Ord)(4)), false)
 * assert.deepStrictEqual(pipe(5, leq(N.Ord)(5)), true)
 * assert.deepStrictEqual(pipe(5, leq(N.Ord)(6)), true)
 *
 * @since 3.0.0
 */
export const leq =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): boolean =>
    O.compare(second)(self) !== 1

/**
 * Test whether one value is _non-strictly greater than_ another.
 *
 * @example
 * import { geq } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, geq(N.Ord)(4)), true)
 * assert.deepStrictEqual(pipe(5, geq(N.Ord)(5)), true)
 * assert.deepStrictEqual(pipe(5, geq(N.Ord)(6)), false)
 *
 * @since 3.0.0
 */
export const geq =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): boolean =>
    O.compare(second)(self) !== -1

/**
 * Take the minimum of two values. If they are considered equal, the first argument is chosen.
 *
 * @example
 * import { min } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, min(N.Ord)(6)), 5)
 *
 * @since 3.0.0
 */
export const min =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): A =>
    self === second || O.compare(second)(self) < 1 ? self : second

/**
 * Take the maximum of two values. If they are considered equal, the first argument is chosen.
 *
 * @example
 * import { max } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * assert.deepStrictEqual(pipe(5, max(N.Ord)(6)), 6)
 *
 * @since 3.0.0
 */
export const max =
  <A>(O: Ord<A>) =>
  (second: A) =>
  (self: A): A =>
    self === second || O.compare(second)(self) > -1 ? self : second

/**
 * Clamp a value between a minimum and a maximum.
 *
 * @example
 * import { clamp } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * const f = clamp(N.Ord)(2, 4)
 * assert.deepStrictEqual(pipe(1, f), 2)
 * assert.deepStrictEqual(pipe(3, f), 3)
 * assert.deepStrictEqual(pipe(5, f), 4)
 *
 * @since 3.0.0
 */
export const clamp = <A>(O: Ord<A>): ((low: A, hi: A) => Endomorphism<A>) => {
  const minO = min(O)
  const maxO = max(O)
  return (low, hi) => flow(minO(hi), maxO(low))
}

/**
 * Test whether a value is between a minimum and a maximum (inclusive).
 *
 * @example
 * import { between } from 'fp-ts/Ord'
 * import * as N from 'fp-ts/number'
 * import { pipe } from 'fp-ts/Function'
 *
 * const f = between(N.Ord)(2, 4)
 * assert.deepStrictEqual(pipe(1, f), false)
 * assert.deepStrictEqual(pipe(3, f), true)
 * assert.deepStrictEqual(pipe(5, f), false)
 *
 * @since 3.0.0
 */
export const between = <A>(O: Ord<A>): ((low: A, hi: A) => Predicate<A>) => {
  const ltO = lt(O)
  const gtO = gt(O)
  return (low, hi) => (a) => ltO(low)(a) || gtO(hi)(a) ? false : true
}
