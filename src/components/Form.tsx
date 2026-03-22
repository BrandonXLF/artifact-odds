import { allLinesCraftedProb, allLinesDomainProb, allSubStats, AnyStat, mainStats, SubStat } from '../../logic/data';
import { computeMainStatProb } from '../../logic/mainStatProb';
import { StatDataConfig } from '../../logic/StatData';
import { computeRollProb } from '../../logic/subStatDistribution';
import { StatDataInputEntry, StatDataInput } from './StatDataInput';
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
import SimulationWorker from '../../simulator/worker?worker';

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
	allLinesProb: number;
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

export function Form() {
	const resetTrigger = useRef(new ResetTrigger()).current;

	const [modeNum, setModeNum] = useStoredState(undefined, "mode", 0);
	const [artifactType, setArtifactType] = useStoredState(resetTrigger, "artifactType", 0);
	const [mainStat, setMainStat] = useStoredState<AnyStat>(resetTrigger, "mainStat", "HP");
	const [currentStats, setCurrentStats] = useStoredState<SubStat[]>(resetTrigger, "currentStats", []);
	const [selectedStats, setSelectedStats] = useStoredState<SubStat[]>(resetTrigger, "selectedStats", []);
	const [guaranteedRollsCount, setGuaranteedRollsCount] = useStoredState<number>(resetTrigger, "guaranteedRollsCount", 2);
	const [customGoal, setCustomGoal] = useStoredState<number>(resetTrigger, "customGoal", 0);
	const [requireCount, setRequireCount] = useStoredState<number>(resetTrigger, "requireCount", 0);
	const [required, setRequired] = useStoredState<SubStat[]>(resetTrigger, "required", []);
	const [statWeights, setStatWeights] = useStoredState(resetTrigger, "statWeights", () => Object.fromEntries(allSubStats.map(stat => [stat, {}])) as Record<SubStat, StatDataInputEntry>, true);
	const [acceptEither, setAcceptEither] = useStoredState<boolean>(resetTrigger, "acceptEither", false);
	const [isFiveRoller, setIsFiveRoller] = useStoredState<boolean>(resetTrigger, "isFiveRoller", false);
	const [useAutoGoal, setUseAutoGoal] = useStoredState<boolean>(resetTrigger, "useAutoGoal", true);
	const [includeEqual, setIncludeEqual] = useStoredState<boolean>(resetTrigger, "includeEqual", false);
	const [doSimulate, setDoSimulate] = useStoredState<boolean>(resetTrigger, "runMonteCarlo", false);
	const [useRV, setUseRV] = useStoredState<boolean>(resetTrigger, "useRV", false);

	const [, setCustomGoalVer] = useState(0);
	const [bestValue, setBestValue] = useState<number | undefined>();
	const [maxValue, setMaxValue] = useState<number | undefined>();
	const [mainProb, setMainProb] = useState<number | undefined>();
	const [subProb, setSubProb] = useState<number | undefined>();
	const [rollProb, setRollProb] = useState<number | undefined>();
	const [probCost, setProbCost] = useState<[number, ComponentChild] | undefined>();
	const [avgRV, setAvgRV] = useState<number | undefined>();
	const [bars, setBars] = useState<[number, boolean][]>([]);
	const [simulatedProb, setSimulatedProb] = useState<[number, number] | undefined>();
	const [simulationWorker, setSimulationWorker] = useState<Worker | undefined>();
	const [selectedStatsInvalid, setSelectedStatsInvalid] = useState(false);

	const mode = modes[modeNum];
	const allLinesProb = mode.fixedArtifact ? Number(isFiveRoller) : mode.allLinesProb;

	const validStats = mode.fixedArtifact
		? currentStats
		: allSubStats.filter(stat => stat !== mainStat);

	const currentValue = useMemo(() => {
		return roundMaxPrecision(Object.entries(statWeights)
			.filter(([stat]) => validStats.includes(stat as SubStat))
			.reduce((acc, [, { currentRV, weight }]) => acc + (currentRV ?? 0) * (weight ?? 0), 0));
	}, [statWeights, validStats]);

	const calculateRollProb = useMemo(
		() => Object.values(statWeights).some(w => w.weight || w.minRV),
		[statWeights]
	);
	const logicCurrent = Math.round((useAutoGoal ? currentValue : customGoal) * 100);
	const logicGoal = calculateRollProb ? logicCurrent - (Number(includeEqual) / 10) : -Infinity;

	const totalProb = subProb !== undefined || rollProb !== undefined || mainProb !== undefined
		? (mainProb ?? 1) * (subProb ?? 1) * (rollProb ?? 1)
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
		const best = (weights[0] ?? 0) * 100;

		setBestValue(top4 + best * 5);

		if (mode.fixedArtifact && !isFiveRoller) {
			setMaxValue(top4 + best * 4);
		} else {
			setMaxValue(undefined);
		}
	}, [statWeights, isFiveRoller, mode.fixedArtifact]);

	const getBaseConfig = () => {
		const statDataConfig = new StatDataConfig();
		statDataConfig.exclude(mainStat);

		for (const [stat, data] of Object.entries(statWeights) as [SubStat, StatDataInputEntry][]) {
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

		if (mode.fixedArtifact) {
			statDataConfig.onlyInclude(currentStats);
		}

		return statDataConfig;
	};

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
				const rollProb = computeRollProb(statData, validCombos, logicGoal, allLinesProb)[0];
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
			const baseStatData = getBaseConfig().make();

			let maxStats: null | [SubStat, SubStat] = null;
			let maxProb = -1;
			let maxAvg = -1;

			for (const [stats] of getSubStatCombinations(baseStatData, 2)) {
				const statData = getBaseConfig().make();

				const [rollProb, avg] = computeRollProb(
					statData,
					[[[...currentStats], 1]],
					logicGoal,
					allLinesProb,
					new Set(stats),
					guaranteedRollsCount
				);

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

	const calculate = () => {
		const statDataConfig = getBaseConfig();
		const guaranteedRollsStats = new Set<SubStat>();
		
		// Optimization target, can't be included in base
		if (mode.selectedStatCount && !mode.fixedArtifact) {
			for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
				statDataConfig.guarantee(stat);
			}
		}

		// Optimization target, can't be included in base
		if (mode.selectedStatCount && mode.fixedArtifact) {
			for (const stat of selectedStats.slice(0, mode.selectedStatCount)) {
				guaranteedRollsStats.add(stat);
			}
		}

		const statData = statDataConfig.make();

		const newMainProb = !mode.fixedArtifact && mode.mainStatUnknown
			? computeMainStatProb(artifactType, mainStat, mode.fromDomain && !acceptEither)
			: undefined;
		setMainProb(newMainProb);

		const [newSubProb, validCombos] = computeSubProb(statData);
		setSubProb(mode.fixedArtifact ? undefined : newSubProb);

		if (calculateRollProb) {
			const [newRollProb, avg, buckets] = computeRollProb(
				statData,
				validCombos,
				logicGoal,
				allLinesProb,
				guaranteedRollsStats,
				guaranteedRollsCount
			);
			setRollProb(newRollProb);
			setAvgRV(avg);

			const maxBar = Math.max(...buckets);
			const relativeBars = buckets.map(b => [b / maxBar, false] as [number, boolean]);
			const goalBucket = toBucket(logicCurrent);
			relativeBars[goalBucket] = relativeBars[goalBucket] ?? [0, false];
			relativeBars[goalBucket][1] = true;
			setBars(relativeBars);
		} else {
			setRollProb(undefined);
			setAvgRV(undefined);
			setBars([]);
		}

		setSimulationWorker(prev => {
			prev?.terminate();
			if (!doSimulate) return;

			const worker = new SimulationWorker();
			worker.postMessage({
				statData,
				goal: logicGoal,
				allLinesProb,
				fixedStats: mode.fixedArtifact ? currentStats : undefined,
				guaranteedRollsStats,
				guaranteedRollsCount
			});

			worker.addEventListener("message", (event: MessageEvent<[number, number]>) => {
				setSimulatedProb(event.data);
			});

			return worker;
		});

		setSimulatedProb(undefined);
	};

	return (
		<div>
			<div class="flex flex-wrap gap-4">
				<ToggleButtons options={modes.map(mode => mode.name)} value={modeNum} onChange={setModeNum} />
				<div class="flex flex-1 w-full justify-end">
					<Button onClick={() => resetTrigger.reset()}>Reset</Button>
				</div>
			</div>
			<Section class="mt-6">
				<div class="flex gap-4 flex-wrap">
					<label>
						Artifact Type: <select value={artifactType} onChange={(e) => {
							setArtifactType(Number((e.target as HTMLSelectElement).value));

							const newMainStats = Object.keys(mainStats[+(e.target as HTMLSelectElement).value].stats);
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
				{mode.fixedArtifact && <div class="flex flex-wrap gap-4 mt-4">
					<div>
						Sub-stats: <StatNamesInput
							clearable={!mode.fixedArtifact}
							stats={currentStats}
							count={4}
							onChange={setCurrentStats}
							validStats={allSubStats.filter(stat => stat !== mainStat)}
							onValueChange={(stat, value) => setStatWeights(prev => ({ ...prev, [stat]: { ...prev[stat], currentRV: value } }))}
						/>
					</div>
					<Checkbox label="Started with 4 lines" checked={isFiveRoller} onChange={setIsFiveRoller} />
				</div>}
			</Section>
			{mode.selectedStatCount > 0 && <Section>
				<div class="mb-2"><strong>Tip</strong>: Run optimize after completing the sections below to find the best subsets to select.</div>
				{mode.fixedArtifact && <div class="mt-2 mb-3">
					Guaranteed rolls: <ToggleButtons
						options={["2", "3", "4"]}
						value={guaranteedRollsCount - 2}
						onChange={(value) => setGuaranteedRollsCount(value + 2)}
					/>
				</div>}
				<div class="flex gap-2 items-center flex-wrap">
					<div>
						Selected stats: <StatNamesInput
							stats={selectedStats}
							count={mode.selectedStatCount}
							onChange={setSelectedStats}
							validStats={validStats}
							hasKnownError={selectedStatsInvalid}
							onErrorChange={(hasError) => setSelectedStatsInvalid(hasError)}
						/>
					</div>
					{mode.selectedStatOptimizer && (
						<Button onClick={() => optimizers[mode.selectedStatOptimizer!]()}>Optimize</Button>
					)}
					{mode.selectedStatOptimizer === "bestRolls" && <DocumentLink name="selecting-useless-stats.pdf">Selecting worse substats may be optimal</DocumentLink>}
				</div>
			</Section>}
			{!mode.fixedArtifact && <section>
				<h2 class="text-xl font-bold mt-5">Stat Requirements</h2>
				<div class="mt-1">
					Only consider artifacts with these stats.
				</div>
				<Section>
					<div class="flex gap-2 items-center">
						<span>Require</span>
						<input
							type="number"
							value={requireCount}
							onChange={(e) => setRequireCount(Number((e.target as HTMLInputElement).value))}
							class="w-20"
						/>
						<span>of</span>
						<StatNamesInput clearable stats={required} count={4} onChange={setRequired} validStats={validStats} />
					</div>
				</Section>
			</section>}
			<section>
				<h2 class="text-xl font-bold mt-5">Roll Requirements</h2>
				<div class="mt-1">
					Control the relative value of each roll, as well as stat roll limits.{!mode.fixedArtifact && <> Ignored if all weights and min stats are 0.</>}
				</div>
				<div class="mt-1">
					<Checkbox label="Input roll value (RV) instead of stat value" checked={useRV} onChange={setUseRV} />
				</div>
				<Section>
					<details>
						<summary class="cursor-pointer">Column Meanings</summary>
						<ul class="list-disc pl-5 ml-4 my-2">
							<li>
								<strong>Weight</strong>: Relative worth of each stat. <em>Tip</em>: The "substat priority" %'s from <a href="https://akasha.cv" target="_blank">akasha.cv</a> provide a reasonable estimate.
							</li>
							<li>
								<strong>Min Stat</strong>: Require at least this much of stat. Implies that the stat is <em>required</em>.
							</li>
							<li>
								<strong>Max Stat</strong>: Only count up to this much of the stat.
							</li>
						</ul>
					</details>
					<StatDataInput
						entries={statWeights}
						validStats={validStats}
						showCurrentRV={mode.fixedArtifact && useAutoGoal}
						onChange={(stat, entry) => setStatWeights(prev => ({ ...prev, [stat]: entry }))}
						useRV={useRV}
					/>
					{bestValue === undefined ? null : <div class="mt-2">
						Current sub-stat & roll quality: {bestValue === 0 ? "N/A" : <Percentage value={currentValue / bestValue} />}
						{maxValue !== undefined && <> (Max: <Percentage value={maxValue / bestValue} />, started with 3 lines)</>}
					</div>}
				</Section>
				<Section>
					<div class="flex gap-4 flex-wrap">
						<Checkbox label="Use current sub-stats for goal" checked={useAutoGoal} onChange={setUseAutoGoal} />
						<Checkbox label="Include artifacts equal to goal" checked={includeEqual} onChange={setIncludeEqual} />
					</div>
					{useAutoGoal && !mode.fixedArtifact && <div class="mt-4">Current sub-stats: <StatNamesInput
						clearable={!mode.fixedArtifact}
						stats={currentStats}
						count={4}
						onChange={setCurrentStats}
						validStats={allSubStats.filter(stat => stat !== mainStat)}
						statValues={mode.fixedArtifact ? undefined : statWeights}
						useRV={useRV}
						onValueChange={(stat, value) => setStatWeights(prev => ({ ...prev, [stat]: { ...prev[stat], currentRV: value } }))}
					/></div>}
					<div class="mt-4">
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
			</section>
			<section>
				<h2 class="text-xl font-bold my-5">Probability Results</h2>
				<Section>
					<div class="flex gap-4 items-center flex-wrap">
						<Button primary onClick={() => calculate()} disabled={mode.selectedStatCount > 0 && selectedStatsInvalid}>Calculate</Button>
						<div class="flex gap-2 items-center flex-wrap">
							<strong>Advanced:</strong>
							<label>
								<Checkbox label="Run a Monte Carlo simulation as well" checked={doSimulate} onChange={setDoSimulate} />
							</label>
						</div>
					</div>
				</Section>
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
									<td>
										<span class="px-1 py-px" style={{ background: `color-mix(in lab, var(--color-red-700), var(--color-green-700) ${Math.round(totalProb * (!mode.fixedArtifact && mode.mainStatUnknown ? 25 : 1) * 100)}%)` }}>
											<Percentage value={totalProb} />
										</span>{probCost && <span> &#8776; {probCost[0].toLocaleString()} {probCost[1]}</span>}
									</td>
								</tr>
							)}
							{simulatedProb !== undefined && (
								<tr>
									<th scope="row">Simulated probability:</th>
									<td>
										<Percentage value={(mainProb ?? 1) * simulatedProb[0]} /> ({simulatedProb[1].toLocaleString()} runs)
										{simulationWorker &&<button class="link ml-2" onClick={() => {
											setSimulationWorker(prev => {
												prev?.terminate();
												return undefined;
											});
										}}>
											Stop
										</button>}
									</td>
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
					{avgRV !== undefined && <div>Average weighted RV of rolled artifacts: {Math.round(avgRV / 100).toLocaleString()}%</div>}
					{bars.length > 0 && <>
						<div class="flex h-40 items-end mt-5">
							{bars.map(([b, isGoal], index) => (
								<div class={`flex h-full flex-1 items-end ${isGoal ? "outline-2 outline-red-600 z-10" : ""}`} key={index}>
									<div class="bg-primary flex-1" style={{ height: `${b * 100}%` }}></div>
								</div>
							))}
						</div>
						<div class="flex">
							<div class="flex-1">0%</div>
							<div>{(bucketsLimit(bars) / 100).toLocaleString()}%</div>
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
			</section>
		</div>
	);
}
