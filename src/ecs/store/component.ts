import { ComponentRepresentation } from "ecs/query/bundle";
import Resource from "./resource";

export type ComponentId = string;

export function Filter<C extends Component>(component: ComponentRepresentation<C>, condition: (component: C) => boolean): Filtered<C> {
  const id = typeof component === 'string' ? component : component.name;
  return new Filtered(id, condition);
}

export class Filtered<C extends Component> {
  constructor(public component: ComponentId, public fn: (component: C) => boolean) { }

  type_matches(component: ComponentId) {
    return this.component === component;
  }

  matches(component: C) {
    return !this.type_matches(component.id) || this.fn(component);
  }
}

export default abstract class Component { 
  get id() {
    return Object.getPrototypeOf(this).constructor.name;
  }
}

export class ComponentStore {
  private relations: Map<ComponentId, Set<ComponentId>> = new Map();
  private components: Map<ComponentId, Set<Component>> = new Map();

  add<T extends Component>(comp: T) {
    const id = comp.id;
    if (!this.components.has(id)) {
      this.components.set(id, new Set());
    }

    this.components.get(id)!.add(comp);

    let current = comp.constructor;

    while (true) {
      const parent = Object.getPrototypeOf(current.prototype).constructor;
      if (!parent || parent === Component) {
        break;
      }
      if (this.relations.has(parent.name)) {
        this.relations.get(parent.name)!.add(current.name);
        break;
      }
      this.relations.set(parent.name, new Set([current.name]));
      current = parent;
    }
  }

  delete<T extends Component>(comp: T) {
    const id = comp.id;
    if (!this.components.has(id)) return;

    this.components.get(id)!.delete(comp);
  }

  ofType<T extends Component>(comp: ClassOf<T>): Set<T> | undefined {
    return this.components.get(comp.name) as Set<T>;
  }

  extend<T extends Component>(comp: ComponentId): Map<ComponentId, Set<T>> {
    const related = this.extendTypes(comp);
    const ret = new Map();

    if (!related) return ret;

    for (const type of related) {
      ret.set(type, this.components.get(type) as Set<T>);
    }

    return ret;
  }

  extendTypes(comp: ComponentId): Set<ComponentId> {
    return this.relations.get(comp) || new Set();
  }
}

export type ClassOf<T extends Component> = (new (...args: any[]) => T);
export type Constructed<T> = T extends ClassOf<infer U> ? U : never;

export type AbstractClassOf<T> = (abstract new (...args: any[]) => T);

export type TupleClass<T extends (Component | Resource)[]> = [ ...{ [K in keyof T]: ClassOf<T[K]> } ];
