import ECS, { DrawPlugin, PluginSchedule } from "ecs";
import type { AppContext } from "../types";
import { MapPlugin } from "$lib/game/map/map";
import { BuildingPlugin } from "$lib/game/buildings/buildings";

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
