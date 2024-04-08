import { ClassOf } from "./component";

export type ResourceId = string;
export default abstract class Resource {
  get id() {
    return this.constructor.name;
  }
}

export class ResourceStore {
  private resources: Map<ResourceId, Resource> = new Map();
  private used: Set<ResourceId> = new Set();

  add<T extends Resource>(resource: T): boolean {
    if (this.used.has(resource.id)) {
      return false;
    }

    this.used.add(resource.id);
    this.resources.set(resource.id, resource);
    return true;
  }

  get<T extends Resource>(resource: ClassOf<T>): T | undefined {
    return this.resources.get(resource.name) as T;
  }

  delete<T extends Resource>(resource: ClassOf<T>) {
    this.resources.delete(resource.name);
    this.used.delete(resource.name);
  }
}
