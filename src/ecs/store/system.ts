import ECSControls from "../pub/controls";
import { Bundle } from "./entity";
import Resource from "./resource";
import { ResourcesMap } from "../query/resource";
import Query from "../query/builder";
import { BundleResultList } from "../query/builder";

export enum SystemSchedule {
  Prepare,
  Startup,
  Update,
  FixedUpdate,
  Stop,
}

export type SystemControls = {
  enable: () => void;
  disable: () => void;
};

export type SystemFn<B extends Bundle[], R extends Resource[]> = (bundles: BundleResultList<B>, res: ResourcesMap<R>, ecs: ECSControls) => void;
export type SystemDef<B extends Bundle[], R extends Resource[]> = [Query<B, R>, SystemFn<B, R>];

export default class System<B extends Bundle[], R extends Resource[]> {
  public readonly query: Query<B, R>;
  public readonly cb: SystemFn<B, R>;
  private _active = true;
  get active() { return this._active; }
  
  disable() {
    this._active = false;
  }

  private constructor(args: SystemDef<B, R>) {
    this.query = args[0];
    this.cb = args[1];
  }

  static new<B extends Bundle[], R extends Resource[]>(args: SystemDef<B, R>) {
    return new System(args);
  }
}

export class SystemStore extends Map<SystemSchedule, Set<System<any, any>>> {
  constructor() {
    super();
    this.set(SystemSchedule.Prepare, new Set());
    this.set(SystemSchedule.Startup, new Set());
    this.set(SystemSchedule.Update, new Set());
    this.set(SystemSchedule.FixedUpdate, new Set());
  }

  add(schedule: SystemSchedule, system: System<any, any>) {
    this.get(schedule)!.add(system);
  }

  execute(schedule: SystemSchedule, ecs: ECSControls) {
    for (const system of this.get(schedule)!) {
      if (!system.active) continue;
      const args = system.query.execute(ecs.ecs);
      system.cb(args[0], args[1], ecs);
    }
  }
}
    
