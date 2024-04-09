import { EnemyPlugin } from "$lib/game/enemy";
import ECS, { DrawPlugin, PluginSchedule } from "ecs";
import type { AppContext } from "../types";
import { BuildingPlugin } from "$lib/game/buildings";

export const ssr = false;

export function load() {
  const ecs = new ECS();

  ecs.plugin(PluginSchedule.Prepare, new DrawPlugin());
  ecs.plugin(PluginSchedule.Startup, new BuildingPlugin());

  return {
    ecs,
  } as AppContext;
}
