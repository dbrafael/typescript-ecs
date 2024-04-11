import ECSBuilder, { ECSPlugin, Entity, Resource } from "ecs";
import { MapData, type CellData, type MapCell } from "./map-data";
import { RenderMap } from "./render";
import type { Position } from "../common";

export class GameMap extends Resource {
  private _active: MapData;
  private _removeActive: () => void = () => {};
  private _canvasArea: DOMRect = new DOMRect(0, 0, 0, 0);
  private _offset: Position = { x: 0, y: 0 };

  private settings = {
    tileSize: 32,
    scale: 1.0,
  }

  get maxMapSize(): Position {
    return {
      x: (this._canvasArea.width / this.settings.tileSize) | 0,
      y: (this._canvasArea.height / this.settings.tileSize) | 0,
    }
  }

  get $selected() {
    return this.map.$selectedId;
  }

  set area(bounds: DOMRect) {
    this._canvasArea = bounds;
    this.map.settings = {
      offset: this._offset,
      maxSize: this.maxMapSize,
      ...this.settings,
    };
  }

  constructor(map: Entity<[MapData]>) {
    super();
    [this._active, this._removeActive] = this.newActive(map);
  }

  private newActive(map: Entity<[MapData]>): [MapData, () => void] {
    const render = new RenderMap();
    map.add(render);
    this._removeActive();
    
    return [map.get(MapData), this._removeActive = () => { map.remove.bind(map, render); } ];
  }

  set active(map: Entity<[MapData]>) {
    [this._active, this._removeActive] = this.newActive(map);
  }

  get map(): MapData {
    return this._active;
  }

  get selected(): Position | null {
    return this.map.selected;
  }
  
  get(pos: Position): MapCell | null {
    const g = this._active.get(pos);
    if (!g) return null;
    return g;
  }

  set(pos: Position, cell: MapCell) {
    this._active.set(pos, cell);
  }

  build(pos: Position, data: CellData) {
    const it = this.get(pos);
    if (!it) return;
    it.data = data;
  }

  clear(pos: Position) {
    const it = this.get(pos);
    if (!it) return;
    it.data = undefined;
  }

  click(pos: Position) {
    this.map.selected = pos;
  }

  drag(deltaP: Position) {
    this._offset.x -= deltaP.x;
    this._offset.y -= deltaP.y;
  }
}

export class MapPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    const mapData = ecs.add.entity([new MapData(16, 16)]);
    ecs.add.resource(new GameMap(mapData));
  }
}
