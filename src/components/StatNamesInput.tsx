import { twMerge } from "tailwind-merge";
import { allSubStats, SubStat } from "../../logic/data";

export function StatNamesInput(props: Readonly<{
	stats: SubStat[];
	count: number;
	validStats?: SubStat[];
	onChange: (stats: SubStat[]) => void;
	clearable?: boolean;
	hasKnownError?: boolean;
	onErrorChange?: (hasError: boolean) => void;
}>) {
	const validStats = props.validStats ?? allSubStats;
	const selectableStats = validStats.filter(stat => !props.stats.includes(stat));

	const change = (i: number, stat: SubStat) => {
		const newStats = [...props.stats];
		newStats[i] = stat;
		props.onChange(newStats);
	};

	let anyError = false;

	const out = (
		<div class="inline-flex gap-2 flex-wrap">
			{new Array(props.count).fill(0).map((_, index) => {
				let value = props.stats[index];
				let options = selectableStats;
				let error = false;

				if (value && !options.includes(value)) {
					options = [value, ...options];
					error = !validStats.includes(value);
				}

				anyError = anyError || error;

				return (
					<select
						key={index}
						value={value ?? ""}
						disabled={selectableStats.length === 0}
						onChange={(e) => change(index, (e.target as HTMLSelectElement).value as SubStat)}
						class={`min-w-20 ${error ? "border-red-500" : ""}`}
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

	if (anyError !== props.hasKnownError) props.onErrorChange?.(anyError);

	return out;
}