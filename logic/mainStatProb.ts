type MainStat = { typeGroup: number; stats: Record<string, number> };

/**
 * Compute the probability of getting a specific main stat
 */
export const computeMainStatProb = (
	mainStats: MainStat[],
	artifactType: number,
	mainStat: string,
	fromDomain: boolean = true
): number => {
	const typeData = mainStats[artifactType];
	
	const numberInGroup = mainStats.filter(({ typeGroup }) => typeGroup === typeData.typeGroup).length
	let prob = 1 / numberInGroup;

	if (fromDomain) {
		prob *= 0.5;
	}
	
	prob *= mainStats[artifactType].stats[mainStat] ?? 0;

	return prob;
};
