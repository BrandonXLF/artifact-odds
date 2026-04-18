import { memoize } from "../utils/math.js";
import { StatData } from "../StatData.js";
import { toBucket } from "../utils/barChart.js";

/**
 * Compute distribution of roll value sums for a given number of rolls (0 to 5)
 */
export const computeRollValueDistribution = memoize((count: number, rollValues: readonly number[]): Map<number, number> => {
	let statStates = new Map<number, number>([[0, 1]]);

	for (let r = 0; r < count; r++) {
		const next = new Map<number, number>();

		for (const [statSum, ways] of statStates) {
			for (const rollValue of rollValues) {
				const ns = statSum + rollValue;
				next.set(ns, (next.get(ns) || 0) + ways);
			}
		}

		statStates = next;
	}

	return statStates;
});

/**
 * Compute the number of ways to achieve the stat sum goal with the given rolls, accounting for roll values
 */
export const computeWaysAboveGoal = (statData: StatData, subStats: string[], rolls: number[], goal: number): [number, number, number[]] => {
	let states = new Map<number, number>([[0, 1]]);

	// Iteratively move through all roll value combinations stat by stat
	for (let statIndex = 0; statIndex < rolls.length; statIndex++) {
		const stat = subStats[statIndex];
		const count = rolls[statIndex];

		let statRollSums = computeRollValueDistribution(count + 1, statData.rollValues); // +1 - Account for initial roll

		const next = new Map<number, number>();

		for (const [sum, ways] of states) {
			for (const [statSum, statWays] of statRollSums) {
				// Apply each possible stat roll sum to each current path
				let newSum: number;

				if (statSum >= statData.getMin(stat)) {
					const capped = Math.min(statSum, statData.getLimit(stat));
					newSum = sum + capped * statData.getUsefulness(stat);
				} else {
					newSum = -Infinity; // Invalid
				}

				next.set(newSum, (next.get(newSum) || 0) + ways * statWays);
			}
		}

		states = next;
	}

	let num = 0;
	let avgSum = 0;
	let totalWays = 0;
	const buckets: number[] = [];

	for (const [sum, ways] of states) {
		if (goal === -Infinity || sum > goal) num += ways;

		avgSum += Math.max(0, sum) * ways;
		totalWays += ways;

		const bucket = toBucket(sum, statData.maxWeight);
		buckets[bucket] = (buckets[bucket] ?? 0) + ways;
	}

	return [num, avgSum / totalWays, buckets];
};
