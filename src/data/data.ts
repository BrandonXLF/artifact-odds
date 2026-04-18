import { Game } from "./game";

export interface GameData {
	rollValues: readonly number[];
	allLinesDomainProb: number;
	allLinesCraftedProb: number;
	stats: readonly string[];
	statWeights: Record<string, number>;
	statValues: Record<string, number>;
	mainStats: {
		typeGroup: number;
		name: string;
		stats: Record<string, number>;
	}[];
}

export const data: Record<Game, GameData> = {
	genshin: {
		rollValues: [70, 80, 90, 100] as const,
		allLinesDomainProb: 0.2,
		allLinesCraftedProb: 1/3,
		// Ordered from (typically) best to worse
		stats: [
			"CRIT Rate%",
			"CRIT DMG%",
			"ATK%",
			"HP%",
			"DEF%",
			"ER%",
			"EM",
			"ATK",
			"HP",
			"DEF"
		],
		statWeights: {
			"HP": 6,
			"ATK": 6,
			"DEF": 6,
			"HP%": 4,
			"ATK%": 4,
			"DEF%": 4,
			"ER%": 4,
			"EM": 4,
			"CRIT Rate%": 3,
			"CRIT DMG%": 3
		},
		statValues: {
			"HP": 2.9875,
			"ATK": 0.1945,
			"DEF": 0.235,
			"HP%": 0.0583,
			"ATK%": 0.0583,
			"DEF%": 0.0729,
			"ER%": 0.0648,
			"EM":  0.2331,
			"CRIT Rate%": 0.0389,
			"CRIT DMG%": 0.0777
		},
		mainStats: [
			{
				typeGroup: 0,
				name: "Flower",
				stats: {
					"HP": 1
				}
			},
			{
				typeGroup: 0,
				name: "Plume",
				stats: {
					"ATK": 1
				}
			},
			{
				typeGroup: 2,
				name: "Sands",
				stats: {
					"HP%": 0.2668,
					"ATK%": 0.2666,
					"DEF%": 0.2666,
					"ER%": 0.1,
					"EM": 0.1
				}
			},
			{
				typeGroup: 0,
				name: "Goblet",
				stats: {
					"HP%": 0.1925,
					"ATK%": 0.1925,
					"DEF%": 0.19,
					"Pyro DMG Bonus%": 0.05,
					"Hydro DMG Bonus%": 0.05,
					"Anemo DMG Bonus%": 0.05,
					"Electro DMG Bonus%": 0.05,
					"Dendro DMG Bonus%": 0.05,
					"Cryo DMG Bonus%": 0.05,
					"Physical DMG Bonus%": 0.05,
					"Geo DMG Bonus%": 0.05,
					"EM": 0.025
				}
			},
			{
				typeGroup: 0,
				name: "Circlet",
				stats: {
					"HP%": 0.22,
					"ATK%": 0.22,
					"DEF%": 0.22,
					"CRIT Rate%": 0.1,
					"CRIT DMG%": 0.1,
					"Healing Bonus%": 0.1,
					"EM": 0.04
				}
			}
		]
	},
	hsr: {
		rollValues: [80, 90, 100] as const, // SPD RV's: [76.9230769231, 88.4615384615, 100]
		allLinesDomainProb: 0.2,
		allLinesCraftedProb: 1/3,
		// Ordered from (typically) best to worse
		stats: [
			"CRIT Rate%",
			"CRIT DMG%",
			"ATK%",
			"SPD",
			"Break Effect%",
			"EHR%",
			"Effect RES%",
			"HP%",
			"DEF%",
			"ATK",
			"HP",
			"DEF"
		],
		statWeights: {
			"HP": 10,
			"ATK": 10,
			"DEF": 10,
			"HP%": 10,
			"ATK%": 10,
			"DEF%": 10,
			"SPD": 4,
			"CRIT Rate%": 6,
			"CRIT DMG%": 6,
			"EHR%": 8,
			"Effect RES%": 8,
			"Break Effect%": 8
		},
		statValues: {
			"SPD": 0.026,
			"HP": 0.4233755,
			"ATK": 0.21168773,
			"DEF": 0.21168773,
			"HP%": 0.0432,
			"ATK%": 0.0432,
			"DEF%": 0.054,
			"Break Effect%": 0.0648,
			"EHR%": 0.0432,
			"Effect RES%": 0.0432,
			"CRIT Rate%": 0.0324,
			"CRIT DMG%": 0.0648
		},
		mainStats: [
			{
				typeGroup: 0,
				name: "Head",
				stats: {
					"HP": 1
				}
			},
			{
				typeGroup: 0,
				name: "Hands",
				stats: {
					"ATK": 1
				}
			},
			{
				typeGroup: 0,
				name: "Body",
				stats: {
					"HP%": 0.2,
					"ATK%": 0.2,
					"DEF%": 0.2,
					"EHR%": 0.1,
					"OHB%": 0.1,
					"CRIT Rate%": 0.1,
					"CRIT DMG%": 0.1
				}
			},
			{
				typeGroup: 0,
				name: "Feet",
				stats: {
					"HP%": 0.28,
					"ATK%": 0.3,
					"DEF%": 0.3,
					"SPD": 0.12,
				}
			},
			{
				typeGroup: 1,
				name: "Planar Sphere",
				stats: {
					"HP%": 0.12,
					"ATK%": 0.13,
					"DEF%": 0.12,
					"Physical DMG Boost%": 0.09,
					"Fire DMG Boost%": 0.09,
					"Ice DMG Boost%": 0.09,
					"Wind DMG Boost%": 0.09,
					"Lightning DMG Boost%": 0.09,
					"Quantum DMG Boost%": 0.09,
					"Imaginary DMG Boost%": 0.09
				}
			},
			{
				typeGroup: 1,
				name: "Link Rope",
				stats: {
					"HP%": 0.26,
					"ATK%": 0.27,
					"DEF%": 0.24,
					"Break Effect%": 0.16,
					"ERR%": 0.05,
				}
			}
		]
	}
};
