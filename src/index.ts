import ECS from './ecs/builder/builder';
import Query from './ecs/query/builder';
import Component, { Filter } from './ecs/store/component';
import Resource from './ecs/store/resource';
import System, { SystemSchedule } from './ecs/store/system';
import { Drawable, DrawPlugin } from './ecs/rendering/drawable';
import Canvas from './ecs/rendering/canvas';
import ECSPlugin, { PluginSchedule } from './ecs/builder/plugin';
import Entity from './ecs/store/entity';

export default ECS;

export {
  Entity,
  Component,
  Resource,
  Query,
  System,
  SystemSchedule,
  ECSPlugin,
  PluginSchedule,
  Drawable,
  DrawPlugin,
  Canvas,
  Filter
}
