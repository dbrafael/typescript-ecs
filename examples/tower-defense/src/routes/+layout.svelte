<script>
  import Header from "$lib/components/common/header.svelte";
	import Footer from "$lib/components/common/footer.svelte";
</script>

<Header />
<main>
  <slot/>
</main>
<Footer />

<style>
  main {
    margin-top: 60px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  :global(header) {
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
