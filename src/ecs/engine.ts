import Component, { type ClassOf } from "./store/component";
import { Bundle, EntityStore, EntityWrapper, type EntityId } from "./store/entity";
import System, { SystemSchedule, SystemStore } from "./store/system";

import type Resource from "./store/resource";
import type ECSBuilder from "./builder/builder";
import { ResourceStore } from "./store/resource";
import { ComponentFilter } from "./query/bundle";

export default class ECS {
  entities: EntityStore = new EntityStore();
  systems: SystemStore = new SystemStore();
  resources: ResourceStore = new ResourceStore();
  
  private _dtu: number = 0;
  private _dtf: number = 0;

  set dtUpdate(dt: number) {
    this._dtu = dt;
  }

  set dtFixed(dt: number) {
    this._dtf = dt;
  }

  constructor() { }

  registerResource<T extends Resource>(resource: T) {
    if (!this.resources.add(resource)) {
      throw new Error('Resource already registered');
    }
  }

  removeEntity(id: EntityId) {
    this.entities.delete(id);
  }

  createEntity<B extends Bundle>(defaults?: B): EntityWrapper<B> {
    return this.entities.new(defaults);
  }

  queryResource<R extends Resource>(clazz: ClassOf<R>): R {
    return this.resources.get(clazz) as R;
  }

  queryComponents<C extends Component>(...query: ComponentFilter<C>[]): Set<EntityWrapper<[C]>> {
    return this.entities.withComponents<[C]>(query);
  }

  addSystem(schedule: SystemSchedule, system: System<any, any>) {
    this.systems.add(schedule, system);
  }

  runSystems(schedule: SystemSchedule, controls: ECSBuilder) {
    this.systems.execute(schedule, controls);
  }
}

