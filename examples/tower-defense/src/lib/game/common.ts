import { Component, Drawable, Entity } from "ecs";

export class Health extends Component {
  constructor(
    public value: number = 100
  ) {
    super();
  }
}

export class Position extends Component {
  constructor(
    public x: number,
    public y: number
  ) {
    super();
  }
}

export class Circle extends Drawable {
  constructor(
    public radius: number,
    public color: string
  ) {
    super();
  }

  draw(ent: Entity, ctx: CanvasRenderingContext2D) {
    const pos = ent.get(Position);
    if (!pos) { 
      console.error("No position component found on entity", ent);
      return;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}
