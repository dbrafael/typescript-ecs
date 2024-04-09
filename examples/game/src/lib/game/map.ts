import ECSBuilder, { Component, Drawable, ECSPlugin, Entity, Resource } from "ecs";
import type { Position } from "./common";

class RenderMap extends Drawable {
  layer = 1;
  draw(ent: Entity<[MapData]>, ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const map = ent.get(MapData);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.get({ x, y });
        const bg = cell.data?.background || cell.background;
        ctx.fillStyle = bg;
        ctx.fillRect(x * 16, y * 16, 16, 16);
        if (cell.data?.sprite) {
          const img = new Image();
          img.src = cell.data.sprite;
          ctx.drawImage(img, x * 16, y * 16, 16, 16);
        }
      }
    }
  }
}

export interface CellData {
  background: string;
  sprite?: string;
}

export interface MapCell {
  background: string;
  data?: CellData;
}

export class MapData extends Component {
  private cells: MapCell[][] = [];

  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    super();
    this.cells = [];
    for (let y = 0; y < height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < width; x++) {
        this.cells[y][x] = { background: "gray" };
      }
    }
  }

  set(pos: Position, cell: MapCell) {
    this.cells[pos.y][pos.x] = cell;
  }

  get(pos: Position): MapCell {
    return this.cells[pos.y][pos.x];
  }
}

export class GameMap extends Resource {
  private _active: MapData;
  private _removeActive: () => void = () => {};

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
  
  get(pos: Position): MapCell {
    return this._active.get(pos);
  }

  set(pos: Position, cell: MapCell) {
    this._active.set(pos, cell);
  }

  build(pos: Position, data: CellData) {
    this.get(pos).data = data;
  }

  clear(pos: Position) {
    this.get(pos).data = undefined;
  }
}

export class MapPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    const mapData = ecs.add.entity([new MapData(16, 16)]);
    ecs.add.resource(new GameMap(mapData));
  }
}
