import { rollValues, SubStat } from "../logic/data";
import { StatData } from "../logic/StatData";

const randomInt = (max: number) => Math.floor(Math.random() * max);

const getStats = (number: number, stats: SubStat[], statData: StatData): SubStat[] => {
	if (number === 0) return [];

	const totalWeight = stats.reduce((sum, stat) => sum + statData.getRollWeight(stat), 0);
	const statDistribution: SubStat[] = [];

	for (const stat of stats) {
		const weight = statData.getRollWeight(stat);

		for (let j = 0; j < weight; j++) {
			statDistribution.push(stat);
		}
	}

	const stat = statDistribution[randomInt(totalWeight)];

	return [stat, ...getStats(number - 1, stats.filter((s) => s !== stat), statData)];
};

type RollRecord = Partial<Record<SubStat, number>>;

/**
 * Add a role to rollRecord for the given stat, randomly choosing a roll value.
 */
const addRoll = (rollRecord: RollRecord, stat: SubStat): void => {
	const chosenRollValue = rollValues[randomInt(rollValues.length)];
	rollRecord[stat] = (rollRecord[stat] ?? 0) + chosenRollValue;
}

/**
 * Recursively roll the artifact, updating rollRecord.
 */
const rollArtifact = (rollRecord: RollRecord, rollsLeft: number, stats: SubStat[], statData: StatData, guaranteedRollsStats: Set<SubStat>, guaranteedRollsCount: number): void => {
	if (rollsLeft === 0) return;

	let stat;

	if (guaranteedRollsCount >= rollsLeft) {
		stat = [...guaranteedRollsStats][randomInt(guaranteedRollsStats.size)];
	} else {
		stat = stats[randomInt(stats.length)];
	}

	addRoll(rollRecord, stat);
	rollArtifact(rollRecord, rollsLeft - 1, stats, statData, guaranteedRollsStats, guaranteedRollsCount - (guaranteedRollsStats.has(stat) ? 1 : 0));
};

const populateArtifact = (rolls: number, stats: SubStat[], statData: StatData, guaranteedRollsStats = new Set<SubStat>(), guaranteedRollsCount = 0): number => {
	if (guaranteedRollsStats.size === 0) {
		guaranteedRollsCount = 0;
	}

	const rollRecord: RollRecord = {};
	
	// Add initial rolls
	for (const stat of stats) {
		addRoll(rollRecord, stat);
	}

	// Do artifact upgrades
	rollArtifact(rollRecord, rolls, stats, statData, guaranteedRollsStats, guaranteedRollsCount);

	let sum = 0;

	// Tally results, making sure mins are met, and ignoring anything above limits
	for (const [stat, value] of Object.entries(rollRecord)) {
		if (value < statData.getMin(stat as SubStat)) {
			return -Infinity;
		}

		sum += Math.min(value, statData.getLimit(stat as SubStat)) * statData.getUsefulness(stat as SubStat);
	}

	return sum;
};

export const runSimulator = (statData: StatData, goal: number, allLinesProb: number, fixedStats?: SubStat[], guaranteedRollsStats?: Set<SubStat>, guaranteedRollsCount?: number): number => {
	const tot = 100000;
	let valid = 0;

	for (let i = 0; i < tot; i++) {
		const stats = fixedStats ?? [...statData.guaranteed, ...getStats(4 - statData.guaranteed.length, statData.random, statData)];
		if (!statData.meetsRequirements(stats)) continue;

		const rolls = Math.random() < allLinesProb ? 5 : 4;
		const value = populateArtifact(rolls, stats, statData, guaranteedRollsStats, guaranteedRollsCount);
		if (goal !== -Infinity && value <= goal) continue;
		
		valid++;
	}

	return valid / tot;
};
