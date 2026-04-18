/**
 * Compute the probability of getting a specific main stat
 */
export const computeMainStatProb = (
	gettableTypes: number,
	mainStats: { stats: Record<string, number> }[],
	artifactType: number,
	mainStat: string,
	fromDomain: boolean = true
): number => {
	let prob = 1 / gettableTypes;

	if (fromDomain) {
		prob *= 0.5;
	}
	
	prob *= mainStats[artifactType].stats[mainStat] || 0;

	return prob;
};
