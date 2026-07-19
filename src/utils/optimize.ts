// Note: This is far larger than the minimum difference between actual probabilities
const probDelta = 1 / 10_000_000_000_000;

export const optimize = <T,>(
	statCombos: T[],
	calculate: (statCombo: T) => [number, number],
	normalize: (statCombo: T) => string[]
) => {
	let maxStatsAndAvg: [T, number][] = [];
	let maxProb = -1;

	for (const statCombo of statCombos) {
		const [prob, avg] = calculate(statCombo);

		// Note: This is far larger than the minimum difference between actual probabilities
		if (prob - maxProb > probDelta) {
			maxStatsAndAvg = [[statCombo, avg] as [T, number]];
			maxProb = prob;
		} else if (Math.abs(prob - maxProb) <= probDelta) {
			maxStatsAndAvg.push([statCombo, avg] as [T, number]);
		}
	}

	maxStatsAndAvg.sort((a, b) => b[1] - a[1]); // Sort by average RV descending

	const maxAvgValue = maxStatsAndAvg[0]?.[1];
	const maxStats = maxStatsAndAvg
		.filter(([_, avg]) => Math.abs(avg - maxAvgValue) <= probDelta)
		.map(([statCombo]) => normalize(statCombo));

	return maxStats;
};
