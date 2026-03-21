import { computeRollDistribution } from "./rollDistribution.js";
import { computeWaysAboveGoal } from "./valueDistribution.js";
import { StatData } from "../StatData.js";
import { SubStat } from "../data.js";
import { memoize } from "../utils.js";

/**
 * Compute the number of valid roll combinations for a given goal
 */
export const computeValidRolls = (
	statData: StatData, goal: number,
	subStats: SubStat[],
	rollCount: number,
	guaranteed: Set<SubStat> = new Set(),
	guaranteedCount: number = 0
): [number, number, number[]] => {
	// Guaranteed stats first
	subStats = subStats.sort((a, b) => Number(guaranteed.has(b)) - Number(guaranteed.has(a)));

	const dist = computeRollDistribution(subStats.length, rollCount, guaranteed.size, guaranteedCount);

	let totalWays = 0;
	let avgSum = 0;
	let totalRelProbs = 0;
	const totalBuckets: number[] = [];

	for (const [rolls, m] of dist) {
		const [ways, avg, buckets] = computeWaysAboveGoal(statData, subStats, rolls, goal);
		totalWays += m * ways;

		avgSum += m * avg;
		totalRelProbs += m;

		for (let i = 0; i < buckets.length; i++) {
			totalBuckets[i] = (totalBuckets[i] ?? 0) + m * (buckets[i] ?? 0);
		}
	}

	return [totalWays, avgSum / totalRelProbs, totalBuckets];
};

const getTotalOutcomes = memoize((rollCount: number) => (4 ** rollCount) ** 2 * (4 ** 4));

const computeRollCountProb = (
	statData: StatData,
	combos: [SubStat[], number][],
	goal: number,
	rollCount: number,
	guaranteed?: Set<SubStat>,
	guaranteedCount?: number
): [number, number, number[]] => {
	const totalBuckets: number[] = [];

	let num = 0;
	let avgSum = 0;
	let totalWeights = 0;
	const totalOutcomes = getTotalOutcomes(rollCount);

	for (const [combo, weightProb] of combos) {
		const [result, avg, buckets] = computeValidRolls(statData, goal, combo, rollCount, guaranteed, guaranteedCount);

		num += result * weightProb;
		avgSum += avg * weightProb;
		totalWeights += weightProb;

		for (let i = 0; i < buckets.length; i++) {
			totalBuckets[i] = (totalBuckets[i] ?? 0) + weightProb * (buckets[i] ?? 0);
		}
	}

	return [
		num / (totalWeights * totalOutcomes),
		avgSum / totalWeights,
		totalBuckets
	];
}

/**
 * Compute the probability of reaching a goal stat value
 */
export const computeRollProb = (
	statData: StatData,
	combos: [SubStat[], number][],
	goal: number,
	allLinesProb: number,
	guaranteed?: Set<SubStat>,
	guaranteedCount?: number
): [number, number, number[]] => {
	let prob = 0;
	let avg = 0;
	const totalBuckets: number[] = [];

	if (allLinesProb < 1) {
		const [fourProb, fourAvg, fourBuckets] = computeRollCountProb(statData, combos, goal, 4, guaranteed, guaranteedCount);

		prob += fourProb * (1 - allLinesProb);
		avg += fourAvg * (1 - allLinesProb);

		for (let i = 0; i < fourBuckets.length; i++) {
			totalBuckets[i] = (totalBuckets[i] ?? 0) + (1 - allLinesProb) * (fourBuckets[i] ?? 0);
		}
	}

	if (allLinesProb > 0) {
		const [fiveProb, fiveAvg, fiveBuckets] = computeRollCountProb(statData, combos, goal, 5, guaranteed, guaranteedCount);

		prob += fiveProb * allLinesProb;
		avg += fiveAvg * allLinesProb;

		for (let i = 0; i < fiveBuckets.length; i++) {
			// Account for there being 16 5-roll outcomes for every 1 4-roll outcome
			totalBuckets[i] = (totalBuckets[i] ?? 0) + allLinesProb * (1 / 16) * (fiveBuckets[i] ?? 0);
		}
	}

	return [prob, avg, totalBuckets];
};
