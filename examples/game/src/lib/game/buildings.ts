import ECSBuilder, { Component, Drawable, ECSPlugin, Entity, Query, System, SystemSchedule, type Bundle, type EntityId } from "ecs";
import { Position } from "./common";

enum ItemTypes {
  Gas,
  Fluid,
  Solid,
  Digital,
}

abstract class ItemPacket {
  abstract type: ItemTypes;
  abstract name: string;

  constructor(public quantity: number) { }
}

class ItemStorageSlot<T extends ItemTypes> {
  public item?: ItemPacket;
  constructor(
    public type: T,
    public capacity: number
  ) { }
}

abstract class BuildingStorage extends Component {
  slots: ItemStorageSlot<ItemTypes>[] = [];
  private full = false;

  get str() {
    return this.slots.map(slot => slot.item ? `${slot.item.name}:${slot.item.quantity}` : 'empty').join(', ');
  }

  get any(): ItemPacket | undefined {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.item !== undefined) {
        const ret = { ...slot.item };
        this.slots[i].item = undefined;
        this.full = false;
        return ret;
      }
    }
    return undefined;
  }
      

  add(item: ItemPacket): ItemPacket | null {
    if (this.full) {
      return item;
    }
    let remaining = item.quantity;
    let start = remaining;
    for (const slot of this.slots) {
      if (slot.type === item.type) {
        if (!slot.item) {
          slot.item = { ...item, quantity: Math.min(remaining, slot.capacity) };
          remaining -= item.quantity;
        } else if (slot.item.name === item.name) {
          const diff = slot.capacity - slot.item.quantity;
          if (diff > 0) {
            const toAdd = Math.min(remaining, diff);
            slot.item.quantity += toAdd;
            remaining -= toAdd;
          }
        }
        if (remaining == 0) {
          return null;
        }
      }
    }
    if (remaining === start) {
      this.full = true;
    }
    if (remaining > 0) {
      return { ...item, quantity: remaining };
    }
    return null;
  }

  take(item: ItemPacket): ItemPacket {
    let remaining = item.quantity;
    for (const slot of this.slots) {
      if (slot.item && slot.type === item.type && slot.item.name === item.name) {
        const toTake = Math.min(remaining, slot.item.quantity);
        slot.item.quantity -= toTake;
        remaining -= toTake;
        if (slot.item.quantity === 0) {
          slot.item = undefined;
        }
        if (remaining === 0) {
          break;
        }
      }
    }

    item.quantity -= remaining;
    return item;
  }
}

class Cable extends Component {
  private receivers: Map<EntityId, (item: ItemPacket) => ItemPacket | null> = new Map();
  private _queue: ItemPacket | null = null;
  private capacity = 64;

  queue(item: ItemPacket): ItemPacket {
    if (!this._queue) {
      const toAdd = Math.min(this.capacity, item.quantity);
      this._queue = { ...item, quantity: toAdd };
      item.quantity -= toAdd;
      return item;
    } else if (this._queue.name === item.name && this._queue.type === item.type) {
      const toAdd = Math.min(this.capacity - this._queue.quantity, item.quantity);
      this._queue.quantity += toAdd;
      item.quantity -= toAdd;
      return item;
    }
    return item;
  }
  
  tick() {
    for (const [id, receiver] of this.receivers.entries()) {
      const item = this._queue;
      if (!item) {
        return;
      }
      this._queue = receiver(item);
    }
  }

  register(ent: Entity<[BuildingStorage]>) {
    const storage = ent.get(BuildingStorage);
    const receive = (item: ItemPacket) => {
      return storage.add(item);
    }
    this.receivers.set(ent.id, receive);
  }

  unregister(id: EntityId) {
    this.receivers.delete(id);
  }
}

abstract class Building<B extends Bundle> extends Component {
  abstract tick(ent: Entity<B>): void;
}

export type GeneratorBuildingBundle = [ BuildingStorage, Cable ];
export abstract class GeneratorBuilding extends Building<GeneratorBuildingBundle> {
  abstract tick(tick: Entity<GeneratorBuildingBundle>): void;
  protected trySend(ent: Entity<GeneratorBuildingBundle>): void {
    const storage = ent.get(BuildingStorage);
    let next = storage.any;
    if (next) {
      const cable = ent.get(Cable);
      const rem = cable.queue(next);
      if (rem.quantity > 0) {
        storage.add(rem);
      }
    }
  }
}

export type ProcessingBuildingBundle = [ BuildingStorage ];
export abstract class ProcessingBuilding extends Building<ProcessingBuildingBundle> {
  abstract tick(tick: Entity<ProcessingBuildingBundle>): void;
}

class Air extends ItemPacket {
  type = ItemTypes.Gas;
  name = 'air';
}

class GasStorage extends BuildingStorage {
  slots = [
    new ItemStorageSlot(ItemTypes.Gas, 64),
    new ItemStorageSlot(ItemTypes.Gas, 64),
    new ItemStorageSlot(ItemTypes.Gas, 64),
    new ItemStorageSlot(ItemTypes.Gas, 64),
  ];

  accepts(item: ItemPacket) {
    return item.type === ItemTypes.Gas && item.name === 'air';
  }
}
  
class AirCollector extends GeneratorBuilding {
  tick(ent: Entity<GeneratorBuildingBundle>): void {
    const storage = ent.get(BuildingStorage);
    const generated = new Air(1);
    // voids excess
    const rem = storage.add(generated);
    super.trySend(ent);
  }
}

class AirProcessor extends ProcessingBuilding {
  tick(ent: Entity<ProcessingBuildingBundle>): void {
    const cStorage = ent.get(BuildingStorage);
    console.log(cStorage.str);
  }
}

class BuildingRender extends Drawable {
  draw<T extends Bundle>(ent: Entity<T>, ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const pos = ent.get(Position);
    if (!pos) return;

    ctx.fillStyle = 'green';
    ctx.fillRect(pos.x, pos.y, 32, 32);
  }
}

const SpawnSampleBuildings = System.new(
  Query.Empty,
  (_, __, ecs) => {
    const processor = ecs.add.entity([new GasStorage(), new AirProcessor(), new BuildingRender(), new Position(50, 50)]);
    const collector = ecs.add.entity([new GasStorage(), new AirCollector(), new BuildingRender(), new Position(10, 10), new Cable()]);
    const cable = collector.get(Cable);

    cable.register(processor);
  }
);

const GeneratorBuildingSystem = System.new(
  Query.bundle(GeneratorBuilding),
  ([buildings]) => {
    buildings.forEach(ent => {
      const building = ent.get(GeneratorBuilding);
      building.tick(ent as any);
   });
  }
);

const CableSystem = System.new(
  Query.bundle(Cable),
  ([cables]) => {
    cables.forEach(ent => {
      const cable = ent.get(Cable);
      cable.tick();
    });
  }
);

const ProcessingBuildingSystem = System.new(
  Query.bundle(ProcessingBuilding),
  ([buildings]) => {
    buildings.forEach(ent => {
      const building = ent.get(ProcessingBuilding);
      building.tick(ent as any);
    });
  }
);

export class BuildingPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    ecs.add.system(SystemSchedule.Startup, SpawnSampleBuildings);
    ecs.add.system(SystemSchedule.FixedUpdate, GeneratorBuildingSystem);
    ecs.add.system(SystemSchedule.FixedUpdate, ProcessingBuildingSystem);
    ecs.add.system(SystemSchedule.FixedUpdate, CableSystem);
  }
}
    
