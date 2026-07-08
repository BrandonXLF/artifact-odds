import { useContext, useMemo, useState } from "preact/hooks"
import { computeRollValueDistribution } from "../../../logic/subStatDistribution/valueDistribution";
import { DistributionView } from "./DistributionView";
import { GameContext } from "../../contexts/GameContext";
import { data } from "../../data/data";
import { round2 } from "../../utils/round";

export const RollValueDist = () => {
	const { game } = useContext(GameContext);
	const [rolls, setRolls] = useState(2);
	const [rvIndex, setRvIndex] = useState(0);
	const [includeBase, setIncludeBase] = useState(true);
	const choices = useMemo(() => [
		{
			name: "Default",
			rollValues: data[game].rollValues
		},
		...Object.entries(data[game].rollValueOverrides ?? {}).map(([stat, { rollValues }]) => ({
			name: stat,
			rollValues
		}))
	], [data, game]);

	const distribution = useMemo(() => {
		const i = Math.min(rvIndex, choices.length - 1);

		return [...computeRollValueDistribution(rolls + (includeBase ? 1 : 0), choices[i].rollValues).values()]
			.sort(([a], [b]) => a - b)
			.map(([statRolls, prob]) => [round2(statRolls).toString() + "%", prob] as const)
			.reverse();
	}, [rolls, choices, rvIndex, includeBase]);

	return (
		<div>
			<div class="flex gap-4 flex-wrap mb-4 items-center">
				<label>
					Rolls count: <input
						class="w-20"
						type="number"
						value={rolls}
						onInput={e => setRolls(+e.currentTarget.value)}
					/>
				</label>
				<span class="-ml-3">+</span>
				<label class="-ml-3 flex items-center gap-2"><input
						type="checkbox"
						checked={includeBase}
						onInput={e => setIncludeBase(e.currentTarget.checked)}
					/> include base
				</label>
				{choices.length > 1 && <label>
					Roll values: <select
						value={rvIndex}
						onChange={e => setRvIndex(+e.currentTarget.value)}
					>
						{choices.map((choice, index) => (
							<option value={index} key={index}>{choice.name}</option>
						))}
					</select>
				</label>}
			</div>
			<div class="mt-4">
				<DistributionView entries={distribution} />
			</div>
			<div class="mt-2">
				Total: {distribution.reduce((sum, [, prob]) => sum + prob, 0).toLocaleString()}
			</div>
		</div>
	);
};