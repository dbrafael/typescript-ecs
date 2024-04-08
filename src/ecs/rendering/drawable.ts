import Component from "../store/component";
import Query from "../query/builder";
import Canvas from "../rendering/canvas";
import type ECSBuilder from "../builder/builder";
import ECSPlugin from "../builder/plugin";
import { SystemSchedule } from "../store/system";
import { Bundle, EntityWrapper } from "../store/entity";

export abstract class Drawable extends Component {
  layer: number = 0;
  abstract draw<T extends Bundle>(ent: EntityWrapper<T>, ctx: CanvasRenderingContext2D, width: number, height: number): void;
}

const QueryDrawables = Query.bundle(Drawable).resources(Canvas);

export class DrawPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    ecs.create.system(SystemSchedule.Update, QueryDrawables, ([drawables], resources) => {
      const canvas = resources.get(Canvas);
      canvas.clear();
      drawables.forEach((d) => {
        const drawable = d.get(Drawable)!;
        const ctx = canvas.contexts[drawable.layer];
        drawable.draw(d, ctx, canvas.layers[drawable.layer].width, canvas.layers[drawable.layer].height);
      });
    });
  }
}

