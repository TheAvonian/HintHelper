<script lang="ts">
	import { onMount } from 'svelte';
	import { Client, Item } from 'archipelago.js';
	import type { ItemName, LocationName, PlayerID, PlayerStorage, Rule } from './+page.js';

	let { data } = $props();

	// const checked: Record<PlayerID, number[]> = {};
	// const mappings_locations: Record<PlayerID, Record<string, number>> = {};
	// const mappings_items: Record<PlayerID, Record<string, number>> = {};
	const itemsReceived: Record<PlayerID, string[]> = {};

	onMount(() => {
		const location = data.rules['1'].items['Skywarden-MiddlePath'].locations[0];
		console.log(`location: ${location.name}, player: ${location.player}`);
		console.log(JSON.stringify(data.rules[location.player].locations[location.name]));

		const cache = localStorage.getItem('datapackage_cache');
		const avenclient = new Client();
		if (cache) {
			avenclient.package.importPackage(JSON.parse(cache));
		}
		avenclient.login('wss://archipelago.gg:45911', 'Aven').then(() => {
			// for (const checked of avenclient.room.checkedLocations) {
			//     const mapping = avenclient.package.
			// }
			// checked.push(...avenclient.room.checkedLocations);
			if (!cache) {
				const d = avenclient.package.exportPackage();
				localStorage.setItem('datapackage_cache', JSON.stringify(d));
			}
			itemsReceived[avenclient.players.self.slot] = avenclient.items.received.map((x) => x.name);

			const justinclient = new Client();
			justinclient.login('wss://archipelago.gg:45911', 'Justin').then(() => {
				// for (const checked of justinclient.room.checkedLocations) {
				//     const mapping = justinclient.package.
				// }
				// checked.push(...justinclient.room.checkedLocations);
				itemsReceived[justinclient.players.self.slot] = justinclient.items.received.map(
					(x) => x.name
				);
				console.log(dependency_walk(data.rules, 'WizardMonkey-TopPath', '2', {}));

				justinclient.socket.disconnect();
				avenclient.socket.disconnect();
			});
		});
	});

	function format(ind: number, str: string): string {
		return '  '.repeat(ind) + `└ ${str}\n`;
	}

	function rule_walk(
		player_data: Record<PlayerID, PlayerStorage>,
		location_name: LocationName,
		rule: Rule,
		player_id: PlayerID,
		recursive_checker: Record<string, boolean>,
		indent = 0
	): [string, boolean] {
		let end = '';
		// console.log(`BIG DBG / rule: ${rule.rule}, location: ${location_name}, player: ${player_id}`);

		const antirecurse = `${location_name}[${player_id}] - ${JSON.stringify(rule)}`;
		if (recursive_checker[antirecurse] !== undefined) {
			return [format(indent + 1, '... MEMO'), recursive_checker[antirecurse]];
		}

		if (rule.rule === 'True_') {
			end += format(indent + 1, `True`);
			recursive_checker[antirecurse] = false;
			return [end, false];
		} else if (rule.rule === 'Has') {
			const needed_item = rule.args!['item_name'] as string;
			// if (itemsReceived[player_id].includes(needed_item)) {
			// 	recursive_checker[antirecurse] = true;
			// 	return [end, true];
			// }
			const item_req = dependency_walk(
				player_data,
				needed_item,
				player_id,
				recursive_checker,
				indent + 2
			);
			end += format(indent + 1, `Has`);
			end += item_req;
			recursive_checker[antirecurse] = false;
			return [end, false];
		} else if (rule.rule === 'And' || rule.rule === 'Or') {
			const rules = rule.children!.map((x) =>
				rule_walk(player_data, location_name, x, player_id, recursive_checker, indent + 1)
			);
			// if (
			// 	(rule.rule === 'And' && rules.every((x) => x[1])) ||
			// 	(rule.rule === 'Or' && rules.some((x) => x[1]))
			// ) {
			// 	recursive_checker[antirecurse] = true;
			// 	return ['', true];
			// }
			end += format(indent + 1, rule.rule);
			for (const child of rules!) {
				end += child[0];
			}
			recursive_checker[antirecurse] = false;
			return [end, false];
		} else if (rule.rule === 'HasFromList' || rule.rule === 'HasFromListUnique') {
			const valid =
				rule.args!['item_names'].filter((x) => itemsReceived[player_id].includes(x)).length >=
				rule.args!['count'];
			if (valid) {
				recursive_checker[antirecurse] = true;
				return ['', true];
			}
			end += format(indent + 1, `HasFromList >= ${rule.args!['count']}`);
			for (const child of rule.args!['item_names']) {
				end += dependency_walk(player_data, child, player_id, recursive_checker, indent + 2);
			}
			recursive_checker[antirecurse] = false;
			return [end, false];
		} else if (rule.rule === 'HasAll') {
			const valid = rule.args!['item_names'].every((x) => itemsReceived[player_id].includes(x));
			if (valid) {
				recursive_checker[antirecurse] = true;
				return ['', true];
			}
			end += format(indent + 1, `HasAll`);
			for (const child of rule.args!['item_names']) {
				end += dependency_walk(player_data, child, player_id, recursive_checker, indent + 2);
			}
			recursive_checker[antirecurse] = false;
			return ['', false];
		}

		return [format(indent + 1, 'ERR ' + rule.rule), false];
	}
	/**
	 * Has(And)
	 */

	function dependency_walk(
		player_data: Record<PlayerID, PlayerStorage>,
		item_name: ItemName,
		player_id: PlayerID,
		recursive_checker: Record<string, boolean>,
		indent = 0
	): string {
		// player likely picked this up from the start and the item got culled
		if (!player_data[player_id].items[item_name]) {
			return format(indent, `${item_name}[${player_id}]`);
		}
		// todo: handle more locations
		const location_info = player_data[player_id].items[item_name].locations[0];

		const location = player_data[location_info.player].locations[location_info.name];

		let end = format(indent, `${location_info.name}[${location_info.player}]`);
		end += rule_walk(
			player_data,
			location_info.name,
			location,
			location_info.player,
			recursive_checker,
			indent
		)[0];

		return end;
	}
</script>
