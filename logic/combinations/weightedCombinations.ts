import { memoize } from "../utils/utils.js";

const permuteProb = memoize((remainingWeights: number[], totalWeight: number): number => {
	if (remainingWeights.length === 0) {
		return 1;
	}

	let p = 0;

	for (let i = 0; i < remainingWeights.length; i++) {
		const w = remainingWeights[i];
		const nextRemainingWeights = [
			...remainingWeights.slice(0, i),
			...remainingWeights.slice(i + 1)
		];

		p += (w / totalWeight) * permuteProb(nextRemainingWeights, totalWeight - w);
	}

	return p;
});

export interface RollWeightHolder<T> {
	getRollWeight(stat: T): number;
}

/**
 * Calculate the combined probability of all permutations for the given combination
 */
const getSetProbability = <T>(rollWeights: RollWeightHolder<T>, combination: T[], totalRollWeight: number): number => {
	const weights = combination.map((stat) => rollWeights.getRollWeight(stat));
	return permuteProb(weights, totalRollWeight);
}

/**
 * Get all weighted combinations of stats with their probability weights
 */
export const getWeightedCombinations = <T>(rollWeights: RollWeightHolder<T>, stats: T[], k: number): [T[], number][] => {
	const totalRollWeight = stats.reduce((sum, stat) => sum + rollWeights.getRollWeight(stat), 0);
	const result: [T[], number][] = [];

	function recurse(currStats: T[], remainingStats: T[]): void {
		if (currStats.length === k) {
			const weightProb = getSetProbability(rollWeights, currStats, totalRollWeight);

			result.push([currStats, weightProb]);
			return;
		}

		for (let i = 0; i < remainingStats.length; i++) {
			const stat = remainingStats[i];

			recurse(
				[...currStats, stat],
				remainingStats.slice(i + 1)
			);
		}
	}

	recurse([], stats);
	return result;
};
