import { useState } from "preact/hooks";
import { StatListInput } from "./StatListInput";
import { SUB_STAT_COUNT } from "../../data/consts";

const MIN_INPUTS = 3;

export function RequireStatsOfInput(props: Readonly<{
	count: number;
	setCount: (count: number) => void;
	stats: string[];
	setStats: (stats: string[]) => void;
	validStats: string[];
}>) {
	const [requireShown, setRequireShown] = useState(MIN_INPUTS);

	return <div class="flex gap-2 items-center">
		<span>Require</span>
		<input
			type="number"
			value={props.count}
			onChange={(e) => props.setCount(Number((e.target as HTMLInputElement).value))}
			class="w-18"
			min={0}
			max={SUB_STAT_COUNT}
		/>
		<span>of</span>
		<StatListInput
			clearable
			stats={props.stats}
			count={requireShown}
			minCount={Math.max(MIN_INPUTS, props.count)}
			require={props.count}
			onChange={props.setStats}
			onCountChange={setRequireShown}
			validStats={props.validStats}
		/>
	</div>;
}
