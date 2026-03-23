import { rollValues, SubStat } from "../logic/data";
import { StatData } from "../logic/StatData";

export const SIMULATIONS_PER_RUN = 100000;

const randomInt = (max: number) => Math.floor(Math.random() * max);

type StatOption = {
	stat: SubStat;
	relBlockStart: number;
	blockSize: number;
};

/**
 * Array where each stat has a number of entries equal to its weight, allowing stats
 * to be randomly selected according to their weights by picking a random index in the array.
 */
const makeStatOptionsArray = (stats: SubStat[], statData: StatData): StatOption[] => {
	const statDistribution: StatOption[] = [];

	for (const stat of stats) {
		const weight = statData.getRollWeight(stat);

		for (let j = 0; j < weight; j++) {
			statDistribution.push({ stat, relBlockStart: j, blockSize: weight });
		}
	}

	return statDistribution;
}

const getStats = (number: number, statOptions: StatOption[]): SubStat[] => {
	if (number === 0) return [];

	const i = randomInt(statOptions.length);
	const { stat, relBlockStart, blockSize } = statOptions[i];

	// Remove all entries for the selected stat.
	const newStats = [...statOptions];
	newStats.splice(i - relBlockStart, blockSize);

	return [stat, ...getStats(number - 1, newStats)];
};

type RollRecord = Partial<Record<SubStat, number>>;

/**
 * Add a roll to rollRecord for the given stat, randomly choosing a roll value.
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
	const tot = SIMULATIONS_PER_RUN;
	let valid = 0;
	const statOptions = makeStatOptionsArray(statData.random, statData);

	for (let i = 0; i < tot; i++) {
		const stats = fixedStats ?? [...statData.guaranteed, ...getStats(4 - statData.guaranteed.length, statOptions)];
		if (!statData.meetsRequirements(stats)) continue;

		if (goal === -Infinity) {
			// -infinity means goal is always reached.
			valid++;
			continue;
		}

		const rolls = Math.random() < allLinesProb ? 5 : 4;
		const value = populateArtifact(rolls, stats, statData, guaranteedRollsStats, guaranteedRollsCount);

		if (value > goal) valid++;
	}

	return valid / tot;
};
