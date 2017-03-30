## Implementation details

- pair is represented as two-element array: `Pair<A,B> = [A,B]`.
- `Either` is represtented by `[boolean, A | B]`, where
  `false` and `true` reprsent whether the value is `Left` or `Right` respectively.
- `Maybe` is encoded as the value + some unique value nothing can equal to (think: `Symbol`).
- See [Compiling lenses](http://oleg.fi/gists/posts/2017-03-31-compiling-lenses.html)
  for ideas behind `Neglect`.
