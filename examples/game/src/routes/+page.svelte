<script lang="ts">
  import { page } from '$app/stores';
	import Canvas from '$lib/components/canvas.svelte';
    import Info from '$lib/components/info.svelte';
	import ECS from 'ecs';
  
	import { onDestroy } from 'svelte';

  $: ecs = $page.data.ecs as ECS;


  onDestroy(() => {
    ecs.stop();
  });

</script>

<Canvas {ecs} />
<Info {ecs} />
<button on:click={() => ecs.run(30)}>Start</button>
