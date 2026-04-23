import { computeMainStatProb } from '../../../logic/mainStatProb';
import { StatDataConfig } from '../../../logic/data/StatData';
import { computeRollProb } from '../../../logic/subStatDistribution';
import { StatParamInputEntry, StatParamInput } from '../input/StatParamInput';
import { useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'preact/hooks';
import { StatListInput, StatListInputEntry } from '../input/StatListInput';
import { getSubStatCombinations } from '../../../logic/combinations/subStatCombinations';
import { computeSubProb } from '../../../logic/subStatProb';
import { VisualSection } from '../structure/VisualSection';
import { ToggleButtons } from '../input/ToggleButtons';
import { Checkbox } from '../input/Checkbox';
import { toBucket } from '../../../logic/utils/barChart';
import { DocumentLink } from '../misc/DocumentLink';
import { round2, roundMaxPrecision } from '../../utils/round';
import { Percentage } from '../output/Percentage';
import { Button } from '../input/Button';
import SimulationWorker from '../../../simulator/worker?worker';
import { ResetTrigger, useResettableState, useStoredState } from '../../utils/resettableState';
import { SimulationOutput } from '../output/SimulationOutput';
import { LabelGrid } from '../structure/LabelGrid';
import { LogicSection } from './LogicSection';
import { RVGraph } from '../output/RVGraph';
import { StatOptimizers } from '../../data/modes';
import { Import } from './Import';
import { LOWER_ROLL_COUNT, SUB_STAT_COUNT, UPPER_ROLL_COUNT } from '../../data/consts';
import RollRestrictions from '../../../logic/data/RollRestrictions';
import { Ref } from 'preact';
import { FormContext } from '../../contexts/FormContext';
import { GameContext } from '../../contexts/GameContext';
import { factorial } from '../../utils/factorial';
import { NumberDisplay } from '../output/NumberDisplay';

type StatParams = StatParamInputEntry & StatListInputEntry;

export type FormHandle = {
	reset: () => void;
}

export function Form(props: Readonly<{ formRef: Ref<FormHandle> }>) {
	const resetTrigger = useRef(new ResetTrigger()).current;
	const { gameData } = useContext(GameContext);
	const { mode } = useContext(FormContext)!;

	useImperativeHandle(props.formRef, () => {
		return {
			reset: () => resetTrigger.reset()
		}
	}, [resetTrigger]);

	// Form state
	const [showImport, setShowImport] = useStoredState<boolean>("importingUID", false, resetTrigger);

	// User input
	const [artifactType, setArtifactType] = useStoredState<number>("artifactType", 0, resetTrigger);
	const [mainStat, setMainStat] = useStoredState<string>("mainStat", "HP", resetTrigger);
	const [currentStats, setCurrentStats] = useStoredState<string[]>("currentStats", () => [], resetTrigger);
	const [selectedStats, setSelectedStats] = useStoredState<string[]>("selectedStats", () => [], resetTrigger);
	const [rawSelectedStatCount, setRawSelectedStatCount] = useStoredState<number>("selectedStatCount", 0, resetTrigger);
	const [rawGuaranteedRollsCount, setRawGuaranteedRollsCount] = useStoredState<number>("guaranteedRollsCount", 2, resetTrigger);
	const [customGoal, setCustomGoal] = useStoredState<number>("customGoal", 0, resetTrigger);
	const [requireCount, setRequireCount] = useStoredState<number>("requireCount", 0, resetTrigger);
	const [required, setRequired] = useStoredState<string[]>("required", () => [], resetTrigger);
	const [statParams, setStatParams] = useStoredState(
		"statWeights",
		() => Object.fromEntries(gameData.stats.map(stat => [stat, {}])) as Record<string, StatParams>,
		resetTrigger,
		true
	);
	const [acceptEither, setAcceptEither] = useStoredState<boolean>("acceptEither", false, resetTrigger);
	const [isFiveRoller, setIsFiveRoller] = useStoredState<boolean>("isFiveRoller", false, resetTrigger);
	const [useAutoGoal, setUseAutoGoal] = useStoredState<boolean>("useAutoGoal", true, resetTrigger);
	const [includeEqual, setIncludeEqual] = useStoredState<boolean>("includeEqual", false, resetTrigger);
	const [doSimulate, setDoSimulate] = useStoredState<boolean>("runMonteCarlo", false, resetTrigger);
	const [useRV, setUseRV] = useStoredState<boolean>("useRV", false, resetTrigger);

	// Input feedback
	const [selectedStatsInvalid, setSelectedStatsInvalid] = useResettableState<boolean | undefined>(undefined, resetTrigger);
	const [allOptimalPairs, setAllOptimalPairs] = useResettableState<string[][]>(() => [], resetTrigger);

	// Results
	const [mainProb, setMainProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [subProb, setSubProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [rollProb, setRollProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [overwhelminglyLikely, setOverwhelminglyLikely] = useResettableState<boolean>(false, resetTrigger);
	const [avgRV, setAvgRV] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [maxRV, setMaxRV] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [bars, setBars] = useResettableState<[number, boolean][]>([], resetTrigger);
	const [simulationWorker, setSimulationWorker] = useResettableState<Worker | undefined>(undefined, resetTrigger);
	const [simulationVer, setSimulationVer] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [total, setTotal] = useResettableState<number | undefined>(undefined, resetTrigger);

	// Non-resettable
	const [, setCustomGoalVer] = useState(0);

	const allLinesProb = mode.fixedArtifact ? Number(isFiveRoller) : mode.allLinesProb;
	const validStats = mode.fixedArtifact
		? currentStats
		: gameData.stats.filter(stat => stat !== mainStat);

	const currentValue = useMemo(
		() => roundMaxPrecision(
			Object.entries(statParams)
				.filter(([stat]) => currentStats.includes(stat))
				.reduce((acc, [, { currentRV, weight }]) => acc + (currentRV ?? 0) * (weight ?? 0), 0)
		),
		[statParams, validStats]
	);
	const goalValue = useAutoGoal ? currentValue : customGoal;

	const showMainProb = !mode.fixedArtifact && mode.mainStatUnknown;
	const showSubProb = !mode.fixedArtifact;
	const calcRollProb = useMemo(
		() => mode.fixedArtifact || Object.values(statParams).some(w => w.weight || w.minRV),
		[statParams, mode.fixedArtifact]
	);
	const totalProb = subProb !== undefined || rollProb !== undefined || mainProb !== undefined
		? (mainProb ?? 1) * (subProb ?? 1) * (rollProb ?? 1)
		: undefined;

	const logicBaseGoal = Math.round(goalValue * 100);
	const logicGoal = calcRollProb ? logicBaseGoal - (Number(includeEqual) / 10) : -Infinity;

	const sortedValidWeights = useMemo(
		() => Object.entries(statParams)
			.filter(([stat]) => validStats.includes(stat))
			.map(([stat, w]) => [stat, w.weight ?? 0] as [string, number])
			.sort((a, b) => (b[1] - a[1])),
		[statParams, validStats]
	);

	const dynamicMode = useMemo(() => ({
		selectedStatCount: typeof mode.selectedStatCount === "number"
			? mode.selectedStatCount
			: rawSelectedStatCount,
		guaranteedRollsCount: mode.fixedArtifact && !mode.selectToIgnore
			? (typeof mode.guaranteedCount === "number" ? mode.guaranteedCount : rawGuaranteedRollsCount)
			: 0
	}), [mode, rawSelectedStatCount, rawGuaranteedRollsCount]);

	const getModeProb = useCallback(<T,>(prop: T | ((artifactType: number, selectedStatCount: number) => T)) => {
		return typeof prop === "function"
			? (prop as (artifactType: number, selectedStatCount: number) => T)(
				artifactType,
				dynamicMode.selectedStatCount
			)
			: prop;
	}, [artifactType, dynamicMode.selectedStatCount]);

	const probCost = useMemo(() => {
		if (totalProb === undefined || mode.output === undefined) {
			return undefined;
		}

		const odds = 1 / totalProb;
		const mult = getModeProb(mode.output.perArtifact ?? 1);

		return Math.round(odds * mult);
	}, [totalProb, mode]);

	const [maxTheoretical, maxAttainable] = useMemo(() => {
		if (sortedValidWeights.length === 0 || sortedValidWeights[0]?.[1] === 0) {
			return [undefined, undefined];
		}

		const top4 = sortedValidWeights.slice(0, SUB_STAT_COUNT).reduce((acc, [_, w]) => acc + w, 0) * 100;
		const best = (sortedValidWeights[0]?.[1] ?? 0) * 100;
		const max = top4 + best * UPPER_ROLL_COUNT;

		if (mode.fixedArtifact && !isFiveRoller) {
			return [max, top4 + best * LOWER_ROLL_COUNT];
		}

		return [max, max];
	}, [sortedValidWeights, isFiveRoller, mode.fixedArtifact]);

	useEffect(() => {
		setMainProb(undefined);
		setSubProb(undefined);
		setRollProb(undefined);
		setOverwhelminglyLikely(false);
		setAvgRV(undefined);
		setMaxRV(undefined);
		setBars([]);
		setSimulationWorker(undefined);
		setSimulationVer(undefined);
		setTotal(undefined);

		if (Array.isArray(mode.selectedStatCount) && !mode.selectedStatCount.includes(rawSelectedStatCount)) {
			setRawSelectedStatCount(mode.selectedStatCount[0]);
		}

		if (mode.fixedArtifact &&
			!mode.selectToIgnore &&
			Array.isArray(mode.guaranteedCount) &&
			!mode.guaranteedCount.includes(rawGuaranteedRollsCount)
		) {
			setRawGuaranteedRollsCount(mode.guaranteedCount[0]);
		}
	}, [mode]);

	useEffect(() => {
		if (useAutoGoal) {
			setCustomGoal(currentValue);
		}
	}, [currentValue, useAutoGoal]);

	useEffect(
		() => setAllOptimalPairs([]),
		// All dependencies of calculate() besides selectedStats
		[
			mainStat,
			mode,
			dynamicMode,
			required,
			requireCount,
			currentStats,
			statParams,
			artifactType,
			acceptEither,
			allLinesProb,
			logicGoal
		]
	);

	const getBaseConfig = () => {
		const statDataConfig = new StatDataConfig(gameData.stats, gameData.statWeights, gameData.rollValues);
		statDataConfig.exclude(mainStat);

		if (!mode.fixedArtifact && requireCount > 0) {
			statDataConfig.require(requireCount).of(...required);
		}

		if (mode.fixedArtifact) {
			statDataConfig.onlyInclude(currentStats);
		}

		for (const [stat, data] of Object.entries(statParams) as [string, StatParamInputEntry][]) {
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

	const makeRollRestrictions = (
		allLineProb: number,
		guaranteedStats: Set<string> = new Set(),
		guaranteedCount: number = 0,
		unrollableStats: Set<string> = new Set()
	) => {
		return new RollRestrictions(
			SUB_STAT_COUNT,
			LOWER_ROLL_COUNT,
			UPPER_ROLL_COUNT,
			allLineProb,
			guaranteedStats,
			guaranteedCount,
			unrollableStats
		);
	}

	const optimizers: Record<StatOptimizers, () => void> = {
		bestStats: () => {
			const statData = getBaseConfig().make();
			const rollRestrictions = makeRollRestrictions(allLinesProb);

			let maxStats: [string, string][] = [];
			let maxProb = -1;

			for (const [stats] of getSubStatCombinations(statData, dynamicMode.selectedStatCount)) {
				const statData = getBaseConfig()
					.guarantee(stats[0])
					.guarantee(stats[1])
					.make();

				const [subStatProb, validCombos] = computeSubProb(statData, SUB_STAT_COUNT);
				const rollProb = computeRollProb(statData, rollRestrictions, validCombos, logicGoal)[0];
				const prob = subStatProb * rollProb;

				// Note: This is far larger than the minimum difference between actual probabilities
				if (prob - maxProb > 4 * Number.EPSILON) {
					maxStats = [stats as [string, string]];
					maxProb = prob;
				} else if (Math.abs(prob - maxProb) <= 4 * Number.EPSILON) {
					maxStats.push(stats as [string, string]);
				}
			}

			if (maxStats.length) {
				setSelectedStats(maxStats[0]);
				setAllOptimalPairs(maxStats);
			}
		},
		bestRolls: () => {
			const baseStatData = getBaseConfig().onlyInclude(currentStats).make();

			let maxStatsAndAvg: [string, string, number][] = [];
			let maxProb = -1;

			for (const [stats] of getSubStatCombinations(baseStatData, 2)) {
				const statData = getBaseConfig().make();

				const [rollProb, avg] = computeRollProb(
					statData,
					makeRollRestrictions(allLinesProb, new Set(stats), dynamicMode.guaranteedRollsCount),
					[[[...currentStats], 1]],
					logicGoal
				);

				// Note: This is far larger than the minimum difference between actual probabilities
				if (rollProb - maxProb > 4 * Number.EPSILON) {
					maxStatsAndAvg = [[...stats, avg] as [string, string, number]];
					maxProb = rollProb;
				} else if (Math.abs(rollProb - maxProb) <= 4 * Number.EPSILON) {
					maxStatsAndAvg.push([...stats, avg] as [string, string, number]);
				}
			}

			maxStatsAndAvg.sort((a, b) => b[2] - a[2]); // Sort by average RV descending
			const maxStats = maxStatsAndAvg.map(([s1, s2]) => [s1, s2] as [string, string]);

			if (maxStats.length) {
				setSelectedStats(maxStats[0]);
				setAllOptimalPairs(maxStats);
			}
		},
		bestToIgnore: () => {
			const statData = getBaseConfig().make();

			let maxStatAndAvg: [string, number][] = [];
			let maxProb = -1;

			for (const stat of currentStats) {
				const [rollProb, avg] = computeRollProb(
					statData,
					makeRollRestrictions(allLinesProb, undefined, undefined, new Set([stat])),
					[[[...currentStats], 1]],
					logicGoal
				);

				// Note: This is far larger than the minimum difference between actual probabilities
				if (rollProb - maxProb > 4 * Number.EPSILON) {
					maxStatAndAvg = [[stat, avg] as [string, number]];
					maxProb = rollProb;
				} else if (Math.abs(rollProb - maxProb) <= 4 * Number.EPSILON) {
					maxStatAndAvg.push([stat, avg] as [string, number]);
				}
			}

			maxStatAndAvg.sort((a, b) => b[1] - a[1]); // Sort by average RV descending
			const maxStats = maxStatAndAvg.map(([s]) => [s] as [string]);

			if (maxStats.length) {
				setSelectedStats(maxStats[0]);
				setAllOptimalPairs(maxStats);
			}
		}
	};

	const calculate = () => {
		const statDataConfig = getBaseConfig();
		const guaranteedRollsStats = new Set<string>();
		const unrollableStats = new Set<string>();
		
		// Optimization target, can't be included in base
		if (dynamicMode.selectedStatCount && !mode.fixedArtifact) {
			for (const stat of selectedStats.slice(0, dynamicMode.selectedStatCount)) {
				statDataConfig.guarantee(stat);
			}
		}

		// Optimization target, can't be included in base
		if (dynamicMode.selectedStatCount && mode.fixedArtifact && !mode.selectToIgnore) {
			for (const stat of selectedStats.slice(0, dynamicMode.selectedStatCount)) {
				guaranteedRollsStats.add(stat);
			}
		}

		// Optimization target, can't be included in base
		if (dynamicMode.selectedStatCount && mode.fixedArtifact && mode.selectToIgnore) {
			for (const stat of selectedStats.slice(0, dynamicMode.selectedStatCount)) {
				unrollableStats.add(stat);
			}
		}

		const newMainProb = showMainProb
			? computeMainStatProb(gameData.mainStats, artifactType, mainStat, mode.fromDomain && !acceptEither)
			: undefined;
		setMainProb(newMainProb);

		const statData = statDataConfig.make();
		const [newSubProb, validCombos, totalComboCount] = computeSubProb(statData, SUB_STAT_COUNT);
		setSubProb(showSubProb ? newSubProb : undefined);

		// Every combination corresponds to SUB_STAT_COUNT! permutations unless fixed
		let total = totalComboCount * (mode.fixedArtifact ? 1 : factorial(SUB_STAT_COUNT));

		const rollRestrictions = makeRollRestrictions(
			allLinesProb,
			guaranteedRollsStats,
			dynamicMode.guaranteedRollsCount,
			unrollableStats
		);

		if (calcRollProb) {
			console.log(
				"Calculating roll probability",
				{ statData, rollRestrictions, validCombos, logicGoal }
			);

			const [newRollProb, avg, buckets, totPerCombo] = computeRollProb(statData, rollRestrictions, validCombos, logicGoal);
			setRollProb(newRollProb);
			setAvgRV(avg);
			setMaxRV(maxAttainable);
			total *= totPerCombo;

			const maxBar = Math.max(...buckets);
			const relativeBars = buckets.map(b => [b / maxBar, false] as [number, boolean]);
			const goalBucket = Math.min(buckets.length - 1, toBucket(logicBaseGoal, statData.maxWeight));
			relativeBars[goalBucket] = relativeBars[goalBucket] ?? [0, false];
			relativeBars[goalBucket][1] = true;
			setBars(relativeBars);
		} else {
			setRollProb(undefined);
			setAvgRV(undefined);
			setMaxRV(undefined);
			setBars([]);
		}

		setTotal(total);

		if (doSimulate) {
			setSimulationVer(prev => (prev ?? 0) + 1);
			setSimulationWorker(prev => {
				prev?.terminate();

				const worker = new SimulationWorker();
				worker.postMessage({
					statData,
					rollRestrictions,
					goal: logicGoal,
					fixedStats: mode.fixedArtifact ? currentStats : undefined
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
			(sortedValidWeights.length <= SUB_STAT_COUNT || sortedValidWeights[SUB_STAT_COUNT - 1][1] > sortedValidWeights[SUB_STAT_COUNT][1])
		) {
			const secondBest = maxAttainable - (
				sortedValidWeights[SUB_STAT_COUNT - 1][1] *
					(gameData.rollValues[gameData.rollValues.length - 1] - gameData.rollValues[gameData.rollValues.length - 2])
			);

			// - Goal is better than the second best possibility
			// - Weights are as small as possible
			if (
				secondBest * 100 <= logicGoal &&
				sortedValidWeights.slice(0, SUB_STAT_COUNT).reduce((acc, [_, w]) => acc + w, 0) <=
					validStats.map(s => gameData.statWeights[s]).sort((a, b) => b - a).slice(0, SUB_STAT_COUNT).reduce((acc, w) => acc + w, 0)
			) {
				setOverwhelminglyLikely(true);
				return;
			}
		}

		setOverwhelminglyLikely(false);
	};

	return (
		<div>
			<VisualSection>
				<LabelGrid>
					<div>
						<div>
							Artifact Type:
						</div>
						<div class="inline-flex gap-4 flex-wrap">
							<label>
								<select value={artifactType} onChange={(e) => {
									setArtifactType(Number((e.target as HTMLSelectElement).value));

									const newMainStats = Object.keys(gameData.mainStats[+(e.target as HTMLSelectElement).value].stats);
									if (!newMainStats.includes(mainStat)) {
										setMainStat(newMainStats[0]);
									}
								}}>
									{Object.entries(gameData.mainStats).map(([key, { name }]) => (
										<option key={key} value={key}>
											{name}
										</option>
									))}
								</select>
							</label>
							<label>
								Main Stat: <select value={mainStat} onChange={(e) => setMainStat((e.target as HTMLSelectElement).value)}>
									{Object.keys(gameData.mainStats[artifactType].stats).map(stat => (
										<option key={stat} value={stat}>
											{stat}
										</option>
									))}
								</select>
							</label>
							{!mode.fixedArtifact && mode.fromDomain &&
								<Checkbox label="Accept either set from the domain" checked={acceptEither} onChange={setAcceptEither} />}
							{mode.fixedArtifact && <Checkbox label="Started with 4 lines" checked={isFiveRoller} onChange={setIsFiveRoller} />}
							<div class="flex-1 text-right">
								<Button onClick={() => setShowImport(!showImport)}>
									{showImport ? "Cancel" : "Import"}
								</Button>
							</div>
						</div>
					</div>
					{mode.fixedArtifact && <div>
						<div>
							Sub-stats:
						</div>
						<div class="flex flex-col gap-2">
							<StatListInput
								useRV={useRV}
								clearable={!mode.fixedArtifact}
								stats={currentStats}
								count={SUB_STAT_COUNT}
								onChange={setCurrentStats}
								validStats={gameData.stats.filter(stat => stat !== mainStat)}
								statValues={mode.fixedArtifact && useAutoGoal ? statParams : undefined}
								onValueChange={(stat, value) => setStatParams(prev => ({ ...prev, [stat]: { ...prev[stat], currentRV: value } }))}
							/>
						</div>
					</div>}
				</LabelGrid>
			</VisualSection>
			{showImport && <Import import={art => {
				setArtifactType(art.artifactType);
				setMainStat(art.mainStat);
				setCurrentStats(art.subStats.map(([stat]) => stat));
				setStatParams(prev => {
					const newParams = { ...prev };

					for (const [stat, value] of art.subStats) {
						newParams[stat] = {
							...newParams[stat],
							currentRV: Math.round((value / gameData.statValues[stat]) / 10) * 10
						};
					}

					return newParams;
				});
				setIsFiveRoller(art.totalCount >= 9);
				setShowImport(false);
			}} />}
			{(dynamicMode.selectedStatCount > 0 || Array.isArray(mode.selectedStatCount)) && <VisualSection>
				<LabelGrid>
					{Array.isArray(mode.selectedStatCount) && <div>
						<div>
							{mode.fixedArtifact && mode.selectToIgnore ? "Ignored" : "Selected"} count:
						</div>
						<div>
							<ToggleButtons
								options={mode.selectedStatCount}
								value={rawSelectedStatCount}
								onChange={(value) => setRawSelectedStatCount(value)}
							/>
						</div>
					</div>}
					{dynamicMode.selectedStatCount > 0 && <>
						{mode.fixedArtifact && !mode.selectToIgnore && Array.isArray(mode.guaranteedCount) && <div>
							<div>
								Guaranteed rolls:
							</div>
							<div>
								<ToggleButtons
									options={mode.guaranteedCount}
									value={rawGuaranteedRollsCount}
									onChange={(value) => setRawGuaranteedRollsCount(value)}
								/>
							</div>
						</div>}
						<div>
							<div>
								{mode.fixedArtifact && mode.selectToIgnore ? "Ignored" : "Selected"} {dynamicMode.selectedStatCount === 1 ? "stat" : "stats"}:
							</div>
							<div class="flex gap-2 items-center flex-wrap">
								<StatListInput
									stats={selectedStats}
									count={dynamicMode.selectedStatCount}
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
					</>}
					{allOptimalPairs.length > 1 && <div>
						<div>
							All optimal:
						</div>
						<div class="flex gap-x-4 gap-y-1 items-center overflow-auto">
							{allOptimalPairs.map(stats => (
								<button key={stats.join(" + ")} onClick={() => setSelectedStats(stats)} class="shrink-0 underline">
									{stats.join(" + ")}
								</button>
							))}
						</div>
					</div>}
				</LabelGrid>
				{dynamicMode.selectedStatCount > 0 && <div class="mt-2">
					<strong>Tip</strong>: Run optimize after completing the sections below to find the best subsets to select.
				</div>}
			</VisualSection>}
			{!mode.fixedArtifact && <section>
				<h3 class="text-xl font-bold mt-5">Stat Requirements</h3>
				<div class="mt-1">
					Only consider artifacts with these stats.
				</div>
				<VisualSection>
					<div class="flex gap-2 items-center">
						<span>Require</span>
						<input
							type="number"
							value={requireCount}
							onChange={(e) => setRequireCount(Number((e.target as HTMLInputElement).value))}
							class="w-20"
						/>
						<span>of</span>
						<StatListInput
							clearable
							stats={required}
							count={SUB_STAT_COUNT}
							onChange={setRequired}
							validStats={validStats}
						/>
					</div>
				</VisualSection>
			</section>}
			<section>
				<h3 class="text-xl font-bold mt-5">Roll Requirements</h3>
				<div class="mt-1">
					Control the relative value of each roll, as well as stat roll limits.{!mode.fixedArtifact &&
						<> Ignored if all weights and min stats are 0.</>}
				</div>
				<div class="mt-1">
					<Checkbox label="Input roll value (RV) instead of stat value" checked={useRV} onChange={setUseRV} />
				</div>
				<VisualSection>
					<StatParamInput
						entries={statParams}
						validStats={validStats}
						onChange={(stat, entry) => setStatParams(prev => ({ ...prev, [stat]: entry }))}
						useRV={useRV}
					/>
				</VisualSection>
				<VisualSection>
					<div class="flex gap-x-5 gap-y-2 flex-wrap mb-2">
						<Checkbox label="Use current sub-stats for goal" checked={useAutoGoal} onChange={setUseAutoGoal} />
						<Checkbox label="Include artifacts equal to goal" checked={includeEqual} onChange={setIncludeEqual} />
					</div>
					<LabelGrid>
						{useAutoGoal && !mode.fixedArtifact && <div>
							<div>Current sub-stats:</div>
							<StatListInput
								clearable={!mode.fixedArtifact}
								stats={currentStats}
								count={SUB_STAT_COUNT}
								onChange={setCurrentStats}
								validStats={gameData.stats.filter(stat => stat !== mainStat)}
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
					{maxTheoretical === undefined ? null : <div class="mt-2">
						{useAutoGoal ? "Currently at" : "Goal is"} <Percentage highlight value={goalValue / maxTheoretical} /> of maximum reachable sub-stat value
						{maxAttainable < maxTheoretical && <> (Max: <Percentage value={maxAttainable / maxTheoretical} />, started with 3 lines)</>}
					</div>}
				</VisualSection>
			</section>
			<section>
				<h3 class="text-xl font-bold my-5">Probability Results</h3>
				<VisualSection>
					<div class="flex gap-4 items-center flex-wrap">
						<Button primary onClick={() => calculate()} disabled={dynamicMode.selectedStatCount > 0 && selectedStatsInvalid}>Calculate</Button>
						<div class="flex gap-2 items-center flex-wrap">
							<strong>Advanced:</strong>
							<label>
								<Checkbox label="Run a Monte Carlo simulation as well" checked={doSimulate} onChange={setDoSimulate} />
							</label>
						</div>
					</div>
				</VisualSection>
				<VisualSection>
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
									showQuality={!mode.fixedArtifact && mode.mainStatUnknown ? 45 : 1}
								/>{probCost !== undefined && mode.output !== undefined &&
									<span> &#8776; <NumberDisplay highlight value={probCost} /> {mode.output.desc
										? <abbr title={mode.output.desc}>{getModeProb(mode.output.unit)}</abbr>
										: <span>{getModeProb(mode.output.unit)}</span>}
									</span>}
							</div>
						</div>
						{totalProb !== undefined && totalProb !== 0 && overwhelminglyLikely && <div>
							<div></div>
							<div class="flex gap-2 items-center">
								<img src="/artifact-copium/nah-id-win.png" class="h-4" alt="Gojo" /> Nah, I'd win
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
					{total !== undefined && <div class="mt-2">
						Considered <NumberDisplay highlight value={total} /> {rollProb === undefined ? "artifact" : "artifact + roll"} outcomes
					</div>}
				</VisualSection>
				{(avgRV !== undefined || bars.length > 0) && <VisualSection>
					{avgRV !== undefined && <div>Average weighted RV of rolled artifacts: {Math.round(avgRV / 100).toLocaleString()}%</div>}
					{bars.length > 0 && <RVGraph bars={bars} max={maxRV} />}
				</VisualSection>}
				<LogicSection />
			</section>
		</div>
	);
}
