import { getSubStatCombinations } from "./combinations/subStatCombinations";
import { SubStat } from "./data";
import { StatData } from "./StatData";

export const computeSubProb = (statData: StatData): [number, [SubStat[], number][]] => {
	const combos = getSubStatCombinations(statData)
		.filter(combo => statData.meetsRequirements(combo[0]));

	const sum = combos.reduce((acc, [, weight]) => acc + weight, 0);

	return [sum, combos];
}
