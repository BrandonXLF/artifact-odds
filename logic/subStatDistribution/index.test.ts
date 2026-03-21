import { rollValues, SubStat } from "../data.js";
import { StatDataConfig } from "../StatData.js";
import { computeValidRolls, computeRollProb } from "./index.js";

test("All rolls required (>)", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.setWeight("CRIT DMG%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		34000 + 15000,
		0,
		new Set<SubStat>(["CRIT Rate%", "CRIT DMG%"]),
		4
	)[0];

	let tot = 0;
	let valid = 0;

	for (let i1 = 0; i1 < 4; i1++) { // Initial CD roll
		for (let i2 = 0; i2 < 4; i2++) { // Initial CR roll
			for (let i3 = 0; i3 < 4; i3++) { // Roll 1
				for (let i4 = 0; i4 < 4; i4++) { // Roll 2
					for (let i5 = 0; i5 < 4; i5++) { // Roll 3
						for (let i6 = 0; i6 < 4; i6++) { // Roll 4
							tot++;
							
							const sum = rollValues[i1] + rollValues[i2] + rollValues[i3] + rollValues[i4] + rollValues[i5] + rollValues[i6];

							if (sum * 100 > 34000 + 15000) {
								valid++;
							}
						}
					}
				}
			}
		}
	}

	expect(prob).toBe(valid / tot);
});

test("All rolls required (>=)", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.setWeight("CRIT DMG%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		34000 + 15000 - 0.1,
		0,
		new Set<SubStat>(["CRIT Rate%", "CRIT DMG%"]),
		4
	)[0];

	let tot = 0;
	let valid = 0;

	for (let i1 = 0; i1 < 4; i1++) { // Initial CD roll
		for (let i2 = 0; i2 < 4; i2++) { // Initial CR roll
			for (let i3 = 0; i3 < 4; i3++) { // Roll 1
				for (let i4 = 0; i4 < 4; i4++) { // Roll 2
					for (let i5 = 0; i5 < 4; i5++) { // Roll 3
						for (let i6 = 0; i6 < 4; i6++) { // Roll 4
							tot++;
							
							const sum = rollValues[i1] + rollValues[i2] + rollValues[i3] + rollValues[i4] + rollValues[i5] + rollValues[i6];

							if (sum * 100 >= 34000 + 15000) {
								valid++;
							}
						}
					}
				}
			}
		}
	}

	expect(prob).toBe(valid / tot);
});

test("Only 1 unique combination possible - 3-liner", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		50000 - 0.1,
		0
	)[0];

	// 4^3 ways to get 0 (0 * 70, ... 0 * 100) for other 3 stats
	expect(prob).toBe((4 ** 3) / (4 ** 12));
});

test("Only 1 unique combination possible - 4-liner", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		60000 - 0.1,
		1
	)[0];

	// 4^3 ways to get 0 (0 * 70, ... 0 * 100) for other 3 stats
	expect(prob).toBe((4 ** 3) / (4 ** 14));
});

test("3/4 guarantee does not help 1 unique combination - 3-liner", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		50000 - 0.1,
		0,
		new Set<SubStat>(["CRIT Rate%"]),
		3
	)[0];

	// 4^3 ways to get 0 (0 * 70, ... 0 * 100) for other 3 stats
	expect(prob).toBe((4 ** 3) / (4 ** 12));
});

test("all rolls guaranteed - 3-liner", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		50000 - 0.1,
		0,
		new Set<SubStat>(["CRIT Rate%"]),
		4
	)[0];

	// 4^3 ways to get 0 (0 * 70, ... 0 * 100) for other 3 stats + sub-stats guaranteed
	expect(prob).toBe((4 ** 3) / (4 ** 8));
});

test("0", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.make();

	const prob = computeRollProb(
		statData,
		[[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]],
		60000,
		0.5
	)[0];

	// 4^3 ways to get 0 (0 * 70, ... 0 * 100) for other 3 stats
	expect(prob).toBe(0);
});

test("Total combinations (all valid)", () => {
	const statData = new StatDataConfig().make();
	const combo = ["HP", "DEF", "CRIT Rate%", "CRIT DMG%"] as SubStat[];

	const fourRollTot = computeValidRolls(statData, -Infinity, combo, 4, new Set(), 0)[0];
	expect(fourRollTot).toBe(((4 ** 4) ** 2) * (4 ** 4));

	const fiveRollTot = computeValidRolls(statData, -Infinity, combo, 5, new Set(), 0)[0];
	expect(fiveRollTot).toBe(((4 ** 5) ** 2) * (4 ** 4));
});

test("Total combinations with guaranteed stats (all valid)", () => {
	const statData = new StatDataConfig().make();
	const combo = ["HP", "DEF", "CRIT Rate%", "CRIT DMG%"] as SubStat[];

	const fourRollTot = computeValidRolls(statData, -Infinity, combo, 4, new Set(["HP", "DEF"]), 2)[0];
	expect(fourRollTot).toBe(((4 ** 4) ** 2) * (4 ** 4));

	const fiveRollTot = computeValidRolls(statData, -Infinity, combo, 5, new Set(["HP", "DEF"]), 2)[0];
	expect(fiveRollTot).toBe(((4 ** 5) ** 2) * (4 ** 4));
});

test("Order invariance", () => {
	const statData = new StatDataConfig()
		.setWeight("CRIT Rate%", 100)
		.setWeight("CRIT DMG%", 100)
		.make();

	const combos1: [SubStat[], number][] = [
		[["HP", "DEF", "CRIT Rate%", "CRIT DMG%"], 1]
	];

	const combos2: [SubStat[], number][] = [
		[["CRIT DMG%", "CRIT Rate%", "DEF", "HP"], 1]
	];

	const guaranteed = new Set<SubStat>(["CRIT Rate%", "CRIT DMG%"]);

	const prob1 = computeRollProb(statData, combos1, 50000, 0.5, guaranteed, 2)[0];
	const prob2 = computeRollProb(statData, combos2, 50000, 0.5, guaranteed, 2)[0];

	expect(prob1).toBe(prob2);
});
