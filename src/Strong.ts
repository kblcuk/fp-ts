/**
 * The `Strong` class extends `Profunctor` with combinators for working with product types.
 *
 * `first` and `second` lift values in a `Profunctor` to act on the first and second components of a tuple,
 * respectively.
 *
 * Another way to think about Strong is to piggyback on the intuition of
 * inputs and outputs.  Rewriting the type signature in this light then yields:
 *
 * ```purescript
 * first ::  forall input output a. p input output -> p (Tuple input a) (Tuple output a)
 * second :: forall input output a. p input output -> p (Tuple a input) (Tuple a output)
 * ```
 *
 * If we specialize the profunctor p to the function arrow, we get the following type
 * signatures, which may look a bit more familiar:
 *
 * ```purescript
 * first ::  forall input output a. (input -> output) -> (Tuple input a) -> (Tuple output a)
 * second :: forall input output a. (input -> output) -> (Tuple a input) -> (Tuple a output)
 * ```
 *
 * So, when the `profunctor` is `Function` application, `first` essentially applies your function
 * to the first element of a tuple, and `second` applies it to the second element (same as `map` would do).
 *
 * Adapted from https://github.com/purescript/purescript-profunctor/blob/master/src/Data/Profunctor/Strong.purs
 *
 * @since 3.0.0
 */
import type { Category } from './Category'
import { identity, pipe } from './function'
import type { HKT, Kind } from './HKT'
import type { Profunctor } from './Profunctor'

/**
 * @category type classes
 * @since 3.0.0
 */
export interface Strong<P extends HKT> extends Profunctor<P> {
  readonly first: <S, A, W, E, B, C>(pab: Kind<P, S, A, W, E, B>) => Kind<P, S, readonly [A, C], W, E, readonly [B, C]>
  readonly second: <S, B, W, E, C, A>(pab: Kind<P, S, B, W, E, C>) => Kind<P, S, readonly [A, B], W, E, readonly [A, C]>
}

/**
 * Compose a value acting on a tuple from two values, each acting on one of the components of the tuple.
 *
 * Specializing `split` to function application would look like this:
 *
 * ```purescript
 * split :: forall a b c d. (a -> b) -> (c -> d) -> (Tuple a c) -> (Tuple b d)
 * ```
 *
 * We take two functions, `f` and `g`, and we transform them into a single function which takes a tuple and maps `f`
 * over the first element and `g` over the second.  Just like `bi-map` would do for the `bi-functor` instance of tuple.
 *
 * @since 3.0.0
 */
export const split =
  <F extends HKT>(S: Strong<F>, C: Category<F>) =>
  <S, A, W, E, B, C, D>(
    pab: Kind<F, S, A, W, E, B>,
    pcd: Kind<F, S, C, W, E, D>
  ): Kind<F, S, readonly [A, C], W, E, readonly [B, D]> =>
    pipe(S.first<S, A, W, E, B, C>(pab), C.compose(S.second<S, C, W, E, D, B>(pcd)))

/**
 * Compose a value which introduces a tuple from two values, each introducing one side of the tuple.
 *
 * This combinator is useful when assembling values from smaller components, because it provides a way to support two
 * different types of output.
 *
 * Specializing `fanOut` to function application would look like this:
 *
 * ```purescript
 * fanOut :: forall a b c. (a -> b) -> (a -> c) -> (a -> (Tuple b c))
 * ```
 *
 * We take two functions, `f` and `g`, with the same parameter type and we transform them into a single function which
 * takes one parameter and returns a tuple of the results of running `f` and `g` on the parameter, respectively.  This
 * allows us to run two parallel computations on the same input and return both results in a tuple.
 *
 * @since 3.0.0
 */
export const fanOut = <F extends HKT>(
  S: Strong<F>,
  C: Category<F>
): (<S, A, W, E, B, C>(
  pab: Kind<F, S, A, W, E, B>,
  pac: Kind<F, S, A, W, E, C>
) => Kind<F, S, A, W, E, readonly [B, C]>) => {
  const splitSC = split(S, C)
  return <S, A, W, E, B, C>(
    pab: Kind<F, S, A, W, E, B>,
    pac: Kind<F, S, A, W, E, C>
  ): Kind<F, S, A, W, E, readonly [B, C]> =>
    pipe(
      C.id<S, A, W, E>(),
      S.promap<A, A, A, readonly [A, A]>(identity, (a) => [a, a]),
      C.compose(splitSC(pab, pac))
    )
}
