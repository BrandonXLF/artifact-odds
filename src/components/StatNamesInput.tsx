import { allSubStats, SubStat } from "../../logic/data";

export function StatNamesInput(props: Readonly<{
	stats: SubStat[];
	count: number;
	validStats?: SubStat[];
	onChange: (stats: SubStat[]) => void;
	clearable?: boolean;
}>) {
	let validStats = props.validStats ?? allSubStats;
	validStats = validStats.filter(stat => !props.stats.includes(stat));

	const change = (i: number, stat: SubStat) => {
		const newStats = [...props.stats];
		newStats[i] = stat;
		props.onChange(newStats);
	};

	return (
		<div class="inline-flex gap-2 flex-wrap">
			{new Array(props.count).fill(0).map((_, index) => {
				let value = props.stats[index];
				let options = validStats;

				if (value && !options.includes(value)) {
					options = [value, ...options];
				}

				return (
					<select
						key={index}
						value={value ?? ""}
						disabled={validStats.length === 0}
						onChange={(e) => change(index, (e.target as HTMLSelectElement).value as SubStat)}
						class="min-w-20"
					>
						{props.clearable && <option value="">--</option>}
						{options.map(stat => (
							<option key={stat} value={stat}>
								{stat}
							</option>
						))}
					</select>
				);
			})}
		</div>
	);
}