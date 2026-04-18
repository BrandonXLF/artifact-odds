import { choose } from "../utils/math";
import { computeRollDistribution } from "./rollDistribution";

test("consolidated distribution for 3 rolls", () => {
	const dist = computeRollDistribution(4, 3, 0, 0);

	const consolidatedDist: Record<number, number> = {};

	for (const [statRolls, prob] of dist) {
		const i = statRolls[0];
		consolidatedDist[i] = (consolidatedDist[i] || 0) + prob;
	}

	// Only 1 way to get all rolls the same stat
	expect(consolidatedDist[3]).toBe(1);

	// Ways to get 2 rolls of same stat, plus ways to get remaining stats
	expect(consolidatedDist[2]).toBe(choose(3, 2) * (choose(1, 1) * 3));

	// Same as ignoring this stat
	expect(consolidatedDist[0]).toBe(3 ** 3);

	expect(consolidatedDist[1]).toBe(4 ** 3 - consolidatedDist[0] - consolidatedDist[2] - consolidatedDist[3]);
});
