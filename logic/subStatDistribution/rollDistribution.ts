import { memoize } from "../utils/math.js";

/**
 * Compute all substats^remaining outcomes, accounting for guaranteed rolls
 */
const computePermutations = (subStatCount: number, totalRolls: number, guaranteedCount: number, guaranteedRolls: number = 0): [number[], number][] => {
	if (totalRolls === 0) {
		return [
			[new Array(subStatCount).fill(0), 1]
		];
	}

	let out: [number[], number][] = [];

	if (totalRolls <= guaranteedRolls) {
		for (let stat = 0; stat < guaranteedCount; stat++) {
			const t = computePermutations(subStatCount, totalRolls - 1, guaranteedCount, guaranteedRolls - 1);

			for (const [statRolls, prob] of t) {
				statRolls[stat]++;
				// Since all branches should be equally likely, since there are typically subStatCount
				// branches from here, but there are now guaranteedCount, we need each one to be recorded
				// as subStatCount / guaranteedCount more likely.
				// For example: subStatCount = 4, guaranteedCount = 2, subStatCount / guaranteedCount = 2,
				// so each guaranteed roll is replacing 2 standard rolls.
				out.push([statRolls, prob * (subStatCount / guaranteedCount)]);
			}
		}

		return out;
	}

	for (let stat = 0; stat < subStatCount; stat++) {
		let nextGuaranteedRemaining = guaranteedRolls;

		if (stat < guaranteedCount) {
			nextGuaranteedRemaining--;
		}

		const t = computePermutations(subStatCount, totalRolls - 1, guaranteedCount, nextGuaranteedRemaining);

		for (const [statRolls, prob] of t) {
			statRolls[stat]++;
			out.push([statRolls, prob]);
		}
	}

	return out;
};

export interface RolLDistOut extends Array<[number[], number]> {
	permCount: number;
}

/**
 * Get all possible substat roll distributions with relative probabilities for an artifact
 */
export const computeRollDistribution = memoize((
	substatCount: number,
	totalRolls: number,
	guaranteedCount: number,
	guaranteedRolls: number,
	unrollableCount: number
): RolLDistOut => {
	const disabledStatRolls = new Array(unrollableCount).fill(0);
	const perms = computePermutations(substatCount - unrollableCount, totalRolls, guaranteedCount, guaranteedRolls)
		.map(([statRolls, prob]) => {
			if (unrollableCount) statRolls.push(...disabledStatRolls);
			return [statRolls.join(","), statRolls, prob] as const
		});

	const seen: Record<string, [number[], number]> = {};

	for (const [key, statRolls, prob] of perms) {
		if (seen[key]) {
			seen[key][1] += prob;
		} else {
			seen[key] = [statRolls, prob];
		}
	}

	const out = Object.values(seen) as RolLDistOut;
	out.permCount = perms.length;

	return out;
});
