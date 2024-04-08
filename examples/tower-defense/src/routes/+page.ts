import { EnemyPlugin } from "$lib/game/enemy";
import ECS, { DrawPlugin, PluginSchedule } from "ecs";
import type { AppContext } from "../types";

export const ssr = false;

export function load() {
  const ecs = new ECS();

  ecs.plugin(PluginSchedule.Prepare, new DrawPlugin());
  ecs.plugin(PluginSchedule.Startup, new EnemyPlugin());

  return {
    ecs,
  } as AppContext;
}
