import { ComponentFilter } from "../query/bundle";
import Component, { ComponentStore, ComponentId, Filtered } from "./component";
import { AbstractClassOf, ClassOf } from "../utils";

export type EntityId = number;
export type Bundle = [ ...Component[] ];

type EntityComponents = Map<ComponentId, Component>;

type Unknown<T> = T | undefined;
type ComponentResult<C extends Component, Has extends Component[]> = C extends ClassOf<infer X> ? X extends Has[number] ? C : Unknown<C> : Unknown<C>;

export default class Entity<Contains extends Bundle = Bundle> {
  private _components: EntityComponents = new Map();

  *components(): IterableIterator<[ComponentId, Component]> {
    for (const [generator, component] of this._components) {
      yield [generator, component];
    }
  }

  constructor(public readonly id: EntityId) {}

  add<C extends Component>(component: C) {
    this._components.set(component.id, component);
  }

  has(comp: ClassOf<Component> | ComponentId): boolean {
    const id = typeof comp === 'string' ? comp : comp.name;
    return this._components.has(id);
  }

  get<C extends Component>(id: ComponentId): ComponentResult<C, Contains> {
    return this._components.get(id) as ComponentResult<C, Contains>;
  }

  delete<C extends Component>(component: C) {
    this._components.delete(component.id);
  }

  getDerived<T extends Component>(parent: ComponentId, relations: ComponentStore): T | undefined {
    const types = relations.extendTypes(parent);
    for (const type of types) {
      if (this.has(type)) {
        return this.get(type) as T;
      }
    }
  }

  hasMany(comps: (ClassOf<Component> | ComponentId)[]): boolean {
    return comps.every(comp => this.has(comp));
  }
}

export class EntityWrapper<B extends Bundle> {
  private static _entities: EntityStore;
  private static _components: ComponentStore;
  static updateStores(entities: EntityStore, components: ComponentStore) {
    EntityWrapper._entities = entities;
    EntityWrapper._components = components;
  }

  constructor(
    private _entity: Entity<B>, 
  ) { }
  get id() {
    return this._entity.id;
  }

  add<C extends Component>(component: C) {
    if (this._entity.has(component.id)) {
      throw new Error(`Entity already has component ${component.id}`);
    }
    EntityWrapper._entities.update(this._entity, [component], []);
    return this;
  }

  remove<C extends Component>(component: C) {
    if (!this._entity.has(component.id)) {
      return this;
    }
    EntityWrapper._entities.update(this._entity, [], [component]);
    return this;
  }

  delete() {
    EntityWrapper._entities.delete(this._entity.id);
  }

  get<C extends Component>(comp: ClassOf<C> | AbstractClassOf<C> | ComponentId): ComponentResult<C, B> {
    const id = typeof comp === 'string' ? comp : comp.name;
    const result = this._entity.get(id);
    if (!result) {
      const tryExtend = this._entity.getDerived(id, EntityWrapper._components);
      return tryExtend as ComponentResult<C, B>;
    }
    return result as ComponentResult<C, B>;
  }

  has<B extends Bundle>(...comp: (ClassOf<B[number]> | AbstractClassOf<B[number]> | ComponentId)[]): boolean {
    let valid = true;
    for (const c of comp) {
      const id = typeof c === 'string' ? c : c.name;
      if (!this._entity.has(id)) {
        valid = false;
        break;
      }
    }
    return valid;
  }

  *components(): IterableIterator<[ComponentId, Component]> {
    yield* this._entity.components();
  }
}

class Indexer {
  private index = 0;
  private _free: number[] = [];

  next() {
    if (this._free.length > 0) {
      return this._free.pop()!;
    }
    return this.index++;
  }

  free(index: number) {
    this._free.push(index);
  }
}

export class EntityStore {
  private static indexer = new Indexer();

  private entities: Map<EntityId, EntityWrapper<Bundle>> = new Map();
  private components: ComponentStore = new ComponentStore();
  private entitiesWithComponent: Map<ComponentId, Set<EntityWrapper<Bundle>>> = new Map();

  constructor() {
    EntityWrapper.updateStores(this, this.components);
  }

  new<B extends Bundle>(defaults?: B): EntityWrapper<B> {
    const id = EntityStore.indexer.next();
    const entity = new Entity<B>(id);
    const wrapper = new EntityWrapper(entity);
    if (defaults) {
      for (const comp of defaults) {
        if (!this.entitiesWithComponent.has(comp.id)) {
          this.entitiesWithComponent.set(comp.id, new Set());
        }
        entity.add(comp);
        this.entitiesWithComponent.get(comp.id)!.add(wrapper);
        this.components.add(comp);
      }
    }
    this.entities.set(id, wrapper);
    return wrapper;
  }

  update<B extends Bundle>(ent: Entity, add: Component[], remove: Component[]): EntityWrapper<B> {
    add.forEach(component => {
      ent.add(component);
      this.components.add(component);
      if (!this.entitiesWithComponent.has(component.id)) {
        this.entitiesWithComponent.set(component.id, new Set());
      }
      this.entitiesWithComponent.get(component.id)?.add(this.entities.get(ent.id)!);
    });
    remove.forEach(component => {
      ent.delete(component);
      this.components.delete(component);
      this.entitiesWithComponent.get(component.id)?.delete(this.entities.get(ent.id)!);
    });
    return this.entities.get(ent.id) as EntityWrapper<B>;
  }

  get<T extends Bundle = any[]>(id: EntityId): EntityWrapper<T> | undefined {
    return this.entities.get(id);
  }

  delete(id: EntityId) {
    const entity = this.entities.get(id);
    if (!entity) return;

    this.entities.delete(id);
    for (const [cid, comp] of entity.components()) {
      this.entitiesWithComponent.get(cid)?.delete(entity);
      this.components.delete(comp);
    }
  }

  withComponents<B extends Bundle>(query: ComponentFilter<B[number]>[]): Set<EntityWrapper<B>> {
    const ret: Set<EntityWrapper<B>> = new Set();
    if (query.length === 0) {
      return ret;
    }
    for (const q of query) {
      const [field, filter] = q instanceof Filtered ? [q.component, q.fn] : [q, undefined];
      let id = typeof field === 'string' ? field : field.name;
      let matches = this.entitiesWithComponent.get(id) || new Set();
      if (matches.size === 0) {
        matches = new Set();
        const extended = this.components.extendTypes(id);
        if (!extended) return new Set();

        for (const type of extended) {
          const entities = this.entitiesWithComponent.get(type);
          entities?.forEach(entity => {
            matches.add(entity);
          });
        }
      }
      if (matches.size === 0) {
        return new Set();
      }
      if (ret.size === 0) {
        for (const entity of matches) {
          if (!filter || filter(entity.get(field) as B[number])) {
            ret.add(entity);
          }
        }
      } else {
        for (const entity of ret) {
          if (!matches.has(entity) || (filter && !filter(entity.get(field) as B[number]))) {
            ret.delete(entity);
          }
        }
      }
    }
    return ret;
  } 
}
