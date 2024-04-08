import type ECS from "../engine"
import Resource from "../store/resource";
import { BundleQuery, type BundleQueryList, type BundleResultList, ComponentFilter, BundleFilter } from "./bundle";
import { type TupleClass } from "../store/component";
import { ResourcesResult, type Resources } from "./resource";
import { Bundle } from "ecs/store/entity";

type Extend<L extends any[], B> = [...L, B];

export default class Query<Bundles extends Bundle[], Res extends Resource[]> {
  static Empty = new Query([], ResourcesResult.new([]));

  private hasResources = false;
  private constructor(
    private _bundles: BundleQueryList<Bundles>,
    private _resources: ResourcesResult<Res>
  ) { }

  static bundle<B extends Bundle>(...bundle: BundleFilter<B>): Query<[B], []> {
    const b = BundleQuery.new(bundle) as BundleQuery<B>;
    return new Query([b], ResourcesResult.new([]));
  }

  static resources<R extends Resource[]>(...resources: Resources<TupleClass<R>>): Query<[], R> {
    const res = ResourcesResult.new<R>(resources);
    return new Query<[], R>([], res);
  }

  bundle<B extends Bundle>(...bundle: BundleFilter<B>): Query<Extend<Bundles, B>, Res> {
    const b = BundleQuery.new(bundle) as BundleQuery<B>;
    this._bundles.push(b);
    return this as any as Query<Extend<Bundles, B>, Res>;
  }

  resources<R extends Resource[]>(...resources: Resources<TupleClass<R>>): Query<Bundles, R> {
    if (this._resources.size > 0) throw new Error("Resources already set");
    // @ts-ignore
    this._resources = ResourcesResult.new<R>(resources);
    return this as any as Query<Bundles, R>;
  }

  private executeBundles(ecs: ECS): BundleResultList<Bundles> {
    return this._bundles.map(b => b.execute(ecs)) as BundleResultList<Bundles>;
  }

  execute(ecs: ECS): [BundleResultList<Bundles>, ResourcesResult<Res>] {
    if (!this.hasResources) {
      this._resources.update(ecs);
      this.hasResources = true;
    }
    return [this.executeBundles(ecs), this._resources];
  }
}
