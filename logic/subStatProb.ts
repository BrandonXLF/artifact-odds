import { getSubStatCombinations } from "./combinations/subStatCombinations";
import { StatData } from "./data/StatData";

export const computeSubProb = (statData: StatData, size: number): [number, [string[], number][], number] => {
	const allCombos = getSubStatCombinations(statData, size)
	const combos = allCombos.filter(([stats]) => statData.meetsRequirements(stats));

	const sum = combos.reduce((acc, [, weight]) => acc + weight, 0);

	return [sum * (statData.requiredAllLinesProb ?? 1), combos, allCombos.length];
}
