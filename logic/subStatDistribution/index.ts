import { computeRollDistribution } from "./rollDistribution.js";
import { computeWaysAboveGoal } from "./valueDistribution.js";
import { StatData } from "../StatData.js";
import { memoize } from "../utils/math.js";
import RollRestrictions from "../RollRestrictions.js";

/**
 * Compute the number of valid roll combinations for a given goal
 */
export const computeValidRolls = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	goal: number,
	subStats: string[],
	rollCount: number
): [number, number, number[]] => {
	rollRestrictions.sortByRestrictions(subStats);

	const dist = computeRollDistribution(
		subStats.length,
		rollCount,
		rollRestrictions.guaranteedStats.size,
		rollRestrictions.guaranteedCount,
		rollRestrictions.unrollableStats.size
	);

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

const getTotalOutcomes = memoize((
	subStatCount: number,
	rollableSubStatCount: number,
	rollValuesCount: number,
	rollCount: number
) => (rollValuesCount ** subStatCount) * ((rollableSubStatCount * rollValuesCount) ** rollCount));

const computeRollCountProb = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	combos: [string[], number][],
	goal: number,
	rollCount: number
): [number, number, number[]] => {
	const totalBuckets: number[] = [];

	let num = 0;
	let avgSum = 0;
	let totalWeights = 0;

	const totalOutcomes = getTotalOutcomes(
		rollRestrictions.subStatCount, rollRestrictions.rollableCount, statData.rollValues.length, rollCount
	);

	for (const [combo, weightProb] of combos) {
		const [result, avg, buckets] = computeValidRolls(statData, rollRestrictions, goal, combo, rollCount);

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
 * Compute the ratio required so the number of 4-roll outcomes is equal to the number of 5-roll outcomes
 */
const computeScaleDownRatio = (rollRestrictions: RollRestrictions, rollValuesCount: number) => {
	const fourOutcomes = getTotalOutcomes(
		rollRestrictions.subStatCount, rollRestrictions.rollableCount, rollValuesCount, rollRestrictions.lowerRollCount
	);
	const fiveOutcomes = getTotalOutcomes(
		rollRestrictions.subStatCount, rollRestrictions.rollableCount, rollValuesCount, rollRestrictions.upperRollCount
	);

	return fourOutcomes / fiveOutcomes;
}

/**
 * Compute the probability of reaching a goal stat value
 */
export const computeRollProb = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	combos: [string[], number][],
	goal: number
): [number, number, number[]] => {
	const allLinesProb = rollRestrictions.upperProb;
	const scaleDown = computeScaleDownRatio(rollRestrictions, statData.rollValues.length);
	
	let prob = 0;
	let avg = 0;
	const totalBuckets: number[] = [];

	if (allLinesProb < 1) {
		const [fourProb, fourAvg, fourBuckets] = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.lowerRollCount);

		prob += fourProb * (1 - allLinesProb);
		avg += fourAvg * (1 - allLinesProb);

		for (let i = 0; i < fourBuckets.length; i++) {
			totalBuckets[i] = (totalBuckets[i] ?? 0) + (1 - allLinesProb) * (fourBuckets[i] ?? 0);
		}
	}

	if (allLinesProb > 0) {
		const [fiveProb, fiveAvg, fiveBuckets] = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.upperRollCount);

		prob += fiveProb * allLinesProb;
		avg += fiveAvg * allLinesProb;

		for (let i = 0; i < fiveBuckets.length; i++) {
			totalBuckets[i] = (totalBuckets[i] ?? 0) + allLinesProb * scaleDown * (fiveBuckets[i] ?? 0);
		}
	}

	return [prob, avg, totalBuckets];
};
