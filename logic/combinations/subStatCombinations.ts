import { getWeightedCombinations } from "./weightedCombinations.js";
import { StatData } from "../StatData.js";
import { SubStat } from "../data.js";

/**
 * Get all possible sub-stat combinations for an artifact
 */
export const getSubStatCombinations = (statData: StatData, size: number = 4): [SubStat[], number][] => {
	const combos = getWeightedCombinations(statData, statData.random, size - statData.guaranteed.length);

	for (const combo of combos) {
		combo[0].push(...statData.guaranteed);
	}

	return combos;
}
