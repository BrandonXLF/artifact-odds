import { computeRollDistribution } from "./rollDistribution.js";
import { computeWaysAboveGoal } from "./valueDistribution.js";
import { StatData } from "../data/StatData.js";
import RollRestrictions from "../data/RollRestrictions.js";
import { Statistics } from "./Statistics.js";

/**
 * Compute the number of valid roll combinations for a given goal
 */
export const computeValidRolls = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	goal: number,
	subStats: string[],
	rollCount: number
): Statistics => {
	rollRestrictions.sortByRestrictions(subStats);

	const dist = computeRollDistribution(
		subStats.length,
		rollCount,
		rollRestrictions.guaranteedStats.size,
		rollRestrictions.guaranteedCount,
		rollRestrictions.unrollableStats.size
	);

	let probSum = 0;
	let avgAboveSum = 0;
	let avgSum = 0;
	let totalRelProbs = 0;
	const buckets: number[] = [];

	for (const [rolls, m] of dist) {
		const statistics = computeWaysAboveGoal(statData, subStats, rolls, goal);
		
		probSum += m * statistics.probAbove;
		avgAboveSum += m * statistics.probAbove * statistics.avgAbove;
		avgSum += m * statistics.avg;

		totalRelProbs += m;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + m * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: probSum / totalRelProbs,
		avgAbove: probSum === 0 ? 0 : avgAboveSum / probSum,
		avg: avgSum / totalRelProbs,
		buckets,
	};
};

/**
 * Compute the (unweighted) number of outcomes for a roll count, taking into account guaranteed rolls etc.
*/
export const computePermutationCount = (statData: StatData, rollRestrictions: RollRestrictions, rollCount: number) => {
	const dist = computeRollDistribution(
		rollRestrictions.subStatCount,
		rollCount,
		rollRestrictions.guaranteedStats.size,
		rollRestrictions.guaranteedCount,
		rollRestrictions.unrollableStats.size
	);

	// TODO: Consider if initial values are provided and used
	const valueOutcomesPer = (statData.rollValues.length ** (rollRestrictions.subStatCount + rollCount));
	return dist.permCount * valueOutcomesPer;
}

const computeRollCountProb = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	combos: [string[], number][],
	goal: number,
	rollCount: number
): Statistics & { permutationCount: number } => {
	let probSum = 0;
	let avgAboveSum = 0;
	let avgSum = 0;
	let totalWeights = 0;
	const buckets: number[] = [];

	for (const [combo, weightProb] of combos) {
		const statistics = computeValidRolls(statData, rollRestrictions, goal, combo, rollCount);

		probSum += statistics.probAbove * weightProb;
		avgAboveSum += statistics.avgAbove * statistics.probAbove * weightProb;
		avgSum += statistics.avg * weightProb;
		totalWeights += weightProb;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + weightProb * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: probSum / totalWeights,
		avgAbove: probSum === 0 ? 0 : avgAboveSum / probSum,
		avg: avgSum / totalWeights,
		buckets,
		permutationCount: computePermutationCount(statData, rollRestrictions, rollCount)
	};
}

const getTotalOutcomes = (subStatCount: number, rollableSubStatCount: number, rollValuesCount: number, rollCount: number) =>
	(rollValuesCount ** (subStatCount + rollCount)) * (rollableSubStatCount ** rollCount);

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
): Statistics & { permutationCount: number } => {
	const allLinesProb = rollRestrictions.upperProb;
	const scaleDown = computeScaleDownRatio(rollRestrictions, statData.rollValues.length);
	
	let prob = 0;
	let avgAboveSum = 0;
	let avg = 0;
	const buckets: number[] = [];

	let totalPerCombo = 0;

	if (allLinesProb < 1) {
		const statistics = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.lowerRollCount);

		prob += statistics.probAbove * (1 - allLinesProb);
		avg += statistics.avg * (1 - allLinesProb);
		avgAboveSum += statistics.avgAbove * statistics.probAbove * (1 - allLinesProb);
		totalPerCombo += statistics.permutationCount;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + (1 - allLinesProb) * (statistics.buckets[i] ?? 0);
		}
	}

	if (allLinesProb > 0) {
		const statistics = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.upperRollCount);

		prob += statistics.probAbove * allLinesProb;
		avg += statistics.avg * allLinesProb;
		avgAboveSum += statistics.avgAbove * statistics.probAbove * allLinesProb;
		totalPerCombo += statistics.permutationCount;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + allLinesProb * scaleDown * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: prob,
		avgAbove: prob === 0 ? 0 : avgAboveSum / prob,
		avg,
		buckets,
		permutationCount: totalPerCombo
	};
};
