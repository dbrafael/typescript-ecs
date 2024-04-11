import Component from "./store/component";
import Resource from "./store/resource";

export type Tuple<T extends any[]> = [ ...{ [K in keyof T]: T[K] } ];

export type ClassOf<T extends Component> = (new (...args: any[]) => T);
export type Constructed<T> = T extends ClassOf<infer U> ? U : never;
export type AbstractClassOf<T> = (abstract new (...args: any[]) => T);
export type TupleClass<T extends (Component | Resource)[]> = [ ...{ [K in keyof T]: ClassOf<T[K]> } ];

export type IsUnique<Array extends any[]> =
  Array extends [infer X, ...infer Rest] ?
    X extends Rest[number] ?
      false
      : IsUnique<Rest>
    : true
