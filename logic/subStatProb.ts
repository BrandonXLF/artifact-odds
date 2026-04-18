import { getSubStatCombinations } from "./combinations/subStatCombinations";
import { StatData } from "./StatData";

export const computeSubProb = (statData: StatData, size: number): [number, [string[], number][]] => {
	const combos = getSubStatCombinations(statData, size)
		.filter(combo => statData.meetsRequirements(combo[0]));

	const sum = combos.reduce((acc, [, weight]) => acc + weight, 0);

	return [sum, combos];
}
