<script lang="ts">
	import { onMount } from 'svelte';
	import type { ItemName, LocationName, PlayerID, PlayerStorage, Rule } from './+page.js';

	let { data } = $props();

	onMount(() => {
		const location = data.rules['1'].items['Skywarden-MiddlePath'].locations[0];
		console.log(`location: ${location.name}, player: ${location.player}`);
		console.log(JSON.stringify(data.rules[location.player].locations[location.name]));

		console.log(dependency_walk(data.rules, 'Skywarden-MiddlePath', '1'));
		console.log(dependency_walk(data.rules, 'TinyTornadoes-KUnlock', '1'));
	});

	// function rule_walk(
	// 	player_data: Record<PlayerID, PlayerStorage>,
	//     rule: Rule,
	//     player_id: PlayerID
	// ): string {
	//     if (rule.rule === 'True_') {
	//         return
	//     }
	//     return "ERROR";
	// }

	function dependency_walk(
		player_data: Record<PlayerID, PlayerStorage>,
		item_name: ItemName,
		player_id: PlayerID
	): string {
		// todo: handle more locations
		const location_info = player_data[player_id].items[item_name].locations[0];

		const location = player_data[location_info.player].locations[location_info.name];
		console.log(`TESTING ${location.rule}`);

		const rules = [location];
		let outputs = `${location_info.name}[${location_info.player}] = ${item_name}[${player_id}]`;
		while (rules.length > 0) {
			const rule = rules.pop()!;
			if (rule.rule === 'Has') {
				const new_item = location.args!['item_name'] as string;
				const deps = dependency_walk(player_data, new_item, location_info.player);
				outputs = `${deps} -> ${outputs}`;
			} else if (rule.rule === 'And') {
				const children_rules = location.children!;
				rules.push(...children_rules);
				return;
			} else if (location.rule === 'True_') {
				return `${item_name} (${player_id}): ${location_info.name} (${location_info.player})`;
			}
		}

		return `ERROR: ${location_info.name} = ${location.rule}`;
	}
</script>
