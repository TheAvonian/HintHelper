import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export type PlayerID = string;

export type Rule = {
	rule: string; // define more
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	args?: Record<string, any>;
	children?: Array<Rule>;
	child?: Rule;
};

export type PlayerStorage = {
	locations: Record<LocationName, Rule>;
	regions: Record<RegionName, Rule>;
	items: Record<ItemName, ItemData>;
};
export type LocationName = string;
export type RegionName = string;
export type ItemName = string;
export type ItemData = { locations: Array<{ name: LocationName; player: PlayerID }> };

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch(`/api`);
	const rules = (await res.json()) as Record<PlayerID, PlayerStorage>;

	if (res.status === 404) {
		return error(404, 'No file found');
	}

	return { rules };
};
