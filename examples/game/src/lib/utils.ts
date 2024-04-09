export type Point = [number, number];
export type Line = { from: Point, to: Point };

export function expandLine(line: Line): Point[] {
  const result = [];
  if (!(line.from[0] === line.to[0] || line.from[1] === line.to[1])) {
    throw new Error('Invalid line');
  }

  const xfrom = Math.min(line.from[0], line.to[0]);
  const xto = Math.max(line.from[0], line.to[0]);
  const yfrom = Math.min(line.from[1], line.to[1]);
  const yto = Math.max(line.from[1], line.to[1]);

  for (let x = xfrom; x <= xto; x++) {
    for (let y = yfrom; y <= yto; y++) {
      const point = [x, y] as Point;
      result.push(point);
    }
  }

  return result;
}

export function *enumerate<T>(arr: T[]) {
  let i = 0;
  for (const e of arr) {
    yield [e, i++] as [T, number];
  }
}

export function perpendicularPoints(point: Point, direction: Direction, distance: number): Point[] {
  const result = [];
  const [dx, dy] = dir2Movement(direction);
  if (dy === 0) {
    for (let x = -distance; x <= distance; x++) {
      const y = point[1] + x;
      result.push([point[0], y] as Point);
    }
  } else if (dx === 0) {
    for (let y = -distance; y <= distance; y++) {
      const x = point[0] + y;
      result.push([x, point[1]] as Point);
    }
  }
  return result;
}

export function pointEq(p1: Point, p2: Point): boolean {
  return p1[0] === p2[0] && p1[1] === p2[1];
}

export function pointSum(p1: Point, p2: Point): Point {
  return [p1[0] + p2[0], p1[1] + p2[1]];
}

export function pointSub(p1: Point, p2: Point): Point {
  return [p1[0] - p2[0], p1[1] - p2[1]];
}

export function pointNormalize(p: Point, scale: number = 1): Point {
  const mag = Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
  return [
    p[0] / mag * scale,
    p[1] / mag * scale
  ];
}

export function pointDist(p1: Point, p2: Point): number {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
}

export function index(x: number, y: number, width: number): number {
  return y * width + x;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export enum Direction { 
  Up,
  Down,
  Left,
  Right,
}

export function movement2Dir(p1: Point, p2: Point): Direction {
  const [x, y] = [
   p2[0] - p1[0],
   p2[1] - p1[1]
  ];
  if (y < 0) return Direction.Up;
  if (y > 0) return Direction.Down;
  if (x < 0) return Direction.Left;
  if (x > 0) return Direction.Right;
  throw new Error('unreachable code');
}

export function dir2Movement(dir: Direction): Point {
  switch (dir) {
    case Direction.Up: return [0, -1];
    case Direction.Down: return [0, 1];
    case Direction.Left: return [-1, 0];
    case Direction.Right: return [1, 0];
  }
}

export function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
