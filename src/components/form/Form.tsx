import { computeMainStatProb } from '../../../logic/mainStatProb';
import { StatDataConfig } from '../../../logic/data/StatData';
import { computeRollProb } from '../../../logic/subStatDistribution';
import { StatParamInput } from '../input/StatParamInput';
import { useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'preact/hooks';
import { StatListInput } from '../input/StatListInput';
import { getSubStatCombinations } from '../../../logic/combinations/subStatCombinations';
import { computeSubProb } from '../../../logic/subStatProb';
import { VisualSection } from '../structure/VisualSection';
import { ToggleButtons } from '../input/ToggleButtons';
import { Checkbox } from '../input/Checkbox';
import { toBucket, toRange } from '../../../logic/utils/barChart';
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
import { Import, ImportedArtifact } from './Import';
import { LOWER_ROLL_COUNT, SUB_STAT_COUNT, UPPER_ROLL_COUNT } from '../../data/consts';
import RollRestrictions from '../../../logic/data/RollRestrictions';
import { Ref } from 'preact';
import { FormContext } from '../../contexts/FormContext';
import { GameContext } from '../../contexts/GameContext';
import { factorial } from '../../utils/factorial';
import { NumberDisplay } from '../output/NumberDisplay';
import { QuantileOutput } from '../output/QuantileOutput';
import { computeTypeProb } from '../../../logic/typeProb';
import { RequireStatsOfInput } from '../input/RequireStatsOfInput';
import { StatParams } from '../../data/StatParams';

export type FormHandle = {
	reset: () => void;
}

interface BarStats {
	avgRV: number;
	avgAboveRV: number;
	maxRV: number;
	goalRV: number;
}

// Note: This is far larger than the minimum difference between actual probabilities
const probDelta = 1 / 10_000_000_000_000;

export function Form(props: Readonly<{ formRef: Ref<FormHandle> }>) {
	const resetTrigger = useRef(new ResetTrigger()).current;
	const { gameData } = useContext(GameContext);
	const { mode, modeId } = useContext(FormContext)!;

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
	const [allRequired, setAllRequired] = useStoredState<string[]>("allRequired", () => [], resetTrigger);
	const [someRequired, setSomeRequired] = useStoredState<string[]>("required", () => [], resetTrigger);
	const [requireCount, setRequireCount] = useStoredState<number>("requireCount", 0, resetTrigger);
	const [requireAllLines, setRequireAllLines] = useStoredState<boolean>("requireAllLines", false, resetTrigger);
	const [statParams, setStatParams] = useStoredState(
		"statWeights",
		() => Object.fromEntries(gameData.stats.map(stat => [stat, new StatParams()])) as Record<string, StatParams>,
		resetTrigger,
		(val, getDefault) => ({
			...getDefault(),
			...Object.fromEntries(Object.entries(val).map(([stat, data]) => [stat, new StatParams(data)]))
		})
	);
	const [acceptEither, setAcceptEither] = useStoredState<boolean>("acceptEither", false, resetTrigger);
	const [isFiveRoller, setIsFiveRoller] = useStoredState<boolean>("isFiveRoller", false, resetTrigger);
	const [useAutoGoal, setUseAutoGoal, useAutoGoalLoaded] = useStoredState<boolean>("useAutoGoal", true, resetTrigger);
	const [includeEqual, setIncludeEqual] = useStoredState<boolean>("includeEqual", false, resetTrigger);
	const [doSimulate, setDoSimulate] = useStoredState<boolean>("runMonteCarlo", false, resetTrigger);
	const [useRV, setUseRV] = useStoredState<boolean>("useRV", false, resetTrigger);
	const [outputNum, setOutputNum] = useStoredState<Record<string, number>>("outputNum", {}, resetTrigger);

	// Input feedback
	const [fixedStatsInvalid, setFixedStatsInvalid] = useResettableState<boolean | undefined>(undefined, resetTrigger);
	const [selectedStatsInvalid, setSelectedStatsInvalid] = useResettableState<boolean | undefined>(undefined, resetTrigger);
	const [allOptimalPairs, setAllOptimalPairs] = useResettableState<string[][]>(() => [], resetTrigger);

	// Results
	const [typeProb, setTypeProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [mainProb, setMainProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [subProb, setSubProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [rollProb, setRollProb] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [overwhelminglyLikely, setOverwhelminglyLikely] = useResettableState<boolean>(false, resetTrigger);
	const [bars, setBars] = useResettableState<[number, boolean, readonly [number, number]][]>([], resetTrigger);
	const [barStats, setBarStats] = useResettableState<BarStats | undefined>(undefined, resetTrigger);
	const [simulationWorker, setSimulationWorker] = useResettableState<Worker | undefined>(undefined, resetTrigger);
	const [simulationVer, setSimulationVer] = useResettableState<number | undefined>(undefined, resetTrigger);
	const [total, setTotal] = useResettableState<{stat: number, roll?: number} | undefined>(undefined, resetTrigger);

	// Non-resettable
	const [, setCustomGoalVer] = useState(0);
	const [importClicked, setImportClicked] = useState(false);

	// Variables
	const allLinesProb = mode.fixedArtifact ? Number(isFiveRoller) : mode.allLinesProb;
	const allowedStats = useMemo(() => gameData.stats.filter(stat => stat !== mainStat), [gameData.stats, mainStat]);
	const activeStats = mode.fixedArtifact ? currentStats : allowedStats;
	const inactiveStats = useMemo(() => gameData.stats.filter(stat => !activeStats.includes(stat)), [gameData.stats, activeStats]);

	const currentValue = useMemo(
		() => roundMaxPrecision(
			currentStats
				.map(stat => statParams[stat] ?? {})
				.reduce((acc, { currentRV, weight }) => acc + (currentRV ?? 0) * (weight ?? 0), 0)
		),
		[currentStats, statParams]
	);
	const goalValue = useAutoGoal ? round2(currentValue) : customGoal;

	const requiredByMins = useMemo(() => {
		return activeStats
			.map(stat => [stat, statParams[stat]] as const)
			.filter(([_, data]) => data.minRVFinal !== undefined && data.minRVFinal > 0)
			.map(([stat]) => stat);
	}, [statParams, statParams]);

	const domainPicky = !mode.fixedArtifact && mode.twoPossibleSets && !acceptEither;
	const showTypeProb = !mode.fixedArtifact && mode.typeUnknown;

	if (domainPicky) {
		// If domain set probability matters, then type probability must as well.
		const _testDomainNotIgnored: (typeof mode.typeUnknown extends true ? true : false) = true;
	}

	const showMainProb = !mode.fixedArtifact && mode.mainStatUnknown;
	const showSubProb = !mode.fixedArtifact;

	const nonDefaultSubProb = useMemo(
		() => showSubProb && (allRequired.some(Boolean) || requiredByMins.length > 0 || requireCount > 0 || requireAllLines),
		[allRequired, showSubProb, requireCount, requiredByMins.length, requireAllLines]
	);
	const calcGoalRollProb = useMemo(
		() => activeStats.some(stat => statParams[stat].weight),
		[activeStats, statParams]
	);
	const calcBasicRollProb = useMemo(
		() => calcGoalRollProb || mode.fixedArtifact || activeStats.some(stat => statParams[stat].minRV),
		[calcGoalRollProb, mode.fixedArtifact, activeStats, statParams]
	);

	const totalProb = typeProb !== undefined || mainProb !== undefined || subProb !== undefined || rollProb !== undefined
		? (typeProb ?? 1) * (mainProb ?? 1) * (subProb ?? 1) * (rollProb ?? 1)
		: undefined;

	const logicBaseGoal = Math.round(goalValue * 100);
	const logicGoal = calcGoalRollProb ? logicBaseGoal - (Number(includeEqual) / 10) : -9999;

	const sortedValidWeights = useMemo(
		() => activeStats
			.map(stat => [stat, statParams[stat]?.weight ?? 0] as [string, number])
			.sort((a, b) => (b[1] - a[1])),
		[activeStats, statParams]
	);

	const anyRel = useMemo(
		() => activeStats.some(stat => (statParams[stat]?.weight && statParams[stat]?.maxRVRel) || statParams[stat]?.minRVRel),
		[activeStats, statParams]
	);
	const showSubStats = useAutoGoal || anyRel;
	const needSubStats = showSubStats && (calcGoalRollProb || anyRel);

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

	const outputMode = Array.isArray(mode.output) ? mode.output[outputNum[modeId] ?? 0] : mode.output;
	const expectedTimes = useMemo(() => {
		if (totalProb === undefined) return undefined;
		return Math.round(1 / totalProb);
	}, [totalProb, outputMode]);
	const costPerArtifact = useMemo(
		() => getModeProb(outputMode.perArtifact ?? 1),
		[outputMode, artifactType, dynamicMode.selectedStatCount]
	);
	const expectedCost = expectedTimes === undefined ? undefined : Math.round(expectedTimes * costPerArtifact * 1);

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

	const calculateDisabled =
		(dynamicMode.selectedStatCount > 0 && selectedStatsInvalid) ||
		(mode.fixedArtifact && fixedStatsInvalid);

	const importElRef = useRef<HTMLDivElement | null>(null);

	// Callbacks
	const stat = useMemo(() => ({
		setEntry: (stat: string, entry: StatParams) => setStatParams(prev => ({ ...prev, [stat]: new StatParams(entry) })),
		setRV: (stat: string, type: 'currentRV' | 'initialRV', value: number | undefined) => setStatParams(prev => ({ ...prev, [stat]: new StatParams({ ...prev[stat], [type]: value }) }))
	}), []);

	const importArtifact = useCallback((art: ImportedArtifact) => {
		setArtifactType(art.artifactType);
		setMainStat(art.mainStat);
		setCurrentStats(Object.keys(art.subStats));
		setStatParams(prev => {
			const newParams = { ...prev };

			for (const [stat, value] of Object.entries(art.subStats)) {
				newParams[stat] = new StatParams({ ...newParams[stat], currentRV: value });
			}

			for (const [stat, value] of Object.entries(art.initial ?? [])) {
				newParams[stat] = new StatParams({ ...newParams[stat], initialRV: value });
			}

			return newParams;
		});
		setIsFiveRoller(art.totalCount >= 9);
	}, []);

	const closeImport = useCallback(() => setShowImport(false), []);

	const getBaseConfig = () => {
		const statDataConfig = new StatDataConfig(gameData.stats, gameData.statWeights, gameData.rollValues);
		statDataConfig.exclude(mainStat);

		if (!mode.fixedArtifact) {
			statDataConfig.requireAll(allRequired.filter(Boolean));
		}

		if (!mode.fixedArtifact && requireCount > 0) {
			statDataConfig.requireSome(someRequired.filter(Boolean), requireCount);
		}

		if (!mode.fixedArtifact && requireAllLines) {
			statDataConfig.requireAllLines(allLinesProb);
		}

		if (mode.fixedArtifact) {
			statDataConfig.onlyInclude(currentStats);
		}

		for (const [stat, data] of Object.entries(statParams) as [string, StatParams][]) {
			if (mode.fixedArtifact && mode.fixedInitial) {
				statDataConfig.setInitial(stat, data.initialRV ?? 0);
			}

			if (data.weight !== undefined) {
				statDataConfig.setWeight(stat, Math.round(data.weight * 100));
			}

			if (data.minRVFinal !== undefined) {
				statDataConfig.setMin(stat, data.minRVFinal);
			}

			if (data.maxRVFinal !== undefined) {
				statDataConfig.setLimit(stat, data.maxRVFinal);
			}
		}

		return statDataConfig;
	};

	const makeRollRestrictions = (
		guaranteedStats: Set<string> = new Set(),
		guaranteedCount: number = 0,
		unrollableStats: Set<string> = new Set()
	) => {
		return new RollRestrictions(
			SUB_STAT_COUNT,
			LOWER_ROLL_COUNT,
			UPPER_ROLL_COUNT,
			// If all lines is required for an artifact to be considered, then all rolled
			// artifacts must have all lines
			requireAllLines ? 1 : allLinesProb,
			guaranteedStats,
			guaranteedCount,
			unrollableStats
		);
	}

	const optimize = <T,>(
		statCombos: T[],
		calculate: (statCombo: T) => [number, number],
		normalize: (statCombo: T) => string[]
	) => {
		let maxStatsAndAvg: [T, number][] = [];
		let maxProb = -1;

		for (const statCombo of statCombos) {
			const [prob, avg] = calculate(statCombo);

			// Note: This is far larger than the minimum difference between actual probabilities
			if (prob - maxProb > probDelta) {
				maxStatsAndAvg = [[statCombo, avg] as [T, number]];
				maxProb = prob;
			} else if (Math.abs(prob - maxProb) <= probDelta) {
				maxStatsAndAvg.push([statCombo, avg] as [T, number]);
			}
		}

		maxStatsAndAvg.sort((a, b) => b[1] - a[1]); // Sort by average RV descending

		const maxAvgValue = maxStatsAndAvg[0]?.[1];
		const maxStats = maxStatsAndAvg
			.filter(([_, avg]) => Math.abs(avg - maxAvgValue) <= probDelta)
			.map(([statCombo]) => normalize(statCombo));

		if (maxStats.length) {
			setSelectedStats(maxStats[0]);
			setAllOptimalPairs(maxStats);
		}
	};

	const optimizers: Record<StatOptimizers, () => void> = {
		// New artifact optimizations
		bestStats: () => {
			const statData = getBaseConfig().make();
			const rollRestrictions = makeRollRestrictions();

			optimize(
				getSubStatCombinations(statData, dynamicMode.selectedStatCount),
				([stats]) => {
					const statData = getBaseConfig()
						.guarantee(stats[0])
						.guarantee(stats[1])
						.make();

					const [subStatProb, validCombos] = computeSubProb(statData, SUB_STAT_COUNT);
					const statistics = computeRollProb(statData, rollRestrictions, validCombos, logicGoal);

					return [subStatProb * statistics.probAbove, statistics.avgAbove];
				},
				([stats]) => stats
			);
		},
		// Fixed artifact optimizations
		bestRolls: () => {
			const baseStatData = getBaseConfig().onlyInclude(currentStats).make();
			const statData = getBaseConfig().make();

			optimize(
				getSubStatCombinations(baseStatData, 2),
				([stats]) => {
					const statistics = computeRollProb(
						statData,
						makeRollRestrictions(new Set(stats), dynamicMode.guaranteedRollsCount),
						[[[...currentStats], 1]],
						logicGoal
					);

					return [statistics.probAbove, statistics.avgAbove];
				},
				([stats]) => stats
			);
		},
		bestToIgnore: () => {
			const statData = getBaseConfig().make();

			optimize(
				currentStats,
				stat => {
					const statistics = computeRollProb(
						statData,
						makeRollRestrictions(undefined, undefined, new Set([stat])),
						[[[...currentStats], 1]],
						logicGoal
					);

					return [statistics.probAbove, statistics.avgAbove];
				},
				stat => [stat]
			);
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

		const newTypeProb = showTypeProb
			? computeTypeProb(gameData.mainStats, artifactType, domainPicky)
			: undefined;
		setTypeProb(newTypeProb);

		const newMainProb = showMainProb
			? computeMainStatProb(gameData.mainStats, artifactType, mainStat)
			: undefined;
		setMainProb(newMainProb);

		const statData = statDataConfig.make();
		const [newSubProb, validCombos, totalComboCount] = computeSubProb(statData, SUB_STAT_COUNT);
		setSubProb(showSubProb ? newSubProb : undefined);

		const comboPermMult = mode.fixedArtifact ? 1 : factorial(SUB_STAT_COUNT);
		const total = {
			// Every combination corresponds to SUB_STAT_COUNT! permutations unless fixed
			stat: totalComboCount * comboPermMult,
			roll: undefined as number | undefined
		};

		const rollRestrictions = makeRollRestrictions(
			guaranteedRollsStats,
			dynamicMode.guaranteedRollsCount,
			unrollableStats
		);

		if (calcBasicRollProb) {
			console.log(
				"Calculating roll probability",
				{ statData, rollRestrictions, validCombos, logicGoal }
			);

			const statistics = computeRollProb(statData, rollRestrictions, validCombos, logicGoal);
			setRollProb(statistics.probAbove);
			total.roll = statistics.allCount * comboPermMult;

			setBarStats({
				avgRV: statistics.avg / 10000,
				avgAboveRV: statistics.avgAbove / 10000,
				maxRV: maxAttainable ?? 0,
				goalRV: logicBaseGoal / 10000
			});

			const maxBar = statistics.buckets.reduce((a, b) => Math.max(a, b), -Infinity);
			const maxBucketIndex = toBucket((maxAttainable ?? 0) * 100, statData.maxWeight);
			const relativeBars: [number, boolean, readonly [number, number]][] = [];

			for (let i = 0; i <= maxBucketIndex; i++) {
				relativeBars[i] = [(statistics.buckets[i] ?? 0) / maxBar, false, toRange(i, statData.maxWeight)];
			}

			const goalBucket = Math.min(relativeBars.length - 1, toBucket(logicBaseGoal, statData.maxWeight));
			if (goalBucket !== -1) relativeBars[goalBucket][1] = true;

			setBars(relativeBars);
		} else {
			setRollProb(undefined);
			setBarStats(undefined);
			setBars([]);
			setBarStats(undefined);
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
			const lowestIncludedWeight = [...sortedValidWeights].reverse().find(([_, w]) => w > 0)?.[1] ?? 0;
			const oneLessRV = gameData.rollValues[gameData.rollValues.length - 1] - gameData.rollValues[gameData.rollValues.length - 2];
			const secondBest = maxAttainable - (lowestIncludedWeight * oneLessRV);

			// - Goal is better than the second best possibility
			// - Weights are as small as possible
			if (
				secondBest * 100 <= logicGoal &&
				sortedValidWeights.slice(0, SUB_STAT_COUNT).reduce((acc, [_, w]) => acc + w, 0) <=
					activeStats.map(s => gameData.statWeights[s]).sort((a, b) => b - a).slice(0, SUB_STAT_COUNT).reduce((acc, w) => acc + w, 0)
			) {
				setOverwhelminglyLikely(true);
				return;
			}
		}

		setOverwhelminglyLikely(false);
	};

	// Effects
	useEffect(() => {
		setTypeProb(undefined);
		setMainProb(undefined);
		setSubProb(undefined);
		setRollProb(undefined);
		setOverwhelminglyLikely(false);
		setBarStats(undefined);
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
	}, [mode, nonDefaultSubProb, calcBasicRollProb]);

	useEffect(
		() => setAllOptimalPairs([]),
		// All dependencies of calculate() besides selectedStats
		[
			mainStat,
			mode,
			dynamicMode,
			someRequired,
			requireCount,
			requireAllLines,
			currentStats,
			statParams,
			artifactType,
			acceptEither,
			allLinesProb,
			logicGoal
		]
	);

	useEffect(() => {
		if (useAutoGoalLoaded && useAutoGoal) {
			setCustomGoal(round2(currentValue));
		}
	}, [currentValue, useAutoGoalLoaded, useAutoGoal]);

	useEffect(() => {
		if (showImport && importClicked) {
			importElRef.current?.scrollIntoView({
				block: 'start',
				behavior: 'smooth'
			});
		}
	}, [showImport, importClicked]);

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
							{!mode.fixedArtifact && mode.twoPossibleSets &&
								<Checkbox label="Accept either set from the domain" checked={acceptEither} onChange={setAcceptEither} />}
							{mode.fixedArtifact && <Checkbox label="Started with 4 lines" checked={isFiveRoller} onChange={setIsFiveRoller} />}
							<div class="flex-1 text-right">
								<Button onClick={() => {
									setImportClicked(true);
									setShowImport(!showImport);
								}}>
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
								stats={currentStats}
								count={SUB_STAT_COUNT}
								onChange={setCurrentStats}
								validStats={allowedStats}
								statValues={statParams}
								showInitial={mode.fixedArtifact && mode.fixedInitial}
								onValueChange={stat.setRV}
								hasKnownError={fixedStatsInvalid}
								onErrorChange={setFixedStatsInvalid}
							/>
						</div>
					</div>}
				</LabelGrid>
			</VisualSection>
			{showImport && <Import import={importArtifact} close={closeImport} elementRef={importElRef} />}
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
								onChange={setRawSelectedStatCount}
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
									onChange={setRawGuaranteedRollsCount}
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
									validStats={activeStats}
									hasKnownError={selectedStatsInvalid}
									onErrorChange={setSelectedStatsInvalid}
								/>
								{mode.selectedStatOptimizer && (
									<Button
										title="Optimize by probability and then by expected RV"
										onClick={() => optimizers[mode.selectedStatOptimizer!]()}
									>
										Optimize
									</Button>
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
					Only consider artifacts with these substats.
				</div>
				<VisualSection>
					<LabelGrid>
						<div>
							<div>
								<strong>Required</strong>:
							</div>
							<StatListInput
								clearable
								stats={allRequired}
								count={SUB_STAT_COUNT}
								onChange={setAllRequired}
								validStats={activeStats}
							/>
						</div>
						<div>
							<div>
								<strong>Optional</strong>:
							</div>
							<RequireStatsOfInput
								count={requireCount}
								setCount={setRequireCount}
								stats={someRequired}
								setStats={setSomeRequired}
								validStats={activeStats}
							/>
						</div>
					</LabelGrid>
					{requiredByMins.length > 0 && <div class="mt-2">
						Implicitly required by roll minimums: {requiredByMins.join(', ')}
					</div>}
				</VisualSection>
				<VisualSection>
					<Checkbox label="Only consider artifacts that start with 4 lines" checked={requireAllLines} onChange={setRequireAllLines} />
				</VisualSection>
			</section>}
			<section>
				<h3 class="text-xl font-bold mt-5">Roll Requirements</h3>
				<div class="mt-1">
					Control the relative value (weight) of each stat roll as well as minimum required roll values.
				</div>
				<div class="mt-1">
					<Checkbox label="Input roll value (RV) instead of stat value" checked={useRV} onChange={setUseRV} />
				</div>
				<VisualSection>
					<StatParamInput
						entries={statParams}
						validStats={activeStats}
						invalidStats={inactiveStats}
						onChange={stat.setEntry}
						useRV={useRV}
					/>
				</VisualSection>
				<VisualSection>
					<LabelGrid>
						{!mode.fixedArtifact && showSubStats && <div class={needSubStats ? "" : "text-neutral-400"}>
							<div>Current sub-stats:</div>
							<StatListInput
								clearable
								stats={currentStats}
								count={SUB_STAT_COUNT}
								onChange={setCurrentStats}
								validStats={allowedStats}
								useRV={useRV}
								statValues={statParams}
								onValueChange={stat.setRV}
								disabled={!needSubStats}
							/>
						</div>}
						<div class={calcGoalRollProb ? "" : "text-neutral-400"}>
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
									disabled={!calcGoalRollProb || useAutoGoal}
									step="any"
								/> % weighted RV (Max: {maxAttainable === undefined ? "?" : <Percentage value={maxAttainable / 100} />})
							</div>
						</div>
					</LabelGrid>
					<div class={`flex gap-x-5 gap-y-2 flex-wrap mt-2 ${calcGoalRollProb ? "" : "text-neutral-400"}`}>
						<Checkbox disabled={!calcGoalRollProb} label="Use current sub-stats for goal" checked={useAutoGoal} onChange={setUseAutoGoal} />
						<Checkbox disabled={!calcGoalRollProb} label="Include artifacts equal to goal" checked={includeEqual} onChange={setIncludeEqual} />
					</div>
					{maxTheoretical === undefined ? null : <div class="mt-2">
						{useAutoGoal ? "Currently at" : "Goal is"} <Percentage highlight value={goalValue / maxTheoretical} /> of maximum reachable sub-stat value
						{maxAttainable < maxTheoretical && <> (Max: <Percentage value={maxAttainable / maxTheoretical} />, started with 3 lines)</>}
					</div>}
					{!calcGoalRollProb && <div class="mt-2">&#x2139;&#xfe0f; Add stat weights above to set artifact goals.</div>}
				</VisualSection>
			</section>
			<section>
				<h3 class="text-xl font-bold my-5">Probability Results</h3>
				<VisualSection>
					<div class="flex gap-4 items-center flex-wrap">
						<Button primary onClick={() => calculate()} disabled={calculateDisabled}>Calculate</Button>
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
						{showTypeProb && <div>
							<div>{domainPicky ? "Set & type" : "Type"} probability:</div>
							<div><Percentage highlight value={typeProb} /></div>
						</div>}
						{showMainProb && <div>
							<div>Main stat probability:</div>
							<div><Percentage highlight value={mainProb} /></div>
						</div>}
						{showSubProb && <div class={nonDefaultSubProb ? "" : "text-neutral-400"}>
							<div>Sub-stat probability:</div>
							<div>{nonDefaultSubProb
								? <Percentage highlight value={subProb} />
								: <abbr title="No stat requirements set">n/a</abbr>}
							</div>
						</div>}
						{<div class={calcBasicRollProb ? "" : "text-neutral-400"}>
							<div>Roll probability:</div>
							<div>
								{calcBasicRollProb
									? <Percentage highlight value={rollProb} />
									: <abbr title="No roll requirements set">n/a</abbr>}
							</div>
						</div>}
						<div>
							<div>Total probability:</div>
							<div>
								<Percentage
									showQuality={!mode.fixedArtifact && mode.mainStatUnknown ? 45 : 1}
									value={totalProb}
								/>{expectedTimes !== undefined && outputMode !== undefined &&
									<span> &#8776; <NumberDisplay highlight value={expectedCost} /> {Array.isArray(mode.output)
										? <select
											value={outputNum[modeId] ?? 0}
											onChange={e => setOutputNum(prev => ({
												...prev,
												[modeId]: Number((e.target as HTMLSelectElement).value)
											}))}
										>
											{mode.output?.map((out, i) => <option key={i} value={i}>{getModeProb(out.unit).label}</option>)}
										</select>
										: getModeProb(outputMode.unit)[expectedCost == 1 ? "single" : "many"]}
									</span>}
							</div>
						</div>
						{totalProb !== undefined && totalProb !== 0 && overwhelminglyLikely && <div>
							<div></div>
							<div class="flex gap-2 items-center">
								<img src="/artifact-odds/nah-id-win.png" class="h-4" alt="Gojo" /> Nah, I'd win
							</div>
						</div>}
						{simulationVer !== undefined && <div>
							<div>Simulated probability:</div>
							<div>
								<SimulationOutput
									key={simulationVer}
									mainProb={(typeProb ?? 1) * (mainProb ?? 1)}
									worker={simulationWorker}
									onTerminate={() => setSimulationWorker(prev => {
										prev?.terminate();
										return undefined;
									})}
								/>
							</div>
						</div>}
						{totalProb !== undefined && <div>
							<div>{getModeProb(outputMode.unit).oddsLabel} for chance:</div>
							<QuantileOutput prob={totalProb} costPerTime={costPerArtifact} />
						</div>}
					</LabelGrid>
					{total !== undefined && <div class="mt-2">
						Considered {mode.fixedArtifact
							? <><NumberDisplay highlight value={total.roll} /> roll outcomes</>
							: <><NumberDisplay highlight value={total.stat} /> artifact{total.roll && <> and <NumberDisplay highlight value={total.roll} /> rolled artifact</>} outcomes</>}
					</div>}
				</VisualSection>
				{bars.length > 0 && (bars[0] === undefined || bars.length > 1) /* at least 1 non-zero */ && <VisualSection>
					{barStats !== undefined && <div>Average rolled weighted RV:{' '}
						<Percentage highlight value={barStats.avgRV} />{' '}
						<Percentage isPPChange value={barStats.avgRV - barStats.goalRV} />
						{barStats.avgAboveRV !== undefined && <>
							<span class="opacity-40"> | </span>
							Above goal only: <Percentage highlight value={barStats.avgAboveRV} />{' '}
							<Percentage isPPChange value={barStats.avgAboveRV - barStats.goalRV} />
						</>}
					</div>}
					<RVGraph bars={bars} max={barStats?.maxRV} />
				</VisualSection>}
				<LogicSection />
			</section>
		</div>
	);
}
