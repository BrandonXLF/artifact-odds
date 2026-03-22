import { allSubStats, SubStat } from "../../logic/data";
import { StatValueInput } from "./NumberInput";

export function StatNamesInput(props: Readonly<{
	stats: SubStat[];
	count: number;
	validStats?: SubStat[];
	statValues?: Record<SubStat, { currentRV?: number }>;
	useRV?: boolean;
	onChange: (stats: SubStat[]) => void;
	onValueChange?: (stat: SubStat, value: number | undefined) => void;
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
		<div class={`inline-flex ${props.statValues ? 'gap-4' : 'gap-2'} flex-wrap`}>
			{new Array(props.count).fill(0).map((_, index) => {
				let value = props.stats[index];
				let options = selectableStats;
				let error = false;

				if (value && !options.includes(value)) {
					options = [value, ...options];
					error = !validStats.includes(value);
				}

				if (!value && !props.clearable) {
					error = true;
				}

				anyError = anyError || error;

				return (
					<div class="inline-flex gap-2">
						<select
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
						{props.statValues && (
							<StatValueInput
								disabled={!value}
								useRV={props.useRV ?? false}
								stat={value}
								value={props.statValues[value]?.currentRV}
								placeholder="0"
								onChange={(statValue) => props.onValueChange?.(value, statValue)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	if (anyError !== props.hasKnownError) props.onErrorChange?.(anyError);

	return out;
}