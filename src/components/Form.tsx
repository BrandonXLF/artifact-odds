import { allLinesCraftedProb, allLinesDomainProb, allSubStats, AnyStat, mainStats, rollValues, statWeights, SubStat } from '../../logic/data';
import { computeMainStatProb } from '../../logic/mainStatProb';
import { StatDataConfig } from '../../logic/StatData';
import { computeRollProb } from '../../logic/subStatDistribution';
import { StatParamInputEntry, StatParamInput } from './StatParamInput';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { StatListInput, StatListInputEntry } from './StatListInput';
import { getSubStatCombinations } from '../../logic/combinations/subStatCombinations';
import { computeSubProb } from '../../logic/subStatProb';
import { Section } from './Section';
import { ToggleButtons } from './ToggleButtonts';
import { Checkbox } from './Checkbox';
import { ComponentChild } from 'preact';
import { toBucket } from '../utils/barChart';
import { DocumentLink } from './DocumentLink';
import { distributions } from '../distributions';
import { round2, roundMaxPrecision } from '../utils/round';
import { Percentage } from './Percentage';
import { Button } from './Button';
import SimulationWorker from '../../simulator/worker?worker';
import { ResetTrigger, useResettableState, useStoredState } from '../utils/resettableState';
import { SimulationOutput } from './SimulationOutput';
import { LabelGrid } from './LabelGrid';

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

type StatParams = StatParamInputEntry & StatListInputEntry;

export function Form() {
	const resetTrigger = useRef(new ResetTrigger()).current;

	const [modeNum, setModeNum] = useStoredState<number>("mode", 0);
	const [artifactType, setArtifactType] = useStoredState<number>("artifactType", 0, resetTrigger);
	const [mainStat, setMainStat] = useStoredState<AnyStat>("mainStat", "HP", resetTrigger);
	const [currentStats, setCurrentStats] = useStoredState<SubStat[]>("currentStats", () => [], resetTrigger);
	const [selectedStats, setSelectedStats] = useStoredState<SubStat[]>("selectedStats", () => [], resetTrigger);
	const [guaranteedRollsCount, setGuaranteedRollsCount] = useStoredState<number>("guaranteedRollsCount", 2, resetTrigger);
	const [customGoal, setCustomGoal] = useStoredState<number>("customGoal", 0, resetTrigger);
	const [requireCount, setRequireCount] = useStoredState<number>("requireCount", 0, resetTrigger);
	const [required, setRequired] = useStoredState<SubStat[]>("required", () => [], resetTrigger);
	const [statParams, setStatParams] = useStoredState(
		"statWeights",
		() => Object.fromEntries(allSubStats.map(stat => [stat, {}])) as Record<SubStat, StatParams>,
		resetTrigger,
		true
	);
	const [acceptEither, setAcceptEither] = useStoredState<boolean>("acceptEither", false, resetTrigger);
	const [isFiveRoller, setIsFiveRoller] = useStoredState<boolean>("isFiveRoller", false, resetTrigger);
	const [useAutoGoal, setUseAutoGoal] = useStoredState<boolean>("useAutoGoal", true, resetTrigger);
	const [includeEqual, setIncludeEqual] = useStoredState<boolean>("includeEqual", false, resetTrigger);
	const [doSimulate, setDoSimulate] = useStoredState<boolean>("runMonteCarlo", false, resetTrigger);
	const [useRV, setUseRV] = useStoredState<boolean>("useRV", false, resetTrigger);

	const [allOptimalPairs, setAllOptimalPairs] = useResettableState<[SubStat, SubStat][]>(() => [], resetTrigger);
	const [mainProb, setMainProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [subProb, setSubProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [rollProb, setRollProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [probCost, setProbCost] = useResettableState<[number, ComponentChild] | undefined>(undefined, resetTrigger);
	const [totalProbQualityFactor, setTotalProbQualityFactor] = useResettableState<number>(1, resetTrigger);
	const [overwhelminglyLikely, setOverwhelminglyLikely] = useResettableState<boolean>(false, resetTrigger);
	const [avgRV, setAvgRV] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [bars, setBars] = useResettableState<[number, boolean][]>([], resetTrigger);
	const [simulationWorker, setSimulationWorker] = useResettableState<Worker | undefined>(undefined, resetTrigger);
	const [simulationVer, setSimulationVer] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [selectedStatsInvalid, setSelectedStatsInvalid] = useResettableState<boolean | undefined>(undefined, resetTrigger);

	const [, setCustomGoalVer] = useState(0);

	const mode = modes[modeNum];
	const allLinesProb = mode.fixedArtifact ? Number(isFiveRoller) : mode.allLinesProb;
	const validStats = mode.fixedArtifact
		? currentStats
		: allSubStats.filter(stat => stat !== mainStat);

	const currentValue = useMemo(() => {
		return roundMaxPrecision(Object.entries(statParams)
			.filter(([stat]) => currentStats.includes(stat as SubStat))
			.reduce((acc, [, { currentRV, weight }]) => acc + (currentRV ?? 0) * (weight ?? 0), 0));
	}, [statParams, validStats]);

	const showMainProb = !mode.fixedArtifact && mode.mainStatUnknown;
	const showSubProb = !mode.fixedArtifact;
	const calcRollProb = useMemo(
		() => mode.fixedArtifact || Object.values(statParams).some(w => w.weight || w.minRV),
		[statParams, mode.fixedArtifact]
	);
	const totalProb = subProb !== undefined || rollProb !== undefined || mainProb !== undefined
		? (mainProb ?? 1) * (subProb ?? 1) * (rollProb ?? 1)
		: undefined;

	const logicCurrent = Math.round((useAutoGoal ? currentValue : customGoal) * 100);
	const logicGoal = calcRollProb ? logicCurrent - (Number(includeEqual) / 10) : -Infinity;

	const sortedValidWeights = useMemo(
		() => Object.entries(statParams)
			.filter(([stat]) => validStats.includes(stat as SubStat))
			.map(([stat, w]) => [stat, w.weight ?? 0] as [SubStat, number])
			.sort((a, b) => (b[1] - a[1])),
		[statParams, validStats]
	);

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

		setTotalProbQualityFactor(!mode.fixedArtifact && mode.mainStatUnknown ? 35 : 1)
	}, [Number.isNaN(totalProb) ? false : totalProb]);

	const [maxTheoretical, maxAttainable] = useMemo(() => {
		if (sortedValidWeights.length === 0 || sortedValidWeights[0]?.[1] === 0) {
			return [undefined, undefined];
		}

		const top4 = sortedValidWeights.slice(0, 4).reduce((acc, [_, w]) => acc + w, 0) * 100;
		const best = (sortedValidWeights[0]?.[1] ?? 0) * 100;
		const max = top4 + best * 5;

		if (mode.fixedArtifact && !isFiveRoller) {
			return [max, top4 + best * 4];
		}

		return [max, max];
	}, [sortedValidWeights, isFiveRoller, mode.fixedArtifact]);

	useEffect(
		() => setAllOptimalPairs([]),
		// All dependencies of calculate() besides selectedStats
		[
			mainStat,
			mode,
			required,
			requireCount,
			currentStats,
			statParams,
			artifactType,
			acceptEither,
			allLinesProb,
			logicGoal,
			guaranteedRollsCount
		]
	);

	const getBaseConfig = () => {
		const statDataConfig = new StatDataConfig();
		statDataConfig.exclude(mainStat);

		if (!mode.fixedArtifact && requireCount > 0) {
			statDataConfig.require(requireCount).of(...required);
		}

		if (mode.fixedArtifact) {
			statDataConfig.onlyInclude(currentStats);
		}

		for (const [stat, data] of Object.entries(statParams) as [SubStat, StatParamInputEntry][]) {
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

		return statDataConfig;
	};

	const optimizers: Record<StatOptimizers, () => void> = {
		bestStats: () => {
			const baseStatData = getBaseConfig().make();

			let maxStats: [SubStat, SubStat][] = [];
			let maxProb = -1;

			for (const [stats] of getSubStatCombinations(baseStatData, 2)) {
				const statData = getBaseConfig()
					.guarantee(stats[0])
					.guarantee(stats[1])
					.make();

				const [subStatProb, validCombos] = computeSubProb(statData);
				const rollProb = computeRollProb(statData, validCombos, logicGoal, allLinesProb)[0];
				const prob = subStatProb * rollProb;

				// Note: This is far larger than the minimum difference between actual probabilities
				if (prob - maxProb > 4 * Number.EPSILON) {
					maxStats = [stats as [SubStat, SubStat]];
					maxProb = prob;
				} else if (Math.abs(prob - maxProb) <= 4 * Number.EPSILON) {
					maxStats.push(stats as [SubStat, SubStat]);
				}
			}

			if (maxStats.length) {
				setSelectedStats(maxStats[0]);
				setAllOptimalPairs(maxStats);
			}
		},
		bestRolls: () => {
			const baseStatData = getBaseConfig().make();

			let maxStatsAndAvg: [SubStat, SubStat, number][] = [];
			let maxProb = -1;

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

				// Note: This is far larger than the minimum difference between actual probabilities
				if (rollProb - maxProb > 4 * Number.EPSILON) {
					maxStatsAndAvg = [[...stats, avg] as [SubStat, SubStat, number]];
					maxProb = rollProb;
				} else if (Math.abs(rollProb - maxProb) <= 4 * Number.EPSILON) {
					maxStatsAndAvg.push([...stats, avg] as [SubStat, SubStat, number]);
				}
			}

			maxStatsAndAvg.sort((a, b) => b[2] - a[2]); // Sort by average RV descending
			const maxStats = maxStatsAndAvg.map(([s1, s2]) => [s1, s2] as [SubStat, SubStat]);

			if (maxStats.length) {
				setSelectedStats(maxStats[0]);
				setAllOptimalPairs(maxStats);
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

		const newMainProb = showMainProb
			? computeMainStatProb(artifactType, mainStat, mode.fromDomain && !acceptEither)
			: undefined;
		setMainProb(newMainProb);

		const [newSubProb, validCombos] = computeSubProb(statData);
		setSubProb(showSubProb ? newSubProb : undefined);

		if (calcRollProb) {
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
			const goalBucket = Math.min(buckets.length - 1, toBucket(logicCurrent, statData.maxWeight));
			relativeBars[goalBucket] = relativeBars[goalBucket] ?? [0, false];
			relativeBars[goalBucket][1] = true;
			setBars(relativeBars);
		} else {
			setRollProb(undefined);
			setAvgRV(undefined);
			setBars([]);
		}

		if (doSimulate) {
			setSimulationVer(prev => (prev ?? 0) + 1);
			setSimulationWorker(prev => {
				prev?.terminate();

				const worker = new SimulationWorker();
				worker.postMessage({
					statData,
					goal: logicGoal,
					allLinesProb,
					fixedStats: mode.fixedArtifact ? currentStats : undefined,
					guaranteedRollsStats,
					guaranteedRollsCount
				});

				return worker;
			});
		} else {
			setSimulationVer(undefined);
			setSimulationWorker(undefined);
		}

		checkIfOverwhelminglyLikely();
	};

	const checkIfOverwhelminglyLikely = () => {
		// - No other stat can replace max stat rolls
		// - No other stat can replace top 4 as defaults
		if (
			maxAttainable !== undefined &&
			sortedValidWeights[0][1] > sortedValidWeights[1][1] &&
			(sortedValidWeights.length < 5 || sortedValidWeights[3][1] > sortedValidWeights[4][1])
		) {
			const secondBest = maxAttainable - (
				sortedValidWeights[3][1] *
					(rollValues[rollValues.length - 1] - rollValues[rollValues.length - 2])
			);

			// - Goal is better than the second best possibility
			// - Weights are as small as possible
			if (
				secondBest * 100 <= logicGoal &&
				sortedValidWeights.slice(0, 4).reduce((acc, [_, w]) => acc + w, 0) <=
					validStats.map(s => statWeights[s]).sort((a, b) => b - a).slice(0, 4).reduce((acc, w) => acc + w, 0)
			) {
				setOverwhelminglyLikely(true);
				return;
			}
		}

		setOverwhelminglyLikely(false);
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
				<LabelGrid>
					<div>
						<div>
							Artifact Type:
						</div>
						<div class="inline-flex gap-4 flex-wrap">
							<label>
								<select value={artifactType} onChange={(e) => {
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
							{mode.fixedArtifact && <Checkbox label="Started with 4 lines" checked={isFiveRoller} onChange={setIsFiveRoller} />}
						</div>
					</div>
					{mode.fixedArtifact && <div>
						<div>
							Sub-stats:
						</div>
						<div class="flex flex-col gap-2">
							<StatListInput
								clearable={!mode.fixedArtifact}
								stats={currentStats}
								count={4}
								onChange={setCurrentStats}
								validStats={allSubStats.filter(stat => stat !== mainStat)}
								statValues={mode.fixedArtifact && useAutoGoal ? statParams : undefined}
								onValueChange={(stat, value) => setStatParams(prev => ({ ...prev, [stat]: { ...prev[stat], currentRV: value } }))}
							/>
						</div>
					</div>}
				</LabelGrid>
			</Section>
			{mode.selectedStatCount > 0 && <Section>
				<div class="mb-2"><strong>Tip</strong>: Run optimize after completing the sections below to find the best subsets to select.</div>
				<LabelGrid>
					{mode.fixedArtifact && <div>
						<div>
							Guaranteed rolls:
						</div>
						<div>
							<ToggleButtons
								options={["2", "3", "4"]}
								value={guaranteedRollsCount - 2}
								onChange={(value) => setGuaranteedRollsCount(value + 2)}
							/>
						</div>
					</div>}
					<div>
						<div>
							Selected stats:
						</div>
						<div class="flex gap-2 items-center flex-wrap">
							<StatListInput
								stats={selectedStats}
								count={mode.selectedStatCount}
								onChange={setSelectedStats}
								validStats={validStats}
								hasKnownError={selectedStatsInvalid}
								onErrorChange={(hasError) => setSelectedStatsInvalid(hasError)}
							/>
							{mode.selectedStatOptimizer && (
								<Button onClick={() => optimizers[mode.selectedStatOptimizer!]()}>Optimize</Button>
							)}
							{mode.selectedStatOptimizer === "bestRolls" && <DocumentLink name="selecting-useless-stats.pdf">Selecting worse substats may be optimal</DocumentLink>}
						</div>
					</div>
					{allOptimalPairs.length > 1 && <div>
						<div>
							All optimal pairs:
						</div>
						<div class="flex gap-x-4 gap-y-1 items-center overflow-auto">
							{allOptimalPairs.map(([s1, s2], i) => (
								<button key={i} onClick={() => setSelectedStats([s1, s2])} class="shrink-0 underline">
									{s1} + {s2}
								</button>
							))}
						</div>
					</div>}
				</LabelGrid>
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
						<StatListInput clearable stats={required} count={4} onChange={setRequired} validStats={validStats} />
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
					<StatParamInput
						entries={statParams}
						validStats={validStats}
						onChange={(stat, entry) => setStatParams(prev => ({ ...prev, [stat]: entry }))}
						useRV={useRV}
					/>
					{!useAutoGoal || maxTheoretical === undefined ? null : <div class="mt-2">
						Current sub-stat & roll quality: <Percentage value={currentValue / maxTheoretical} />
						{maxAttainable !== undefined && <> (Max: <Percentage value={maxAttainable / maxTheoretical} />, started with 3 lines)</>}
					</div>}
				</Section>
				<Section>
					<div class="flex gap-x-5 gap-y-2 flex-wrap mb-4">
						<Checkbox label="Use current sub-stats for goal" checked={useAutoGoal} onChange={setUseAutoGoal} />
						<Checkbox label="Include artifacts equal to goal" checked={includeEqual} onChange={setIncludeEqual} />
					</div>
					<LabelGrid>
						{useAutoGoal && !mode.fixedArtifact && <div>
							<div>Current sub-stats:</div>
							<StatListInput
								clearable={!mode.fixedArtifact}
								stats={currentStats}
								count={4}
								onChange={setCurrentStats}
								validStats={allSubStats.filter(stat => stat !== mainStat)}
								useRV={useRV}
								statValues={mode.fixedArtifact ? undefined : statParams}
								onValueChange={(stat, value) => setStatParams(prev => ({ ...prev, [stat]: { ...prev[stat], currentRV: value } }))}
							/>
						</div>}
						<div>
							<div>Goal:</div>
							<div>
								<input
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
								/> % weighted RV (Max: {maxAttainable === undefined ? "?" : <Percentage value={maxAttainable / 100} />})
							</div>
						</div>
					</LabelGrid>
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
					<LabelGrid tight>
						{showMainProb && <div>
							<div>Main stat probability:</div>
							<div><Percentage value={mainProb} /></div>
						</div>}
						{showSubProb && <div>
							<div>Sub-stat probability:</div>
							<div><Percentage value={subProb} /></div>
						</div>}
						{calcRollProb && <div>
							<div>Roll probability:</div>
							<div><Percentage value={rollProb} /></div>
						</div>}
						<div>
							<div>Total probability:</div>
							<div>
								<Percentage
									value={totalProb}
									showQuality={totalProbQualityFactor}
								/>{
									probCost && <span> &#8776; {probCost[0].toLocaleString()} {probCost[1]}</span>
								}
							</div>
						</div>
						{totalProb !== undefined && totalProb !== 0 && overwhelminglyLikely && <div>
							<div></div>
							<div class="flex gap-2 items-center">
								<img src="./nah-id-win.png" class="h-4" /> Nah, I'd win
							</div>
						</div>}
						{simulationVer !== undefined && <div>
							<div>Simulated probability:</div>
							<div>
								<SimulationOutput
									key={simulationVer}
									mainProb={mainProb}
									worker={simulationWorker}
									onTerminate={() => setSimulationWorker(prev => {
										prev?.terminate();
										return undefined;
									})}
								/>
							</div>
						</div>}
					</LabelGrid>
				</Section>
				{(avgRV !== undefined || bars.length > 0) && <Section>
					{avgRV !== undefined && <div>Average weighted RV of rolled artifacts: {Math.round(avgRV / 100).toLocaleString()}%</div>}
					{bars.length > 0 && <>
						<div class="flex h-40 items-end mt-5 max-h-[30vw]">
							{bars.map(([b, isGoal], index) => (
								<div class={`flex h-full flex-1 items-end ${isGoal ? "outline-2 outline-red-600 z-10" : ""}`} key={index}>
									<div class="bg-primary flex-1" style={{ height: `${b * 100}%` }}></div>
								</div>
							))}
						</div>
						<div class="flex">
							<div class="flex-1">0%</div>
							<div>{(maxAttainable ?? 0).toLocaleString()}%</div>
						</div>
					</>}
				</Section>}
				<Section>
					<LabelGrid tight>
						<div>
							<div>Logic:</div>
							<div>
								<DocumentLink name="calculating-artifact-roll-outcomes.pdf">Overview of Logic</DocumentLink>
							</div>
						</div>
						<div>
							<div>Distribution viewers:</div>
							<div>
								{Object.entries(distributions).map(([key, { name }], i) => (
									<>{i === 0 ? "" : ", "}<a key={key} href={`./?dist=${key}`} target="arp-dist">{name}</a></>
								))}
							</div>
						</div>
					</LabelGrid>
				</Section>
			</section>
		</div>
	);
}
