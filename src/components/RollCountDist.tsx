import { useMemo, useState } from "preact/hooks"
import { DistributionView } from "./DistributionView";
import { computeRollDistribution } from "../../logic/subStatDistribution/rollDistribution";
import { Checkbox } from "./Checkbox";

export const RollDist = () => {
	const [rolls, setRolls] = useState(4);
	const [guaranteedRolls, setGuaranteedRolls] = useState(0);
	const [showAll, setShowAll] = useState(false);

	const distribution = useMemo(() => {
		let dist = computeRollDistribution(4, rolls, 2, guaranteedRolls);

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
	}, [rolls, guaranteedRolls, showAll]);

	return (
		<div>
			<div class="flex gap-4 flex-wrap mb-2">
				<label>
					Max rolls: <input
						class="w-20"
						type="number"
						max={10}
						value={rolls}
						onInput={e => setRolls(parseInt(e.currentTarget.value))}
					/>
				</label>
				<label>
					Guaranteed: <input
						class="w-20"
						type="number"
						max={rolls}
						value={guaranteedRolls}
						onInput={e => setGuaranteedRolls(parseInt(e.currentTarget.value))}
					/> leftmost
				</label>
				<Checkbox label="Show all stats" checked={showAll} onChange={setShowAll} />
			</div>
			<DistributionView entries={distribution} />
			<div class="mt-2">
				Total: {distribution.reduce((sum, [, prob]) => sum + prob, 0)}
			</div>
		</div>
	);
};