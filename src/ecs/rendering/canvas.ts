import Resource from "../store/resource";

export default class Canvas extends Resource {
  public readonly contexts: CanvasRenderingContext2D[] = [];
  constructor(
    public readonly layers: HTMLCanvasElement[],
  ) {
    super();
    this.contexts = layers.map((layer) => layer.getContext('2d')!);
  }

  clear() {
    this.contexts.forEach((ctx) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });
  }
}
