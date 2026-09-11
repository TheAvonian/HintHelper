<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	onMount(() => {
		const location = data.rules['1'].items['Skywarden-MiddlePath'].locations[0];
		console.log(`location: ${location.name}, player: ${location.player}`);
		console.log(JSON.stringify(data.rules[location.player].locations[location.name]));
	});
</script>
