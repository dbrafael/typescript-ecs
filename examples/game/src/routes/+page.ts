import ECS, { DrawPlugin, PluginSchedule } from "ecs";
import type { AppContext } from "../types";
import { BuildingPlugin } from "$lib/game/buildings";
import { MapPlugin } from "$lib/game/map";

export const ssr = false;

export function load() {
  const ecs = new ECS();

  ecs.plugin(PluginSchedule.Prepare, new DrawPlugin());
  ecs.plugin(PluginSchedule.Prepare, new MapPlugin());
  ecs.plugin(PluginSchedule.Startup, new BuildingPlugin());

  return {
    ecs,
  } as AppContext;
}
