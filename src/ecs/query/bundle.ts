import Component, { AbstractClassOf, ClassOf, ComponentId, Filtered } from "ecs/store/component";
import type ECS from "../engine"
import { Bundle, EntityWrapper } from "ecs/store/entity";

export type ComponentRepresentation<C extends Component> = ClassOf<C> | AbstractClassOf<C> | ComponentId;
export type ComponentFilter<C extends Component> = ComponentRepresentation<C> | Filtered<C>

export type BundleFilter<B extends Component[]> = [ ...{ [K in keyof B]: ComponentFilter<B[K]> } ];
export type BundleFilterList<B extends Bundle[]> = [ ...{ [K in keyof B]: BundleFilter<B[K]> } ];

export class BundleQuery<B extends Bundle> {
  private constructor(public readonly filter: BundleFilter<B>) { }

  static new<B extends Bundle>(bundle: BundleFilter<B>): BundleQuery<B> {
    return new BundleQuery<B>(bundle);
  }

  execute(ecs: ECS): Set<EntityWrapper<B>> {
    return ecs.queryComponents(...this.filter);
  }
}
export type BundleQueryList<B extends Bundle[]> = [ ...{ [K in keyof B]: BundleQuery<B[K]> } ];
export type BundleResultList<B extends Bundle[]> = [ ...{ [K in keyof B]: EntityWrapper<B[K]>[] } ];
