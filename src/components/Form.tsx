import { allLinesCraftedProb, allLinesDomainProb, allSubStats, AnyStat, mainStats, SubStat } from '../../logic/data';
import { computeMainStatProb } from '../../logic/mainStatProb';
import { StatDataConfig } from '../../logic/StatData';
import { computeRollProb } from '../../logic/subStatDistribution';
import { SingleStatDataInput, StatDataInput } from './StatDataInput';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { StatNamesInput } from './StatNamesInput';
import { getSubStatCombinations } from '../../logic/combinations/subStatCombinations';
import { computeSubProb } from '../../logic/subStatProb';
import { Section } from './Section';
import { ToggleButtons } from './ToggleButtonts';
import { Checkbox } from './Checkbox';
import { ResetTrigger, useStoredState } from '../utils/storedState';
import { ComponentChild } from 'preact';
import { bucketsLimit, toBucket } from '../utils/barChart';
import { DocumentLink } from './DocumentLink';
import { distributions } from '../distributions';
import { round2, roundMaxPrecision } from '../utils/round';
import { Percentage } from './Percentage';
import { Button } from './Button';

type StatOptimizers = "bestStats" | "bestRolls";

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
	allLineProb: number;
	fromDomain: boolean;
}

type FixedMode = BaseMode & {
	fixedArtifact: true;
}

type Mode = UnfixedMode | FixedMode;

const modes: Mode[] = [
	{
		name: "Artifact Domain",
		fixedArtifact: false,
		mainStatUnknown: true,
		allLineProb: allLinesDomainProb,
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
		allLineProb: allLinesCraftedProb,
		fromDomain: false,
		selectedStatCount: 0,
		output: { unit: "strongboxes" }
	},
	{
		name: "Artifact Definition",
		fixedArtifact: false,
		mainStatUnknown: false,
		allLineProb: allLinesCraftedProb,
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

export function Form() {
	const resetTrigger = useRef(new ResetTrigger()).current;

	const [modeNum, setModeNum] = useStoredState(resetTrigger, "mode", 0);
	const [artifactType, setArtifactType] = useStoredState(resetTrigger, "artifactType", 0);
	const [mainStat, setMainStat] = useStoredState<AnyStat>(resetTrigger, "mainStat", "HP");
	const [currentStats, setCurrentStats] = useStoredState<SubStat[]>(resetTrigger, "currentStats", []);
	const [selectedStats, setSelectedStats] = useStoredState<SubStat[]>(resetTrigger, "selectedStats", []);
	const [guaranteedRollsCount, setGuaranteedRollsCount] = useStoredState<number>(resetTrigger, "guaranteedRollsCount", 2);
	const [customGoal, setCustomGoal] = useStoredState<number>(resetTrigger, "customGoal", 0);
	const [requireCount, setRequireCount] = useStoredState<number>(resetTrigger, "requireCount", 0);
	const [required, setRequired] = useStoredState<SubStat[]>(resetTrigger, "required", []);
	const [statWeights, setStatWeights] = useStoredState<Record<SubStat, SingleStatDataInput>>(
		resetTrigger,
		"statWeights",
		() => Object.fromEntries(allSubStats.map(stat => [stat, {}])) as Record<SubStat, SingleStatDataInput>,
		true
	);
	const [acceptEither, setAcceptEither] = useStoredState<boolean>(resetTrigger, "acceptEither", false);
	const [isFiveRoller, setIsFiveRoller] = useStoredState<boolean>(resetTrigger, "isFiveRoller", false);
	const [useAutoGoal, setUseAutoGoal] = useStoredState<boolean>(resetTrigger, "useAutoGoal", true);
	const [includeEqual, setIncludeEqual] = useStoredState<boolean>(resetTrigger, "includeEqual", false);

	const [, setCustomGoalVer] = useState(0);
	const [bestValue, setBestValue] = useState<number | undefined>();
	const [maxValue, setMaxValue] = useState<number | undefined>();
	const [mainProb, setMainProb] = useState<number | undefined>();
	const [subProb, setSubProb] = useState<number | undefined>();
	const [rollProb, setRollProb] = useState<number | undefined>();
	const [probCost, setProbCost] = useState<[number, ComponentChild] | undefined>();
	const [avgRV, setAvgRV] = useState<number | undefined>();
	const [bars, setBars] = useState<[number, boolean][]>([]);

	const mode = modes[modeNum];
	const allLineProb = mode.fixedArtifact ? Number(isFiveRoller) : mode.allLineProb;

	const validStats = mode.fixedArtifact
		? currentStats
		: allSubStats.filter(stat => stat !== mainStat);

	const currentValue = useMemo(() => {
		return roundMaxPrecision(Object.entries(statWeights)
			.filter(([stat]) => validStats.includes(stat as SubStat))
			.reduce((acc, [, { currentRV, weight }]) => acc + (currentRV ?? 0) * (weight ?? 0), 0));
	}, [statWeights, validStats]);

	const logicCurrent = Math.round((useAutoGoal ? currentValue : customGoal) * 100);
	const logicGoal = logicCurrent - (includeEqual ? 0.1 : 0);

	const totalProb = subProb !== undefined && rollProb !== undefined
		? (mainProb ?? 1) * subProb * rollProb
		: undefined;

	useEffect(() => {
		if (useAutoGoal) {
			setCustomGoal(currentValue);
		}
	}, [currentValue, useAutoGoal]);

	useEffect(() => {
		if (totalProb === undefined || mode.output === undefined) {
			setProbCost(undefined);
			return;
		}

		const odds = 1 / totalProb;
		let mult = 1;

		if (mode.output.perArtifact !== undefined) {
			mult = typeof mode.output.perArtifact === "function" ? mode.output.perArtifact(artifactType) : mode.output.perArtifact;
		}

		setProbCost([
			Math.round(odds * mult),
			mode.output.desc ? <abbr title={mode.output.desc}>{mode.output.unit}</abbr> : <span>{mode.output.unit}</span>
		]);
	}, [Number.isNaN(totalProb) ? false : totalProb]);

	useEffect(() => {
		const weights = Object.values(statWeights).filter(w => w.weight !== undefined).map(w => w.weight!);
		weights.sort((a, b) => b - a);

		const top4 = weights.slice(0, 4).reduce((a, b) => a + b, 0) * 100;
		const best = weights[0] * 100;

		setBestValue(top4 + best * 5);

		if (mode.fixedArtifact && !isFiveRoller) {
			setMaxValue(top4 + best * 4);
		} else {
			setMaxValue(undefined);
		}
	}, [statWeights, isFiveRoller, mode.fixedArtifact]);

	const optimizers: Record<StatOptimizers, () => void> = {
		bestStats: () => {
			const baseStatData = getBaseConfig().make();

			let maxStats: null | [SubStat, SubStat] = null;
			let maxProb = -1;

			for (const [stats] of getSubStatCombinations(baseStatData, 2)) {
				const statData = getBaseConfig()
					.guarantee(stats[0])
					.guarantee(stats[1])
					.make();

				const [subStatProb, validCombos] = computeSubProb(statData);
				const rollProb = computeRollProb(statData, validCombos, logicGoal, allLineProb)[0];
				const prob = subStatProb * rollProb;

				if (prob > maxProb) {
					maxStats = stats as [SubStat, SubStat];
					maxProb = prob;
				}
			}

			if (maxStats !== null) {
				setSelectedStats(maxStats);
			}
		},
		bestRolls: () => {
			const baseStatDataConfig = getBaseConfig();

			if (mode.selectedStatCount && !mode.fixedArtifact) {
				for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
					baseStatDataConfig.guarantee(stat);
				}
			}

			if (mode.fixedArtifact) {
				baseStatDataConfig.onlyInclude(currentStats);
			}

			const baseStatData = baseStatDataConfig.make();

			let maxStats: null | [SubStat, SubStat] = null;
			let maxProb = -1;
			let maxAvg = -1;

			for (const [stats] of getSubStatCombinations(baseStatData, 2)) {
				const statDataConfig = getBaseConfig();

				if (mode.selectedStatCount && !mode.fixedArtifact) {
					for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
						statDataConfig.guarantee(stat);
					}
				}

				if (mode.fixedArtifact) {
					statDataConfig.onlyInclude(currentStats);
				}

				const statData = statDataConfig.make();
				const [rollProb, avg] = computeRollProb(statData, [[[...currentStats], 1]], logicGoal, allLineProb, new Set(stats), guaranteedRollsCount);

				if (rollProb > maxProb || (rollProb === maxProb && avg > maxAvg)) {
					maxStats = stats as [SubStat, SubStat];
					maxProb = rollProb;
					maxAvg = avg;
				}
			}

			if (maxStats !== null) {
				setSelectedStats(maxStats);
			}
		}
	};

	const getBaseConfig = () => {
		const statDataConfig = new StatDataConfig();
		statDataConfig.exclude(mainStat);

		for (const [stat, data] of Object.entries(statWeights) as [SubStat, SingleStatDataInput][]) {
			if (data.weight !== undefined) {
				statDataConfig.setWeight(stat, Math.round(data.weight * 100));
			}

			if (data.minRV !== undefined) {
				statDataConfig.setMin(stat, data.minRV);
			}

			if (data.maxRV !== undefined) {
				statDataConfig.setLimit(stat, data.maxRV);
			}
		}

		if (!mode.fixedArtifact && requireCount > 0) {
			statDataConfig.require(requireCount).of(...required);
		}

		return statDataConfig;
	}

	const calculate = () => {
		const statDataConfig = getBaseConfig();
		const guaranteedRollsStats = new Set<SubStat>();
		
		if (mode.selectedStatCount && !mode.fixedArtifact) {
			for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
				statDataConfig.guarantee(stat);
			}
		}

		if (mode.selectedStatCount && mode.fixedArtifact) {
			for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
				guaranteedRollsStats.add(stat);
			}
		}

		if (mode.fixedArtifact) {
			statDataConfig.onlyInclude(currentStats);
		}

		const statData = statDataConfig.make();

		const newMainProb = !mode.fixedArtifact && mode.mainStatUnknown
			? computeMainStatProb(artifactType, mainStat, mode.fromDomain && !acceptEither)
			: undefined;
		setMainProb(newMainProb);

		const [newSubProb, validCombos] = computeSubProb(statData);
		setSubProb(newSubProb);

		const [newRollProb, avg, buckets] = computeRollProb(statData, validCombos, logicGoal, allLineProb, guaranteedRollsStats, guaranteedRollsCount);
		setRollProb(newRollProb);
		setAvgRV(avg);

		const maxBar = Math.max(...buckets);
		const relativeBars = buckets.map(b => [b / maxBar, false] as [number, boolean]);
		const goalBucket = toBucket(logicCurrent);
		relativeBars[goalBucket] = relativeBars[goalBucket] ?? [0, false];
		relativeBars[goalBucket][1] = true;
		setBars(relativeBars);
	};

	return (
		<div>
			<div class="flex flex-wrap gap-4">
				<ToggleButtons
					options={modes.map(mode => mode.name)}
					value={modeNum}
					onChange={setModeNum}
				/>
				<div class="flex flex-1 w-full justify-end">
					<Button onClick={() => resetTrigger.reset()}>Reset</Button>
				</div>
			</div>
			<h2 class="text-xl font-bold my-5">Input</h2>
			<Section>
				<div class="flex gap-2 flex-wrap">
					<label>
						Artifact Type: <select value={artifactType} onChange={(e) => {
							setArtifactType(Number((e.target as HTMLSelectElement).value));

							const newMainStats = Object.keys(mainStats[Number((e.target as HTMLSelectElement).value)].stats);
							if (!newMainStats.includes(mainStat)) {
								setMainStat(newMainStats[0] as AnyStat);
							}
						}}>
							{Object.entries(mainStats).map(([key, { name }]) => (
								<option key={key} value={key}>
									{name}
								</option>
							))}
						</select>
					</label>
					<label>
						Main Stat: <select value={mainStat} onChange={(e) => setMainStat((e.target as HTMLSelectElement).value as AnyStat)}>
							{Object.keys(mainStats[artifactType].stats).map(stat => (
								<option key={stat} value={stat}>
									{stat}
								</option>
							))}
						</select>
					</label>
					{!mode.fixedArtifact && mode.fromDomain && <Checkbox label="Accept either set from the domain" checked={acceptEither} onChange={setAcceptEither} />}
				</div>
				{mode.fixedArtifact && <div class="flex gap-4 mt-4 flex-wrap">
					<div>
						Sub-stats: <StatNamesInput stats={currentStats} count={4} onChange={setCurrentStats} validStats={allSubStats.filter(stat => stat !== mainStat)} />
					</div>
					<Checkbox label="Started with 4 lines" checked={isFiveRoller} onChange={setIsFiveRoller} />
				</div>}
			</Section>
			{mode.fixedArtifact && mode.selectedStatCount > 0 && <Section>
				Guaranteed rolls: <input
					type="number"
					value={guaranteedRollsCount}
					onChange={(e) => setGuaranteedRollsCount(Number((e.target as HTMLInputElement).value))}
					min={2}
					max={4}
				/>
			</Section>}
			{mode.selectedStatCount > 0 && <Section>
				<div class="mb-2">Tip: Run optimize after completing the table below.</div>
				<div class="flex gap-2 items-center flex-wrap">
					<div>
						Selected: <StatNamesInput stats={selectedStats} count={mode.selectedStatCount} onChange={setSelectedStats} validStats={validStats} />
					</div>
					{mode.selectedStatOptimizer && (
						<Button onClick={() => optimizers[mode.selectedStatOptimizer!]()}>Optimize</Button>
					)}
					{mode.selectedStatOptimizer === "bestRolls" && <DocumentLink name="selecting-useless-stats.pdf">Selecting worse substats may be optimal</DocumentLink>}
				</div>
			</Section>}
			<Section>
				<div class="mb-2">
					<details>
						<summary class="cursor-pointer">Column Meanings</summary>
						<ul class="list-disc pl-5 ml-4 my-2">
							<li>
								<b>Weight</b>: Relative worth of each stat. (The "substat priority" %'s from <a href="https://akasha.cv" target="_blank">akasha.cv</a> provide a reasonable estimate.)
							</li>
							<li>
								<b>Current</b>: Current value of the stat.
							</li>
							<li>
								<b>Min</b>: Require at least this much of stat. Implies that the stat is required.
							</li>
							<li>
								<b>Max</b>: Only count up to this much of the stat.
							</li>
						</ul>
					</details>
				</div>
				<StatDataInput entries={statWeights} validStats={validStats} onChange={(stat, entry) => {
					setStatWeights(prev => ({ ...prev, [stat]: entry }));
				}} />
				{bestValue === undefined ? null : <div class="mt-2">
					Current sub-stat & roll quality: <Percentage value={currentValue / bestValue} />
					{maxValue !== undefined && <> (Max: <Percentage value={maxValue / bestValue} />, started with 3 lines)</>}
				</div>}
			</Section>
			<Section>
				<Checkbox label="Use current values for goal" checked={useAutoGoal} onChange={setUseAutoGoal} />
				<div class="mt-2">
					Goal: <input
						type="number"
						class="w-25"
						value={customGoal}
						onChange={(e) => {
							setCustomGoal(round2(+(e.target as HTMLInputElement).value));
							// Update input if value was rounded back to the current value
							setCustomGoalVer(v => v + 1);
						}}
						disabled={useAutoGoal}
						step="any"
					/> % weighted RV
				</div>
			</Section>
			{!mode.fixedArtifact && <Section>
				<div class="mb-2">
					Only roll artifacts that meet these requirements.
				</div>
				<div class="flex gap-2 items-center">
					<span>Require</span>
					<input
						type="number"
						value={requireCount}
						onChange={(e) => setRequireCount(Number((e.target as HTMLInputElement).value))}
						class="w-20"
					/>
					<span>of</span>
					<StatNamesInput stats={required} count={4} onChange={setRequired} validStats={validStats} clearable />
				</div>
			</Section>}
			<Section>
				<div class="flex gap-2 items-center">
					<label>
						<Checkbox label="Include equal" checked={includeEqual} onChange={setIncludeEqual} />
					</label>
					<Button onClick={() => calculate()}>Calculate</Button>
				</div>
			</Section>
			<h2 class="text-xl font-bold my-5">Result</h2>
			<Section>
				<table class="text-left [&_th]:font-normal [&_th]:pr-2">
					<tbody>
						{mainProb !== undefined && <tr>
							<th scope="row">Main stat probability:</th>
							<td><Percentage value={mainProb} /></td>
						</tr>}
						{subProb !== undefined && (
							<tr>
								<th scope="row">Sub-stat probability:</th>
								<td><Percentage value={subProb} /></td>
							</tr>
						)}
						{rollProb !== undefined && (
							<tr>
								<th scope="row">Roll probability:</th>
								<td><Percentage value={rollProb} /></td>
							</tr>
						)}
						{totalProb !== undefined && (
							<tr>
								<th scope="row">Total probability:</th>
								<td><Percentage value={totalProb} />{probCost && <span> &#8776; {probCost[0].toLocaleString()} {probCost[1]}</span>}</td>
							</tr>
						)}
						{[mainProb, subProb, rollProb, totalProb].every(prob => prob === undefined) && (
							<tr>
								<td>Click calculate above to see results!</td>
							</tr>
						)}
					</tbody>
				</table>
			</Section>
			{(avgRV !== undefined || bars.length > 0) && <Section>
				{avgRV !== undefined && <div>Average weighted RV of rolled artifacts: {Math.round(avgRV).toLocaleString()}</div>}
				{bars.length > 0 && <>
					<div class="flex h-40 items-end mt-5">
						{bars.map(([b, isGoal], index) => (
							<div class={`flex h-full flex-1 items-end ${isGoal ? "outline-2 outline-red-600 z-10" : ""}`} key={index}>
								<div class="bg-primary flex-1" style={{ height: `${b * 100}%` }}></div>
							</div>
						))}
					</div>
					<div class="flex">
						<div class="flex-1">0</div>
						<div>{bucketsLimit(bars).toLocaleString()}</div>
					</div>
				</>}
			</Section>}
			<Section>
				<div>
					Logic: <DocumentLink name="calculating-artifact-roll-outcomes.pdf">Overview of Logic</DocumentLink>
				</div>
				<div class="mt-2">
					Distribution viewers: {Object.entries(distributions).map(([key, { name }], i) => (
						<>{i === 0 ? "" : ", "}<a key={key} href={`./?dist=${key}`} target="arp-dist">{name}</a></>
					))}
				</div>
			</Section>
		</div>
	);
}
