import type ECS from "../engine"
import type Resource from "../store/resource";
import type { IsUnique } from "../utils"
import type { ClassOf, TupleClass } from "../store/component";

export type Resources<R extends TupleClass<Resource[]>> = IsUnique<R> extends true ? R : ["Resources must be unique"];

export class ResourcesResult<R extends Resource[]> {
  private constructor(private resources: Map<Function, R[number]>) {}

  get size() {
    return this.resources.size;
  }

  get<T extends R[number]>(r: ClassOf<T>): T {
    const resource = this.resources.get(r);
    if (!resource) throw new Error(`Resource not loaded: ${r}`);
    return resource as T;
  }

  update(ecs: ECS) {
    for (const resource of this.resources.keys()) {
      this.resources.set(resource, ecs.queryResource(resource as ClassOf<R[number]>));
    }
  }

  static new<R extends Resource[]>(resources: Resources<TupleClass<R>>): ResourcesResult<R> {
    const map = new Map<Function, R[number]>();
    for (const resource of resources) {
      const key = resource;
      if (map.has(key as Function)) throw new Error(`Duplicate resource ${resource}`);
      map.set(key as Function, null as any);
    }
    return new ResourcesResult(map);
  }
}

