import Component, { ComponentId, Filtered } from "../store/component";
import type ECS from "../engine"
import { Bundle, EntityWrapper } from "../store/entity";
import { AbstractClassOf, ClassOf } from "../utils";

export type ComponentRepresentation<C extends Component> = ClassOf<C> | AbstractClassOf<C> | ComponentId;
export type ComponentFilter<C extends Component> = ComponentRepresentation<C> | Filtered<C>

export type BundleFilter<B extends Component[]> = [ ...{ [K in keyof B]: ComponentFilter<B[K]> } ];
export class BundleQuery<B extends Bundle> {
  private constructor(public readonly filter: BundleFilter<B>) { }

  static new<B extends Bundle>(bundle: BundleFilter<B>): BundleQuery<B> {
    return new BundleQuery<B>(bundle);
  }

  execute(ecs: ECS): Set<EntityWrapper<B>> {
    return ecs.query.components(...this.filter);
  }
}
