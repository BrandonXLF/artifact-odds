export type SubStat = "HP" | "ATK" | "DEF" | "HP%" | "ATK%" | "DEF%" | "ER%" | "EM" | "CRIT Rate%" | "CRIT DMG%";
export type AnyStat = SubStat | "Pyro DMG Bonus%" | "Hydro DMG Bonus%" | "Anemo DMG Bonus%" | "Electro DMG Bonus%" | "Dendro DMG Bonus%" | "Cryo DMG Bonus%" | "Physical DMG Bonus%" | "Geo DMG Bonus%" | "Healing Bonus%";

export const allSubStats: SubStat[] = ["CRIT Rate%", "CRIT DMG%", "ATK%", "HP%", "DEF%", "ER%", "EM", "ATK", "HP", "DEF"];

export const statWeights: Record<SubStat, number> = {
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
};

export const statRollValues: Record<SubStat, number> = {
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
};

export const rollValues = [70, 80, 90, 100] as const;
export const allLinesDomainProb = 0.2;
export const allLinesCraftedProb = 1/3;

export const mainStats: {
	name: string;
	stats: Partial<Record<AnyStat, number>>;
}[] = [
	{
		name: "Flower",
		stats: {
			"HP": 1
		}
	},
	{
		name: "Plume",
		stats: {
			"ATK": 1
		}
	},
	{
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
