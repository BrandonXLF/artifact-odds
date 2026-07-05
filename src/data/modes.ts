import { data } from "./data";
import { Game } from "./game";

export type StatOptimizers = "bestStats" | "bestRolls" | "bestToIgnore";

type Unit = {
	label: string;
	oddsLabel: string;
	single: string;
	many: string;
}

export type BasicUnitOutput = {
	unit: Unit;
	perArtifact?: number | ((artifactType: number, selectedStatCount: number) => number);
	desc?: string;
};

type DynamicUnitOutput = {
	unit: ((artifactType: number, selectedStatCount: number) => Unit);
	perArtifact?: number | ((artifactType: number, selectedStatCount: number) => number);
}

type Output = BasicUnitOutput | DynamicUnitOutput;

type BaseMode = {
	name: string;
	/**
	 * @note Must be in increasing order.
	 */
	selectedStatCount: number | number[];
	selectedStatOptimizer?: StatOptimizers;
	output: Output | Output[];
}

type UnfixedMainFeatures = {
	twoPossibleSets: true;
	typeUnknown: true;
	mainStatUnknown: true;
} | {
	twoPossibleSets: false;
	typeUnknown: true;
	mainStatUnknown: true;
} | {
	twoPossibleSets: false;
	typeUnknown: false;
	mainStatUnknown: boolean;
};

type UnfixedMode = BaseMode & UnfixedMainFeatures & {
	fixedArtifact: false;
	twoPossibleSets: boolean;
	allLinesProb: number;
};

type FixedModeGuarantee = BaseMode & {
	fixedArtifact: true;
	selectToIgnore: false;
	/**
	 * @note Must be in increasing order.
	 */
	guaranteedCount: number | number[];
};

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
			twoPossibleSets: true,
			typeUnknown: true,
			mainStatUnknown: true,
			allLinesProb: data.genshin.allLinesDomainProb,
			selectedStatCount: 0,
			output: [
				{
					unit: {
						label: "Days",
						oddsLabel: "Days",
						single: "day",
						many: "days"
					},
					perArtifact: 1 / 9.585,
					desc: "Average of 9.585 artifacts = 180 resin per day"
				},
				{
					unit: {
						label: "Drops",
						oddsLabel: "Drops",
						single: "drop",
						many: "drops"
					}
				}
			]
		},
		strongbox: {
			name: "Artifact Strongbox",
			fixedArtifact: false,
			twoPossibleSets: false,
			typeUnknown: true,
			mainStatUnknown: true,
			allLinesProb: data.genshin.allLinesCraftedProb,
			selectedStatCount: 0,
			output: {
				unit: {
					label: "Strongboxes",
					oddsLabel: "Times",
					single: "Strongbox",
					many: "Strongboxes"
				}
			}
		},
		definition: {
			name: "Artifact Definition",
			fixedArtifact: false,
			twoPossibleSets: false,
			typeUnknown: false,
			mainStatUnknown: false,
			allLinesProb: data.genshin.allLinesCraftedProb,
			selectedStatCount: 2,
			selectedStatOptimizer: "bestStats",
			output: {
				unit: {
					label: "Sanctifying Elixir",
					oddsLabel: "Elixir",
					single: "Sanctifying Elixir",
					many: "Sanctifying Elixirs"
				},
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
				unit: {
					label: "Dust of Enlightenment",
					oddsLabel: "Dusts",
					single: "Dust of Enlightenment (with same # of guaranteed rolls)",
					many: "Dusts of Enlightenment (with same # of guaranteed rolls)"
				},
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
			twoPossibleSets: true,
			typeUnknown: true,
			mainStatUnknown: true,
			allLinesProb: data.hsr.allLinesDomainProb,
			selectedStatCount: 0,
			output: [
				{
					unit: {
						label: "Days",
						oddsLabel: "Days",
						single: "day",
						many: "days"
					},
					perArtifact: 1 / 12.6,
					desc: "Average of 12.6 relics = 240 TBP per day"
				},
				{
					unit: {
						label: "Drops",
						oddsLabel: "Drops",
						single: "drop",
						many: "drops"
					}
				}
			]
		},
		synthesis: {
			name: "Relic Synthesis",
			fixedArtifact: false,
			twoPossibleSets: false,
			typeUnknown: false,
			mainStatUnknown: true,
			allLinesProb: data.hsr.allLinesCraftedProb,
			selectedStatCount: 0,
			output: {
				unit: {
					label: "Relic Remains",
					oddsLabel: "Remains",
					single: "Relic Remain",
					many: "Relic Remains"
				},
				perArtifact: 100,
			}
		},
		"customized-synthesis": {
			name: "Customized Synthesis",
			fixedArtifact: false,
			twoPossibleSets: false,
			typeUnknown: false,
			mainStatUnknown: false,
			allLinesProb: data.hsr.allLinesCraftedProb,
			selectedStatCount: [0, 1, 2],
			selectedStatOptimizer: "bestStats",
			output: {
				unit: {
					label: "Self-Modeling Resin",
					oddsLabel: "Resin",
					single: "Self-Modeling Resin",
					many: "Self-Modeling Resins"
				},
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
							return {
								label: "Variable Dice",
								oddsLabel: "Dice",
								single: "Variable Die",
								many: "Variable Dice"
							}
						case 1:
							return {
								label: "Variable Dice + Inference Keys",
								oddsLabel: "Times",
								single: "Variable Die + Inference Key",
								many: "Variable Dice + Inference Keys"
							};
						default:
							return {
								label: "",
								oddsLabel: "",
								single: "",
								many: ""
							}
					}
				}
			}
		}
	}
};
