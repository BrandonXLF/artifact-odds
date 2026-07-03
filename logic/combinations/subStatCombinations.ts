import { getWeightedCombinations } from "./weightedCombinations.js";
import { StatData } from "../data/StatData.js";

/**
 * Get all possible sub-stat combinations for an artifact, ignoring requirements
 */
export const getSubStatCombinations = (statData: StatData, size: number): [string[], number][] => {
	const combos = getWeightedCombinations(statData, statData.random, size - statData.guaranteed.length);

	for (const combo of combos) {
		combo[0].push(...statData.guaranteed);
	}

	return combos;
}
