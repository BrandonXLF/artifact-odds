import { data } from "./data";
import { Game } from "./game";

export type StatOptimizers = "bestStats" | "bestRolls" | "bestToIgnore";

type BaseMode = {
	name: string;
	/**
	 * @note Must be in increasing order.
	 */
	selectedStatCount: number | number[];
	selectedStatOptimizer?: StatOptimizers;
	output?: {
		unit: string | ((artifactType: number, selectedStatCount: number) => string);
		perArtifact?: number | ((artifactType: number, selectedStatCount: number) => number);
		desc?: string;
	}
}

type UnfixedMode = BaseMode & {
	fixedArtifact: false;
	mainStatUnknown: boolean;
	allLinesProb: number;
	fromDomain: boolean;
}

type FixedModeGuarantee = BaseMode & {
	fixedArtifact: true;
	selectToIgnore: false;
	/**
	 * @note Must be in increasing order.
	 */
	guaranteedCount: number | number[];
}

type FixedModeIgnore = BaseMode & {
	fixedArtifact: true;
	selectToIgnore: true;
}

export type Mode = UnfixedMode | FixedModeGuarantee | FixedModeIgnore;

export const modes: Record<Game, Record<string, Mode>> = {
	genshin: {
		domain: {
			name: "Artifact Domain",
			fixedArtifact: false,
			mainStatUnknown: true,
			allLinesProb: data.genshin.allLinesDomainProb,
			fromDomain: true,
			selectedStatCount: 0,
			output: {
				unit: "days",
				perArtifact: 1 / 9.585,
				desc: "Average of 9.585 artifacts = 180 resin per day"
			}
		},
		strongbox: {
			name: "Artifact Strongbox",
			fixedArtifact: false,
			mainStatUnknown: true,
			allLinesProb: data.genshin.allLinesCraftedProb,
			fromDomain: false,
			selectedStatCount: 0,
			output: { unit: "strongboxes" }
		},
		definition: {
			name: "Artifact Definition",
			fixedArtifact: false,
			mainStatUnknown: false,
			allLinesProb: data.genshin.allLinesCraftedProb,
			fromDomain: false,
			selectedStatCount: 2,
			selectedStatOptimizer: "bestStats",
			output: {
				unit: "Sanctifying Elixir",
				perArtifact: (artifactType: number) => {
					switch (artifactType) {
						case 0:
						case 1:
							return 1;
						case 2:
							return 2;
						case 3:
							return 4;
						case 4:
							return 3;
						default:
							return Number.NaN;
					}
				}
			}
		},
		reroll: {
			name: "Artifact Reroll",
			fixedArtifact: true,
			selectToIgnore: false,
			guaranteedCount: [2, 3, 4],
			selectedStatCount: 2,
			selectedStatOptimizer: "bestRolls",
			output: {
				unit: "Dust of Enlightenment (with same # of guaranteed rolls)",
				perArtifact: (artifactType: number) => {
					switch (artifactType) {
						case 0:
						case 1:
							return 1;
						case 2:
						case 3:
						case 4:
							return 2;
						default:
							return Number.NaN;
					}
				}
			}
		}
	},
	hsr: {
		cavern: {
			name: "Cavern / Extraction",
			fixedArtifact: false,
			mainStatUnknown: true,
			allLinesProb: data.hsr.allLinesDomainProb,
			fromDomain: true,
			selectedStatCount: 0,
			output: {
				unit: "days",
				perArtifact: 1 / 12.6,
				desc: "Average of 12.6 relics = 240 TBP per day"
			}
		},
		synthesis: {
			name: "Relic Synthesis",
			fixedArtifact: false,
			mainStatUnknown: true,
			allLinesProb: data.hsr.allLinesCraftedProb,
			fromDomain: false,
			selectedStatCount: 0,
			output: {
				unit: "Relic Remains",
				perArtifact: 100,
			}
		},
		"customized-synthesis": {
			name: "Customized Synthesis",
			fixedArtifact: false,
			mainStatUnknown: false,
			allLinesProb: data.hsr.allLinesCraftedProb,
			fromDomain: false,
			selectedStatCount: [0, 1, 2],
			selectedStatOptimizer: "bestStats",
			output: {
				unit: "Self-Modeling Resin",
				perArtifact: (_, selectedStatCount: number) => {
					switch (selectedStatCount) {
						case 0:
							return 1;
						case 1:
							return 2;
						case 2:
							return 5;
						default:
							return Number.NaN;
					}
				}
			}
		},
		reroll: {
			name: "Reroll",
			fixedArtifact: true,
			selectToIgnore: true,
			selectedStatCount: [0, 1],
			selectedStatOptimizer: "bestToIgnore",
			output: {
				unit: (_: unknown, selectedStatCount: number) => {
					switch (selectedStatCount) {
						case 0:
							return "Variable Dice";
						case 1:
							return "Variable Dice + Inference Keys";
						default:
							return "";
					}
				}
			}
		}
	}
};
