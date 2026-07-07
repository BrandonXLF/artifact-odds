type MainStat = { typeGroup: number; stats: Record<string, number> };

/**
 * Compute the probability of getting a specific artifact type
 */
export const computeTypeProb = (
	mainStats: MainStat[],
	artifactType: number,
	fromDomain: boolean = true
): number => {
	const typeData = mainStats[artifactType];
	
	const numberInGroup = mainStats.filter(({ typeGroup }) => typeGroup === typeData.typeGroup).length
	let prob = 1 / numberInGroup;

	if (fromDomain) {
		prob *= 0.5;
	}

	return prob;
};
