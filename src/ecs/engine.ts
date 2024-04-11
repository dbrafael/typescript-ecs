import Component from "./store/component";
import { Bundle, EntityStore, EntityWrapper, type EntityId } from "./store/entity";
import System, { SystemFn, SystemSchedule, SystemStore } from "./store/system";

import type Resource from "./store/resource";
import type ECSControls from "./pub/controls";
import { ResourceStore } from "./store/resource";
import { ComponentFilter } from "./query/bundle";
import Query from "./query/builder";
import { ClassOf } from "./utils";

export default class ECS {
  private _entities: EntityStore = new EntityStore();
  private _systems: SystemStore = new SystemStore();
  private _resources: ResourceStore = new ResourceStore();

  private _lastFrame: number = 0;
  private _lastTick: number = 0;

  set lastTick(t: number) {
    this._lastTick = t;
  }

  set lastFrame(t: number) {
    this._lastFrame = t;
  }

  constructor() { }

  register = {
    resource: <T extends Resource>(resource: T) => {
      if (!this._resources.add(resource)) {
        throw new Error('Resource already registered');
      }
    },
    system: <B extends Bundle[], R extends Resource[]>(schedule: SystemSchedule, system: System<B, R>) => {
      this._systems.add(schedule, system);
    },
  };
  create = {
    entity: <B extends Bundle>(defaults?: B) => {
      return this._entities.new(defaults);
    },
    system: <B extends Bundle[], R extends Resource[]>(schedule: SystemSchedule, query: Query<B, R>, fn: SystemFn<B, R>) => {
      this._systems.add(schedule, System.new([query, fn]));
    }
  }
  remove = {
    entity: (id: EntityId) => {
      this._entities.delete(id);
    },
  }
  query = {
    components: <C extends Component>(...query: ComponentFilter<C>[]): Set<EntityWrapper<[C]>> => {
      return this._entities.withComponents<[C]>(query);
    },
    resource: <R extends Resource>(clazz: ClassOf<R>): R => {
      return this._resources.get(clazz) as R;
    },
  }
  run = {
    systems: (schedule: SystemSchedule, controls: ECSControls) => {
      this._systems.execute(schedule, controls);
    }
  }
}
