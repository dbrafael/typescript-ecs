import { SystemSchedule } from "../store/system";
import ECSControls from "./controls";

export type Priority = number;
export type Timing = Priority;

export default abstract class ECSPlugin {
  abstract build(ecs: ECSControls): void;
}

export type PluginRegister = [SystemSchedule, ECSPlugin, Timing?];

export class PluginList extends Array<ECSPlugin> {
  add(plugin: ECSPlugin, timing: Timing = 0) {
    let i = 0;
    for (; i < this.length; i++) {
      if (this[2] ?? 0 < timing) break;
    }
    this.splice(i, 0, plugin);
  }

  build(ecs: ECSControls) {
    this.forEach((plugin) => {
      plugin.build(ecs);
    });
  }

  clear() {
    this.length = 0;
  }
}

export class PluginStore extends Map<SystemSchedule, PluginList> {
  constructor() {
    super();
    this.set(SystemSchedule.Prepare, new PluginList());
    this.set(SystemSchedule.Startup, new PluginList());
    this.set(SystemSchedule.Stop, new PluginList());
  }
  
  add(plugin: ECSPlugin, lifecycle: SystemSchedule, timing: Timing = 0) {
    if (!this.has(lifecycle)) {
      throw new Error(`Lifecycle ${lifecycle} not registered in plugin store.`);
    }
    this.get(lifecycle)!.add(plugin, timing);
  }

  build(ecs: ECSControls, lifecycle: SystemSchedule) {
    const plugins = this.get(lifecycle)!;
    plugins.build(ecs);
    plugins.clear();
  }
}

