type MainStat = { typeGroup: number; stats: Record<string, number> };

/**
 * Compute the probability of getting a specific main stat
 */
export const computeMainStatProb = (
	mainStats: MainStat[],
	artifactType: number,
	mainStat: string
): number => {
	return mainStats[artifactType].stats[mainStat] ?? 0;
};
