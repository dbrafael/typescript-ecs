import { Drawable, type Entity } from "ecs";
import { MapData } from "./map-data";

export class RenderMap extends Drawable {
  layer = 1;
  draw(ent: Entity<[MapData]>, ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const map = ent.get(MapData);

    const offset = map.offset;
    const scale = map.scale;
    const size = map.maxSize;
    const selected = map.selected;

    const tileSize = 32 * scale;

    const firstCell = {
      x: Math.floor(offset.x / tileSize),
      y: Math.floor(offset.y / tileSize),
    };

    const lastCell = {
      x: firstCell.x + size.x + 1,
      y: firstCell.y + size.y + 1,
    }

    for (let y = 0; y < lastCell.y - firstCell.y; y++) {
      for (let x = 0; x < lastCell.x - firstCell.x; x++) {
        const realId = { x: x + firstCell.x, y: y + firstCell.y };
        const cell = map.get(realId) ?? { background: "black" };
        let bg = cell.data?.background || cell.background;
        if (selected && selected.x === realId.x && selected.y === realId.y) {
          bg = "red";
        }
        ctx.fillStyle = bg;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        if (cell.data?.sprite) {
          const img = new Image();
          img.src = cell.data.sprite;
          ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
  }
}

