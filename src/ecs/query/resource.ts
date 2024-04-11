import type ECS from "../engine"
import type Resource from "../store/resource";
import type { ClassOf, IsUnique, TupleClass } from "../utils"

export type Resources<R extends TupleClass<Resource[]>> = IsUnique<R> extends true ? R : ["Resources must be unique"];

export class ResourcesMap<R extends Resource[]> {
  private constructor(private resources: Map<Function, R[number]>) {}

  get empty() {
    return this.resources.size === 0;
  }

  get<T extends R[number]>(r: ClassOf<T>): T {
    const resource = this.resources.get(r);
    if (!resource) throw new Error(`Resource not loaded: ${r}`);
    return resource as T;
  }

  update(ecs: ECS) {
    for (const resource of this.resources.keys()) {
      this.resources.set(resource, ecs.query.resource(resource as ClassOf<R[number]>));
    }
  }

  static new<R extends Resource[]>(resources: Resources<TupleClass<R>>): ResourcesMap<R> {
    const map = new Map<Function, R[number]>();
    for (const resource of resources) {
      const key = resource;
      if (map.has(key as Function)) throw new Error(`Duplicate resource ${resource}`);
      map.set(key as Function, null as any);
    }
    return new ResourcesMap(map);
  }
}

