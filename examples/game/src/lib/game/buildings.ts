import ECSBuilder, { Component, ECSPlugin, Entity, Query, System, SystemSchedule, type Bundle, type EntityId } from "ecs";
import { GameMap } from "./map";
import type { Position } from "./common";

enum ItemType {
  Gas,
  Fluid,
  Solid,
  Energy,
  Digital,
}

class Item {
  constructor(
    public readonly name: string,
    public readonly type: ItemType,
    public readonly maxStack: number = 64
  ) {}

  static eq(a: Item, b: Item): boolean {
    return a.name === b.name && a.type === b.type;
  }
};



class ItemStack {
  constructor(
    public item: Item,
    public count: number,
    public readonly maxCount: number = 64
  ) {
    if (count > maxCount) {
      throw new Error(`Cannot create ItemStack with count ${count} greater than maxCount ${maxCount}`);
    }
  }

  add(stack: ItemStack): ItemStack {
    if (!Item.eq(this.item, stack.item) || this.full) {
      return stack;
    }

    const space = this.maxCount - this.count;
    const transfer = Math.min(space, stack.count);
    this.count += transfer;
    stack.count -= transfer;
    return stack;
  }

  get empty(): boolean {
    return this.count === 0;
  }
  
  get full(): boolean {
    return this.count === this.maxCount;
  }
}

type InsertResult = ItemStack | boolean;
    
class BuildingStorage extends Component {
  public storage = new Map<ItemType, ItemStack[]>();

  get str(): string {
    return [...this.storage.entries()].map(([type, stacks]) => {
      return `${type}: ${stacks.map((stack) => `${stack.item.name}.${stack.count}`).join(", ")}`;
    }).join("\n");
  }

  get filter(): ItemFilter {
    return (item: Item) => this.storage.has(item.type);
  }

  *items(types?: ItemType[]): IterableIterator<ItemStack> {
    for (const type of types || this.storage.keys()) {
      const stacks = this.storage.get(type);
      if (!stacks) {
        continue;
      }
      for (const stack of stacks) {
        yield stack;
      }
    }
  }

  constructor(public readonly capacity: Map<ItemType, number>) {
    super();
    this.capacity.forEach((_, type) => {
      this.storage.set(type, []);
    });
  }

  insert(itemStack: ItemStack): InsertResult {
    const type = itemStack.item.type;
    const storage = this.storage.get(type)!;
    const capacity = this.capacity.get(type)!;

    if (!storage) {
      return false;
    }

    const start = itemStack.count;
    
    storage.forEach((stack) => {
      itemStack = stack.add(itemStack);
      if (itemStack.empty) {
        return itemStack;
      }
    });

    if (!itemStack.empty && capacity > storage.length) {
      storage.push(itemStack);
      return true;
    }
    
    return itemStack;
  }

  remove(itemStack: ItemStack) {
    const storage = this.storage.get(itemStack.item.type);
    if (!storage) {
      return;
    }
    storage.splice(storage.indexOf(itemStack), 1); 
  }
}

type ItemReceiver = (itemStack: ItemStack) => InsertResult;
type ItemFilter = (item: Item) => boolean;

class BuildingOutput extends Component {
  private destinations: Map<EntityId, [ItemReceiver, ItemFilter]> = new Map();

  send(itemStack: ItemStack): InsertResult {
    for (const [id, [receiver, filter]] of this.destinations) {
      if (filter(itemStack.item)) {
        const result = receiver(itemStack);
        if (result === true) {
          return true;
        }
        itemStack = result as ItemStack;
      }
    }
    if (itemStack.empty) {
      return true;
    }
    return itemStack;
  }

  addDestination(ent: Entity<[BuildingStorage]>) {
    const storage = ent.get(BuildingStorage);
    this.destinations.set(ent.id, [storage.insert.bind(storage), storage.filter]);
  }

  removeDestination(id: EntityId) {
    this.destinations.delete(id);
  }
}

abstract class BuildingProcess extends Component {
  abstract tick(ent: Entity<[Building, BuildingProcess]>): void;
}

class Building extends Component {
  constructor(
    public readonly name: string
  ) {
    super();
  }

  tick(ent: Entity<[Building]>) {
    const process = ent.get(BuildingProcess);
    const output = ent.get(BuildingOutput);
    const storage = ent.get(BuildingStorage);
    const monitor = ent.get(StorageMonitor);

    if (process) {
      process.tick(ent);
    }

    if (output && storage) {
      for (const stack of storage.items()) {
        const result = output.send(stack) as ItemStack | true;
        if (result === true) {
          storage.remove(stack);
          continue;
        }
        if (result.count !== stack.count) {
          stack.count = result.count;
        }
      }
    }

    if (monitor) {
      monitor.tick(ent);
    }
  }
}

const Oxygen = new Item("Oxygen", ItemType.Gas);
const Water = new Item("Water", ItemType.Fluid);
const Nitrogen = new Item("Nitrogen", ItemType.Gas);

class CollectAir extends BuildingProcess {
  tick(ent: Entity<[Building, BuildingProcess, BuildingOutput]>) {
    const output = ent.get(BuildingOutput);

    const generated = [
      new ItemStack(Nitrogen, 64),
      new ItemStack(Nitrogen, 14),
      new ItemStack(Oxygen, 21),
      new ItemStack(Water, 1)
    ]

    for (let stack of generated) {
      output.send(stack);
    }
  }
}

class StorageMonitor extends Component {
  tick(ent: Entity<[StorageMonitor, BuildingStorage]>) {
    const storage = ent.get(BuildingStorage);
    console.log(storage.str);
  }
}

class Build extends Component {
  constructor(
    public readonly sprite: string,
    public readonly position: Position,
  ) {
    super();
  }
}

export class BuildingPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    ecs.add.system(
      SystemSchedule.Startup,
      System.new(
        Query.Empty,
        (_, _res, ecs) => {
          const collector = ecs.add.entity([
            new Building("Air Collector"),
            new BuildingOutput(),
            new CollectAir(),
            new Build("", { x: 5, y: 5 }),
          ])

          const storage = ecs.add.entity([
            new Building("Gas Tank"),
            new BuildingStorage(new Map([[ItemType.Gas, 10], [ItemType.Fluid, 10]])),
            new Build("", { x: 10, y: 10 }),
          ])

          collector.get(BuildingOutput).addDestination(storage);
        }
      )
    )

    ecs.add.system(
      SystemSchedule.FixedUpdate,
      System.new(
        Query.bundle(Build).resources(GameMap),
        ([toBuild], resources) => {
          const map = resources.get(GameMap);
          toBuild.forEach((ent) => {
            const build = ent.get(Build);
            if (!build) {
              return;
            }
            map.build(build.position, { background: "blue", sprite: build.sprite });
            ent.remove(build);
          })
        })
    )

    ecs.add.system(
      SystemSchedule.FixedUpdate,
      System.new(
        Query.bundle(Building).resources(GameMap),
        ([buildings], resources) => {
          const map = resources.get(GameMap);
          buildings.forEach((ent) => {
            ent.get(Building).tick(ent);
          })
        }
      )
    )
  }
}
