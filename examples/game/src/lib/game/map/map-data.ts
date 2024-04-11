import { Component, Signal, type EntityId } from "ecs";
import type { Position } from "../common";

export interface CellData {
  background: string;
  sprite?: string;
  entity?: number;
}

export interface MapCell {
  background: string;
  data?: CellData;
}

export class MapData extends Component {
  private cells: MapCell[][] = [];

  private _maxSize: Position = { x: 0, y: 0 };
  private _offset: Position = { x: 0, y: 0 };
  private _scale: number = 1.0;
  private _tileSize: number = 32;
  private _selectedTile = new Signal<Position | null>();
  private _selectedEntity = this._selectedTile.map((pos) => {
    if (!pos || !this.cells[pos.y] || !this.cells[pos.y][pos.x]) {
      return null;
    }
    return this.cells[pos.y][pos.x]?.data?.entity ?? null;
  });

  get scale(): number {
    return this._scale;
  }

  get offset(): Position {
    return this._offset;
  }

  get maxSize(): Position {
    return this._maxSize;
  }

  get selected(): Position | null {
    return this._selectedTile.value;
  }

  get $selectedId(): Signal<EntityId | null> {
    return this._selectedEntity;
  }

  set settings(settings: { offset: Position, scale: number, maxSize: Position }) {
    this._offset = settings.offset;
    this._scale = settings.scale;
    this._maxSize = settings.maxSize;
  }

  worldToMap(pos: Position): Position {
    return {
      x: Math.floor(pos.x / this._tileSize) + Math.floor(this.offset.x / this._tileSize),
      y: Math.floor(pos.y / this._tileSize) + Math.floor(this.offset.y / this._tileSize),
    }
  }

  set selected(pos: Position | undefined) {
    if (!pos) {
      this._selectedTile.value = null;
      return;
    }
    this._selectedTile.value = this.worldToMap(pos);
  }

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

  get(pos: Position): MapCell | undefined {
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.width || pos.y >= this.height) {
      return undefined;
    }
    return this.cells[pos.y][pos.x];
  }
}

