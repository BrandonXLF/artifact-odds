import { useContext, useMemo, useState } from "preact/hooks"
import { DistributionView } from "./DistributionView";
import { computeRollDistribution } from "../../../logic/subStatDistribution/rollDistribution";
import { Checkbox } from "../input/Checkbox";
import { SUB_STAT_COUNT } from "../../data/consts";
import { GameContext } from "../../contexts/GameContext";
import { ToggleButtons } from "../input/ToggleButtons";

export const RollDist = () => {
	const { game } = useContext(GameContext);
	const [rolls, setRolls] = useState(4);
	const [ignoreMode, setIgnoreMode] = useState<boolean>(game === "hsr");
	const [ignoreCount, setIgnoreCount] = useState(0);
	const [guaranteedCount, setGuaranteedCount] = useState(2);
	const [guaranteedRolls, setGuaranteedRolls] = useState(0);
	const [showAll, setShowAll] = useState(false);

	const distribution = useMemo(() => {
		let dist = ignoreMode
			? computeRollDistribution(SUB_STAT_COUNT, rolls, 0, 0, ignoreCount)
			: computeRollDistribution(SUB_STAT_COUNT, rolls, guaranteedCount, guaranteedRolls, 0);

		if (!showAll) {
			let consolidatedDist: [number[], number][] = [];

			for (const [statRolls, prob] of dist) {
				const i = statRolls[0];
				consolidatedDist[i] = [[i], (consolidatedDist[i]?.[1] || 0) + prob];
			}

			consolidatedDist.reverse();
			dist = consolidatedDist;
		}
		
		return dist.map(([statRolls, prob]) => {
			return [statRolls.join(" "), prob] as const;
		});
	}, [rolls, ignoreMode, ignoreCount, guaranteedCount, guaranteedRolls, showAll]);

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
				<ToggleButtons
					options={[
						[true, "Ignore"],
						[false, "Guarantee"]
					]}
					value={ignoreMode}
					onChange={setIgnoreMode}
				/>
				{ignoreMode ? <label>
					the <input
						class="w-20"
						type="number"
						max={rolls}
						value={ignoreCount}
						onInput={e => setIgnoreCount(+e.currentTarget.value)}
					/> leftmost substats
				</label> : <>
					<label>
						the <input
							class="w-20"
							type="number"
							max={rolls}
							value={guaranteedCount}
							onInput={e => setGuaranteedCount(+e.currentTarget.value)}
						/> leftmost substats
					</label>
					<label>
						<input
							class="w-20"
							type="number"
							max={rolls}
							value={guaranteedRolls}
							onInput={e => setGuaranteedRolls(+e.currentTarget.value)}
						/> times
					</label>
				</>}
				<Checkbox label="Show all stats" checked={showAll} onChange={setShowAll} />
			</div>
			<DistributionView entries={distribution} />
			<div class="mt-2">
				Total: {distribution.reduce((sum, [, prob]) => sum + prob, 0).toLocaleString()}
			</div>
		</div>
	);
};