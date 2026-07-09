import { memoize } from "../utils/utils.js";
import { StatData } from "../data/StatData.js";
import { toBucket } from "../utils/barChart.js";
import { Statistics } from "./Statistics.js";

const roundKey = (sum: number) => Math.round(sum * 1_000_000_000) / 1_000_000_000;

/**
 * Compute distribution of roll value sums for a given number of rolls
 */
export const computeRollValueDistribution = memoize((count: number, rollValues: readonly number[]) => {
	let statStates = new Map<number, [number, number]>([[0, [0, 1]]]);

	for (let r = 0; r < count; r++) {
		const next = new Map<number, [number, number]>();

		for (const [statSum, ways] of statStates.values()) {
			for (const rollValue of rollValues) {
				const newSum = statSum + rollValue;
				const key = roundKey(newSum);
				next.set(key, [newSum, (next.get(key)?.[1] || 0) + ways]);
			}
		}

		statStates = next;
	}

	return statStates;
});

/**
 * Compute the number of ways to achieve the stat sum goal with the given rolls, accounting for roll values
 */
export const computeWaysAboveGoal = (statData: StatData, subStats: string[], rolls: number[], goal: number): Statistics => {
	let states = new Map<number, [number, number]>([[0, [0, 1]]]);

	// Iteratively move through all roll value combinations stat by stat
	for (let statIndex = 0; statIndex < rolls.length; statIndex++) {
		const stat = subStats[statIndex];
		const count = rolls[statIndex];
		const initial = statData.getInitial(stat);

		let statRollSums = computeRollValueDistribution(count + (initial ? 0 : 1), statData.getRollValues(stat)); // +1 - Account for initial roll

		const next = new Map<number, [number, number]>();

		for (const [sum, ways] of states.values()) {
			for (const [rolledStatSum, statWays] of statRollSums.values()) {
				// Apply each possible stat roll sum to each current path
				const statSum = rolledStatSum + initial;
				let newSum: number;

				if (statSum >= statData.getMin(stat)) {
					const capped = Math.min(statSum, statData.getLimit(stat));
					newSum = sum + capped * statData.getUsefulness(stat);
				} else {
					newSum = -Infinity; // Invalid
				}

				const key = roundKey(newSum);
				next.set(key, [newSum, (next.get(key)?.[1] || 0) + ways * statWays]);
			}
		}

		states = next;
	}

	let num = 0;
	let avgSum = 0;
	let aboveSum = 0;
	let totalWays = 0;
	const buckets: number[] = [];

	for (const [sum, ways] of states.values()) {
		if (goal === -Infinity || sum > goal) {
			num += ways;
			aboveSum += Math.max(0, sum) * ways;
		}

		avgSum += Math.max(0, sum) * ways;
		totalWays += ways;

		const bucket = toBucket(sum, statData.maxWeight);
		buckets[bucket] = (buckets[bucket] ?? 0) + (ways ? 1 : 0);
	}

	return {
		probAbove: num / totalWays,
		avgAbove: num === 0 ? 0 : aboveSum / num,
		allCount: totalWays,
		avg: avgSum / totalWays,
		buckets
	};
};
