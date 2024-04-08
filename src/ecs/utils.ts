export type Tuple<T extends any[]> = [ ...{ [K in keyof T]: T[K] } ];

export type IsUnique<Array extends any[]> =
  Array extends [infer X, ...infer Rest] ?
    X extends Rest[number] ?
      false
      : IsUnique<Rest>
    : true
