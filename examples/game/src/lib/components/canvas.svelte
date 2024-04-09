<script lang="ts">
	import { onMount } from "svelte";
	import ECSBuilder, { Canvas } from "ecs";

  export let ecs: ECSBuilder;

  let container: HTMLDivElement;

  let layer1: HTMLCanvasElement;
  let layer2: HTMLCanvasElement;
  let layer3: HTMLCanvasElement;
  let layer4: HTMLCanvasElement;
  let layer5: HTMLCanvasElement;

  let size = [100, 100];

  const onResize = () => {
    size = [container.clientWidth, container.clientHeight];
  };

  onMount(() => {
    onResize();
    ecs.add.resource(new Canvas([layer1, layer2, layer3, layer4, layer5]));
  });
</script>

<svelte:window on:resize={onResize} />

<div bind:this={container} class="container">
  <canvas bind:this={layer1} width={size[0]} height={size[1]} />
  <canvas bind:this={layer2} width={size[0]} height={size[1]} />
  <canvas bind:this={layer3} width={size[0]} height={size[1]} />
  <canvas bind:this={layer4} width={size[0]} height={size[1]} />
  <canvas bind:this={layer5} width={size[0]} height={size[1]} />
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>

  
