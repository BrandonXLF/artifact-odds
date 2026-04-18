import { useContext, useMemo, useState } from "preact/hooks"
import { computeRollValueDistribution } from "../../../logic/subStatDistribution/valueDistribution";
import { DistributionView } from "./DistributionView";
import { GameContext } from "../../contexts/GameContext";
import { ToggleButtons } from "../input/ToggleButtons";
import { meta } from "../../data/meta";
import { Game } from "../../data/game";
import { data } from "../../data/data";
import { LabelGrid } from "../structure/LabelGrid";

export const RollValueDist = () => {
	const { game } = useContext(GameContext);
	const [rolls, setRolls] = useState(2);
	const [selectedGame, setSelectedGame] = useState(game);

	const distribution = useMemo(() => {
		return [...computeRollValueDistribution(rolls + 1, data[selectedGame].rollValues).entries()]
			.map(([statRolls, prob]) => {
				return [statRolls.toString() + "%", prob] as const;
			})
			.reverse();
	}, [selectedGame, rolls]);

	return (
		<div>
			<LabelGrid>
				<label>
					<div>Roll values:</div>
						<ToggleButtons
						options={Object.entries(meta).map(([game, { name }]) => [game as Game, name])}
						value={selectedGame}
						onChange={setSelectedGame}
					/>
				</label>
				<label>
					<div>Rolls count:</div>
					<div>
						<input
							class="w-20"
							type="number"
							value={rolls}
							onInput={e => setRolls(+e.currentTarget.value)}
						/> + 1 (base)
					</div>
				</label>
			</LabelGrid>
			<div class="mt-4">
				<DistributionView entries={distribution} />
			</div>
			<div class="mt-2">
				Total: {distribution.reduce((sum, [, prob]) => sum + prob, 0).toLocaleString()}
			</div>
		</div>
	);
};