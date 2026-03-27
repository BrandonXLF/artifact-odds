import { allLinesCraftedProb, allLinesDomainProb } from "../../logic/data";

export type StatOptimizers = "bestStats" | "bestRolls";

type BaseMode = {
	name: string;
	selectedStatCount: number;
	selectedStatOptimizer?: StatOptimizers;
	output?: {
		unit: string;
		perArtifact?: number | ((artifactType: number) => number);
		desc?: string;
	}
}

type UnfixedMode = BaseMode & {
	fixedArtifact: false;
	mainStatUnknown: boolean;
	allLinesProb: number;
	fromDomain: boolean;
}

type FixedMode = BaseMode & {
	fixedArtifact: true;
}

type Mode = UnfixedMode | FixedMode;

export const modes: Mode[] = [
	{
		name: "Artifact Domain",
		fixedArtifact: false,
		mainStatUnknown: true,
		allLinesProb: allLinesDomainProb,
		fromDomain: true,
		selectedStatCount: 0,
		output: {
			unit: "days",
			perArtifact: 1 / 8,
			desc: "Average of 8 artifacts = 160 resin per day"
		}
	},
	{
		name: "Artifact Strongbox",
		fixedArtifact: false,
		mainStatUnknown: true,
		allLinesProb: allLinesCraftedProb,
		fromDomain: false,
		selectedStatCount: 0,
		output: { unit: "strongboxes" }
	},
	{
		name: "Artifact Definition",
		fixedArtifact: false,
		mainStatUnknown: false,
		allLinesProb: allLinesCraftedProb,
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
	{
		name: "Artifact Reroll",
		fixedArtifact: true,
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
];
