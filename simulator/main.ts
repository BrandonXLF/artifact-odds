import RollRestrictions from "../logic/data/RollRestrictions";
import { StatData } from "../logic/data/StatData";

export const SIMULATIONS_PER_RUN = 100000;

const randomInt = (max: number) => Math.floor(Math.random() * max);

type StatOption = {
	stat: string;
	relBlockStart: number;
	blockSize: number;
};

/**
 * Array where each stat has a number of entries equal to its weight, allowing stats
 * to be randomly selected according to their weights by picking a random index in the array.
 */
const makeStatOptionsArray = (statData: StatData): StatOption[] => {
	const statDistribution: StatOption[] = [];

	for (const stat of statData.random) {
		const weight = statData.getRollWeight(stat);

		for (let j = 0; j < weight; j++) {
			statDistribution.push({ stat, relBlockStart: j, blockSize: weight });
		}
	}

	return statDistribution;
}

const getStats = (number: number, statOptions: StatOption[]): string[] => {
	if (number === 0) return [];

	const i = randomInt(statOptions.length);
	const { stat, relBlockStart, blockSize } = statOptions[i];

	// Remove all entries for the selected stat.
	const newStats = [...statOptions];
	newStats.splice(i - relBlockStart, blockSize);

	return [stat, ...getStats(number - 1, newStats)];
};

type RollRecord = Record<string, number>;

/**
 * Add a roll to rollRecord for the given stat, randomly choosing a roll value.
 */
const addRoll = (rollRecord: RollRecord, stat: string, rollValues: readonly number[]): void => {
	const chosenRollValue = rollValues[randomInt(rollValues.length)];
	rollRecord[stat] = (rollRecord[stat] ?? 0) + chosenRollValue;
}

/**
 * Recursively roll the artifact, updating rollRecord.
 */
const rollArtifact = (rollRecord: RollRecord, rollsLeft: number, stats: string[], statData: StatData, guaranteedRollsStats: Set<string>, guaranteedRollsCount: number): void => {
	if (rollsLeft === 0) return;

	let stat;
	if (guaranteedRollsCount >= rollsLeft) {
		stat = [...guaranteedRollsStats][randomInt(guaranteedRollsStats.size)];
	} else {
		stat = stats[randomInt(stats.length)];
	}

	addRoll(rollRecord, stat, statData.getRollValues(stat));

	rollArtifact(rollRecord, rollsLeft - 1, stats, statData, guaranteedRollsStats, guaranteedRollsCount - (guaranteedRollsStats.has(stat) ? 1 : 0));
};

const populateArtifact = (rolls: number, stats: string[], statData: StatData, rollRestrictions: RollRestrictions): number => {
	const rollRecord: RollRecord = {};
	
	// Add initial rolls
	for (const stat of stats) {
		const initial = statData.getInitial(stat);

		if (initial > 0) {
			rollRecord[stat] = initial;
		} else {
			addRoll(rollRecord, stat, statData.getRollValues(stat));
		}
	}

	// Do artifact upgrades
	rollArtifact(
		rollRecord,
		rolls,
		stats.filter(s => !rollRestrictions.unrollableStats.has(s)),
		statData,
		rollRestrictions.guaranteedStats,
		rollRestrictions.guaranteedCount,
	);

	let sum = 0;

	// Tally results, making sure mins are met, and ignoring anything above limits
	for (const [stat, value] of Object.entries(rollRecord)) {
		if (value < statData.getMin(stat)) {
			return -Infinity;
		}

		sum += Math.min(value, statData.getLimit(stat)) * statData.getUsefulness(stat);
	}

	return sum;
};

export const runSimulator = (statData: StatData, rollRestrictions: RollRestrictions, goal: number, fixedStats?: string[]): number => {
	const tot = SIMULATIONS_PER_RUN;
	let valid = 0;
	const statOptions = makeStatOptionsArray(statData);

	for (let i = 0; i < tot; i++) {
		const isAllLiner = Math.random();
		if (statData.requiredAllLinesProb !== undefined && isAllLiner >= statData.requiredAllLinesProb) continue;

		const stats = fixedStats ?? [...statData.guaranteed, ...getStats(4 - statData.guaranteed.length, statOptions)];
		if (!statData.meetsRequirements(stats)) continue;

		if (goal === -Infinity) {
			// -Infinity means goal is always reached.
			valid++;
			continue;
		}

		const rolls = isAllLiner < rollRestrictions.upperProb
			? rollRestrictions.upperRollCount
			: rollRestrictions.lowerRollCount;

		const value = populateArtifact(rolls, stats, statData, rollRestrictions);

		if (value > goal) valid++;
	}

	return valid / tot;
};
