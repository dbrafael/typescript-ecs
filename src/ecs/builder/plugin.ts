import type ECSControls from "./controls";

export type Priority = number;
export type Timing = Priority;

export enum PluginSchedule {
  Prepare,
  Startup,
  Stopped,
}

export default abstract class ECSPlugin {
  abstract build(ecs: ECSControls): void;
}

export type PluginRegister = [PluginSchedule, ECSPlugin, Timing?];

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

export class PluginStore extends Map<PluginSchedule, PluginList> {
  constructor() {
    super();
    this.set(PluginSchedule.Prepare, new PluginList());
    this.set(PluginSchedule.Startup, new PluginList());
    this.set(PluginSchedule.Stopped, new PluginList());
  }
  
  add(plugin: ECSPlugin, lifecycle: PluginSchedule, timing: Timing = 0) {
    if (!this.has(lifecycle)) {
      this.set(lifecycle, new PluginList());
    }
    this.get(lifecycle)!.add(plugin, timing);
  }

  build(ecs: ECSControls, lifecycle: PluginSchedule) {
    const plugins = this.get(lifecycle)!;
    plugins.build(ecs);
    plugins.clear();
  }
}

