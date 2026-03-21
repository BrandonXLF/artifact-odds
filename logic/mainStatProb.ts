import { AnyStat, mainStats } from "./data.js";

/**
 * Compute the probability of getting a specific main stat
 */
export const computeMainStatProb = (artifactType: number, mainStat: AnyStat, fromDomain: boolean = true): number => {
	let prob = 0.2;

	if (fromDomain) {
		prob *= 0.5;
	}
	
	prob *= mainStats[artifactType].stats[mainStat] || 0;

	return prob;
};
