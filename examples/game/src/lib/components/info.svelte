<script lang="ts">
    import { GameMap } from "$lib/game/map/map";
  import type ECSBuilder from "ecs";
  import { type Signal, type EntityId, SystemSchedule, Entity } from "ecs";
    import { onMount } from "svelte";

  export let ecs: ECSBuilder;

  let entity: Entity<any> | undefined;
  let clear: Function;

  onMount(() => {
    const afterStart = ecs.when(SystemSchedule.Startup);
    afterStart.subscribe(() => {
      if (clear) clear();
      const selected = ecs.get.resource(GameMap).$selected;
      const sub = (id: EntityId | null) => {
        if (!id){ 
          entity = undefined;
        } else {
          entity = ecs.get.entity(id)
        };
      };
      selected.subscribe(sub);
      clear = () => { selected.unsubscribe(sub); };
    });
  });
</script>

<div class="info">
  {#if entity}
    <h1>{entity.id}</h1>
    <pre>Components: <br>
    {[...entity._entity._components.entries()].map(([ctype, obj]) => {
      return `${ctype} > ${JSON.stringify(obj)}`;
    }).join('\n')}</pre>
  {/if}
</div>

<style>
  .info {
    overflow-x: scroll;
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 10px;
  }
</style>
