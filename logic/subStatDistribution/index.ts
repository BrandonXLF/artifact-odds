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
	let allCount = 0;
	let avgSum = 0;
	let totalRelProbs = 0;
	const buckets: number[] = [];

	for (const [rolls, m] of dist) {
		const statistics = computeWaysAboveGoal(statData, subStats, rolls, goal);
		
		probSum += m * statistics.probAbove;
		avgAboveSum += m * statistics.probAbove * statistics.avgAbove;
		allCount += m * statistics.allCount;
		avgSum += m * statistics.avg;

		totalRelProbs += m;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + m * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: probSum / totalRelProbs,
		avgAbove: probSum === 0 ? 0 : avgAboveSum / probSum,
		allCount,
		avg: avgSum / totalRelProbs,
		buckets,
	};
};

const computeRollCountProb = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	combos: [string[], number][],
	goal: number,
	rollCount: number
): Statistics => {
	let probSum = 0;
	let avgAboveSum = 0;
	let allCount = 0;
	let avgSum = 0;
	let totalWeights = 0;
	const buckets: number[] = [];

	for (const [combo, weightProb] of combos) {
		const statistics = computeValidRolls(statData, rollRestrictions, goal, combo, rollCount);

		probSum += statistics.probAbove * weightProb;
		avgAboveSum += statistics.avgAbove * statistics.probAbove * weightProb;
		allCount += statistics.allCount;
		avgSum += statistics.avg * weightProb;
		totalWeights += weightProb;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + weightProb * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: probSum / totalWeights,
		avgAbove: probSum === 0 ? 0 : avgAboveSum / probSum,
		allCount,
		avg: avgSum / totalWeights,
		buckets
	};
};

/**
 * Compute the probability of reaching a goal stat value
 */
export const computeRollProb = (
	statData: StatData,
	rollRestrictions: RollRestrictions,
	combos: [string[], number][],
	goal: number
): Statistics => {
	const allLinesProb = rollRestrictions.upperProb;
	
	let prob = 0;
	let avgAboveSum = 0;
	let allCount = 0;
	let avg = 0;
	const buckets: number[] = [];

	let fourCount = 0;

	if (allLinesProb < 1) {
		const statistics = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.lowerRollCount);

		prob += statistics.probAbove * (1 - allLinesProb);
		avgAboveSum += statistics.avgAbove * statistics.probAbove * (1 - allLinesProb);
		allCount += statistics.allCount;
		avg += statistics.avg * (1 - allLinesProb);

		fourCount = statistics.allCount;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + (1 - allLinesProb) * (statistics.buckets[i] ?? 0);
		}
	}

	if (allLinesProb > 0) {
		const statistics = computeRollCountProb(statData, rollRestrictions, combos, goal, rollRestrictions.upperRollCount);

		prob += statistics.probAbove * allLinesProb;
		avgAboveSum += statistics.avgAbove * statistics.probAbove * allLinesProb;
		allCount += statistics.allCount;
		avg += statistics.avg * allLinesProb;

		const scaleDown = allLinesProb < 1
			? (fourCount * (1 - allLinesProb)) / (statistics.allCount * allLinesProb)
			: 1;

		for (let i = 0; i < statistics.buckets.length; i++) {
			buckets[i] = (buckets[i] ?? 0) + allLinesProb * scaleDown * (statistics.buckets[i] ?? 0);
		}
	}

	return {
		probAbove: prob,
		avgAbove: prob === 0 ? 0 : avgAboveSum / prob,
		allCount,
		avg,
		buckets
	};
};
