import { SystemSchedule } from "ecs/store/system";
import ECS from "../engine";
import Controls from "./controls";
import { PluginRegister, PluginSchedule, PluginStore } from "./plugin";

export default class ECSBuilder extends Controls {
  private plugins: PluginStore = new PluginStore();
  private interval: number = -1;

  constructor() {
    const ecs = new ECS();
    super(ecs);
  }

  get engine(): ECS {
    return this.ecs;
  }

  run(fps: number) {
    if (this.interval !== -1) {
      this.stop();
    } else {
      this.plugins.build(this, PluginSchedule.Prepare);
      this.ecs.runSystems(SystemSchedule.Prepare, this);
    }

    const frameTime = 1000 / fps;
    let lastFrameTime = Date.now();
    let lastUpdateTime = Date.now();

    this.plugins.build(this, PluginSchedule.Startup);
    this.ecs.runSystems(SystemSchedule.Startup, this);

    console.log(this.ecs);

    this.interval = setInterval(() => {
      const dtu = Date.now() - lastUpdateTime;
      const dtf = Date.now() - lastFrameTime;
      this.ecs.dtUpdate = dtu;

      this.ecs.runSystems(SystemSchedule.Update, this);
      if (dtf < frameTime) return;

      this.ecs.dtFixed = dtf;
      lastFrameTime = Date.now();
      this.ecs.runSystems(SystemSchedule.FixedUpdate, this);
    }, frameTime / 3);
  }

  stop() {
    this.plugins.build(this, PluginSchedule.Stopped);
    clearInterval(this.interval);
  }

  plugin(..._plugin: PluginRegister) {
    const [lifecycle, plugin, timing] = _plugin;
    this.plugins.get(lifecycle)!.add(plugin, timing);
  }
}
