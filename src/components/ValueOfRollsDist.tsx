import { useMemo, useState } from "preact/hooks"
import { computeRollValueDistribution } from "../../logic/subStatDistribution/valueDistribution";
import { DistributionView } from "./DistributionView";

export const RollValueDist = () => {
	const [rolls, setRolls] = useState(2);

	const distribution = useMemo(() => {
		return [...computeRollValueDistribution(rolls + 1).entries()]
			.map(([statRolls, prob]) => {
				return [statRolls.toString() + "%", prob] as const;
			})
			.reverse();
	}, [rolls]);

	return (
		<div>
			<div class="mb-2">
				<label>
					Rolls: <input
						class="w-20"
						type="number"
						value={rolls}
						onInput={e => setRolls(parseInt(e.currentTarget.value))}
					/> + 1 (base)
				</label>
			</div>
			<DistributionView entries={distribution} />
			<div class="mt-2">
				Total: {distribution.reduce((sum, [, prob]) => sum + prob, 0)}
			</div>
		</div>
	);
};