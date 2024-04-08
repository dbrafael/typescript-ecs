import ECSBuilder, { Component, ECSPlugin, Filter, Query, Resource, System, SystemSchedule } from "ecs";
import { Circle, Health, Position } from "./common";

class Hello extends Resource {
  message = "Hello World";
}

// TOFIX: Resources with the same fields are counted as the same by the type system
class Goodbye extends Resource {
  message2 = "Goodbye World";
}

class EnemyTag extends Component {
}

interface EnemyProps {
  startHealth: number;
  color: string;
  x: number;
  y: number;
}

type Enemy = [EnemyTag, Health, Position, Circle];

function randomColor() {
  return `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
}

function newEnemy(ecs: ECSBuilder, x: number, y: number, health: number = 100) {
  const props: EnemyProps = {
    startHealth: health,
    color: randomColor(),
    x,
    y
  };

  ecs.add.entity<Enemy>([
    new EnemyTag(),
    new Health(props.startHealth),
    new Position(props.x, props.y),
    new Circle(10, props.color)
  ]);
}

const Enemies = Query.bundle(
  EnemyTag,
  Filter(Health, (health) => health.value > 0),
).bundle(
  EnemyTag,
  Filter(Health, (health) => health.value <= 0),
).resources(
  Hello,
  Goodbye
);
  
const EnemyUpdateSystem = System.new(
  Enemies,
  ([alive, dead], resources) => {
    const message2 = resources.get(Goodbye).message2;

    for (const ent of alive) {
      const health = ent.get(Health);
      health.value -= 1;
      console.log("Enemy health", ent, health.value);
    }

    for (const ent of dead) {
      console.log("Enemy died", ent, message2);
      ent.delete();
    }

    if (alive.length === 0 && dead.length === 0) {
      stop();
    }
  }
);

const SpawnEnemies = System.new(
  Query.Empty,
  (_, _R, controls) => {
    for (let i = 0; i < 10; i++) {
      newEnemy(controls, Math.random() * 800, Math.random() * 600, Math.random() * 100 + 200);
    }
  }
);

export class EnemyPlugin extends ECSPlugin {
  build(ecs: ECSBuilder): void {
    ecs.add.resource(new Hello());
    ecs.add.resource(new Goodbye());

    ecs.add.system(SystemSchedule.Startup, SpawnEnemies);
    ecs.add.system(SystemSchedule.FixedUpdate, EnemyUpdateSystem);
  }
}
