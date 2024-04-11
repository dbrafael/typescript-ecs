<script lang="ts">
	import { onMount } from "svelte";
	import ECSBuilder, { Canvas, SystemSchedule } from "ecs";
    import { GameMap } from "$lib/game/map/map";

  export let ecs: ECSBuilder;

  let container: HTMLButtonElement;

  let layer1: HTMLCanvasElement;
  let layer2: HTMLCanvasElement;
  let layer3: HTMLCanvasElement;
  let layer4: HTMLCanvasElement;
  let layer5: HTMLCanvasElement;

  let bounds: DOMRect;

  $: afterStart = ecs.when(SystemSchedule.Startup);
  $: map = $afterStart?.get.resource(GameMap);

  $: {
    if (bounds) {
      layer1.width = bounds?.width;
      layer1.height = bounds?.height;
      layer2.width = bounds?.width;
      layer2.height = bounds?.height;
      layer3.width = bounds?.width;
      layer3.height = bounds?.height;
      layer4.width = bounds?.width;
      layer4.height = bounds?.height;
      layer5.width = bounds?.width;
      layer5.height = bounds?.height;
    }
  }

  $: {
    if (map) {
      map.area = bounds;
    }
  }

  let size = [100, 100];

  const onResize = () => {
    bounds = container?.getBoundingClientRect();
  };

  onMount(() => {
    onResize();
    ecs.add.resource(new Canvas([layer1, layer2, layer3, layer4, layer5]));
  });

  let mouseDown = false;
  let dragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  const onMouseMove = (event: MouseEvent) => {
    if (!map) return;
    if (mouseDown) dragging = true;
    else return;

    const dp = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    };
    map.drag(dp);
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
  };

  const onMouseDown = (event: MouseEvent) => {
    mouseDown = true;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    window.addEventListener("mousemove", onMouseMove);
  };

  const onMouseUp = () => {
    mouseDown = false;
    if (dragging) {
      dragging = false;
    } else {
      map.click({
        x: previousMousePosition.x - bounds.left,
        y: previousMousePosition.y - bounds.top,
      });
    }
  };
</script>

<svelte:window on:resize={onResize} />

<button bind:this={container} class="container" on:mousedown={onMouseDown} on:mouseup={onMouseUp}>
  <canvas bind:this={layer1} width={size[0]} height={size[1]} />
  <canvas bind:this={layer2} width={size[0]} height={size[1]} />
  <canvas bind:this={layer3} width={size[0]} height={size[1]} />
  <canvas bind:this={layer4} width={size[0]} height={size[1]} />
  <canvas bind:this={layer5} width={size[0]} height={size[1]} />
</button>

<style>
  .container {
    --bg-color: white;
    background-color: var(--bg-color);
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(100% - 2em);
    height: 100%;
    position: relative;
    border: 1px solid black;
    border-radius: 0px;
    margin: 1em;
  }

  .container:active,
  .container:focus {
    background-color: var(--bg-color);
  }

  .container:active {
    cursor: grabbing;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>

  
