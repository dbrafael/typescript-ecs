import { Bundle, EntityId, EntityWrapper } from "ecs/store/entity";
import ECS from "../engine";
import type Query from "../query/builder";
import Resource from "../store/resource";
import System, { SystemSchedule, type SystemFn } from "../store/system";

export default class ECSControls {
  constructor(protected ecs: ECS) { }

  add = {
    entity: <B extends Bundle>(defaults?: B): EntityWrapper<B> => {
      return this.ecs.createEntity(defaults);
    },
    system: <B extends Bundle[], R extends Resource[]>(schedule: SystemSchedule, system: System<B, R>) => {
      this.ecs.addSystem(schedule, system);
    },
    resource: <R extends Resource>(resource: R) => {
      this.ecs.registerResource(resource);
    }
  }

  create = {
    system: <B extends Bundle[], R extends Resource[]>(schedule: SystemSchedule, query: Query<B, R>, cb: SystemFn<B, R>) => {
      const system = System.new(query, cb);
      this.ecs.addSystem(schedule, system);
    }
  }

  query = <B extends Bundle[], R extends Resource[]>(query: Query<B, R>) => {
    return query.execute(this.ecs);
  }

  remove = {
    entity: (id: EntityId) => {
      this.ecs.removeEntity(id);
    }
  }
}
