import { PluginRegister, PluginStore } from "./plugin";
import { SystemSchedule } from "../store/system";
import ECS from "../engine";
import Subject from "../signal";

export default class ECSControls {
  private readonly _ecs: ECS = new ECS();
  private _plugins: PluginStore = new PluginStore();
  private _running: number = -1;
  private _systemSchedules = new Subject<SystemSchedule>();

  when(schedule: SystemSchedule): Subject<ECSControls> {
    return this._systemSchedules.derived<ECSControls>(() => this, (v: SystemSchedule) => v === schedule);
  }

  get ecs() {
    return this._ecs;
  }

  private prepare() {
    this._plugins.build(this, SystemSchedule.Prepare);
    this._ecs.run.systems(SystemSchedule.Prepare, this);
    this._systemSchedules.value = SystemSchedule.Prepare;
  }

  private startup() {
    this._plugins.build(this, SystemSchedule.Startup);
    this._ecs.run.systems(SystemSchedule.Startup, this);
    this._systemSchedules.value = SystemSchedule.Startup;
  }

  private update() {
    this._systemSchedules.value = SystemSchedule.Update;
    this._ecs.lastFrame = Date.now();
    this._ecs.run.systems(SystemSchedule.Update, this);
  }

  stop() {
    clearInterval(this._running);
  }

  run(fps: number = 20, interval: number = 10) {
    if (this._running !== -1) {
      this.stop();
    } else {
      this.prepare();
    }

    const frameTime = 1000 / fps;

    this.startup();

    this._running = setInterval(() => {
      this._ecs.lastTick = Date.now();
      if (this._ecs.lastTick - this._ecs.lastFrame > frameTime) {
        this.update();
      }
    }, interval);
  }

  register = {
    plugin: ([lifecycle, plugin, timing]: PluginRegister) => {
      this._plugins.get(lifecycle)!.add(plugin, timing);
    },
    ...this._ecs.register,
  };
  create = this._ecs.create;
  remove = this._ecs.remove;
}
