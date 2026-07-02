import { useContext, useMemo, useState } from "preact/hooks"
import { DistributionView } from "./DistributionView";
import { computeRollDistribution, RollDistOut } from "../../../logic/subStatDistribution/rollDistribution";
import { SUB_STAT_COUNT } from "../../data/consts";
import { GameContext } from "../../contexts/GameContext";
import { Game } from "../../data/game";

const ignoreModeMap: Record<Game, boolean> = {
	genshin: false,
	hsr: true
};

export const RollDist = () => {
	const { game } = useContext(GameContext);
	const [rolls, setRolls] = useState(4);
	const [ignoreCount, setIgnoreCount] = useState(0);
	const [guaranteedCount, setGuaranteedCount] = useState(2);
	const [guaranteedRolls, setGuaranteedRolls] = useState(0);
	const [showCount, setShowCount] = useState(1);

	const ignoreMode = ignoreModeMap[game];
	const [distribution, totalWeight, permCount] = useMemo(() => {
		let dist = ignoreMode
			? computeRollDistribution(SUB_STAT_COUNT, rolls, 0, 0, ignoreCount)
			: computeRollDistribution(SUB_STAT_COUNT, rolls, guaranteedCount, guaranteedCount ? guaranteedRolls : 0, 0);

		if (showCount < SUB_STAT_COUNT) {
			let sparseConsolidatedDist = [] as unknown as RollDistOut;
			for (const [statRolls, prob] of dist) {
				const parts = statRolls.slice(0, showCount);
				const key = parts.reduce((acc, val) => acc * (SUB_STAT_COUNT + 1) + val, 0);
				sparseConsolidatedDist[key] = [parts, (sparseConsolidatedDist[key]?.[1] || 0) + prob];
			}
			
			let consolidatedDist = sparseConsolidatedDist.filter(Boolean) as RollDistOut;
			consolidatedDist.permCount = dist.permCount;

			consolidatedDist.sort((a, b) => {
				for (let i = 0; i < a[0].length; i++) {
					if (a[0][i] !== b[0][i]) {
						return b[0][i] - a[0][i];
					}
				}
				return 0;
			});

			consolidatedDist.sort((a, b) => {
				return b[0].reduce((sum, val) => sum + val, 0) - a[0].reduce((sum, val) => sum + val, 0);
			});

			dist = consolidatedDist;
		}

		return [
			dist.map(([statRolls, prob]) => {
				return [statRolls.join(" "), prob] as const;
			}),
			dist.reduce((sum, [, prob]) => sum + prob, 0),
			dist.permCount
		];
	}, [rolls, ignoreMode, ignoreCount, guaranteedCount, guaranteedRolls, showCount]);

	return (
		<div>
			<div class="flex gap-4 flex-wrap mb-4">
				<label>
					Max rolls: <input
						class="w-20"
						type="number"
						max={10}
						value={rolls}
						onInput={e => setRolls(+e.currentTarget.value)}
					/>
				</label>
				{ignoreMode ? <label>
					Ignore the <input
						class="w-20"
						type="number"
						max={rolls}
						value={ignoreCount}
						onInput={e => setIgnoreCount(+e.currentTarget.value)}
					/> rightmost substats
				</label> : <>
					<label>
						Guarantee the <input
							class="w-20"
							type="number"
							max={rolls}
							value={guaranteedCount}
							onInput={e => setGuaranteedCount(+e.currentTarget.value)}
						/> leftmost substats
					</label>
					<label className="-ml-3">
						<input
							class="w-20"
							type="number"
							max={rolls}
							value={guaranteedRolls}
							onInput={e => setGuaranteedRolls(+e.currentTarget.value)}
						/> times
					</label>
				</>}
				<label>
					Show <input
						class="w-20"
						type="number"
						max={SUB_STAT_COUNT}
						value={showCount}
						onInput={e => setShowCount(+e.currentTarget.value)}
					/> stats
				</label>
			</div>
			<DistributionView entries={distribution} />
			<div class="mt-2">
				Total: {permCount.toLocaleString()} (Total weight: {totalWeight.toLocaleString()})
			</div>
		</div>
	);
};