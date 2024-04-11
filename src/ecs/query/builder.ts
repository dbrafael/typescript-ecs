import { TupleClass } from "../utils";
import type ECS from "../engine"
import Resource from "../store/resource";
import { BundleQuery, BundleFilter } from "./bundle";
import { ResourcesMap, type Resources } from "./resource";
import { Bundle, EntityWrapper } from "../store/entity";

type Join<L extends any[], B> = [...L, B];

// Filter (written form) -> Query (obj form) -> Result 
export type BundleFilterList<B extends Bundle[]> = { [K in keyof B]: BundleFilter<B[K]> };
export type BundleQueryList<B extends Bundle[]> = { [K in keyof B]: BundleQuery<B[K]> };
export type BundleResultList<B extends Bundle[]> = { [K in keyof B]: EntityWrapper<B[K]>[] };

export default class Query<Bundles extends Bundle[], Res extends Resource[]> {
  static Empty = new Query([], ResourcesMap.new([]));

  private _firstRun = true;

  private constructor(
    private _bundles: BundleQueryList<Bundles>,
    private _resources: ResourcesMap<Res>
  ) { }

  static bundle<B extends Bundle>(...bundle: BundleFilter<B>): Query<[B], []> {
    const b = BundleQuery.new(bundle) as BundleQuery<B>;
    return new Query([b], ResourcesMap.new([]));
  }

  static resources<R extends Resource[]>(...resources: Resources<TupleClass<R>>): Query<[], R> {
    const res = ResourcesMap.new<R>(resources);
    return new Query<[], R>([], res);
  }

  bundle<B extends Bundle>(...bundle: BundleFilter<B>): Query<Join<Bundles, B>, Res> {
    const b = BundleQuery.new(bundle) as BundleQuery<B>;
    this._bundles.push(b);
    return this as any as Query<Join<Bundles, B>, Res>;
  }

  private executeBundles(ecs: ECS): BundleResultList<Bundles> {
    return this._bundles.map(b => b.execute(ecs)) as BundleResultList<Bundles>;
  }

  execute(ecs: ECS): [BundleResultList<Bundles>, ResourcesMap<Res>] {
    if (this._firstRun) {
      this._resources.update(ecs);
      this._firstRun = false;
    }
    return [this.executeBundles(ecs), this._resources];
  }
}
