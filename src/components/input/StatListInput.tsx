import { useContext, useEffect } from "preact/hooks";
import { StatValueInput } from "./StatValueInput";
import { GameContext } from "../../contexts/GameContext";

export interface StatListInputEntry {
	currentRV: number | undefined;
	initialRV: number | undefined;
}

export function StatListInput(props: Readonly<{
	stats: string[];
	count: number;
	minCount?: number;
	require?: number;
	validStats?: string[];
	statValues?: Record<string, StatListInputEntry>;
	showInitial?: boolean;
	useRV?: boolean;
	disabled?: boolean;
	clearable?: boolean;
	hasKnownError?: boolean;
	onChange: (stats: string[]) => void;
	onValueChange?: (stat: string, type: 'currentRV' | 'initialRV', value: number | undefined) => void;
	onCountChange?: (count: number) => void;
	onErrorChange?: (hasError: boolean) => void;
}>) {
	const { gameData } = useContext(GameContext);
	const validStats = props.validStats ?? gameData.stats;
	const hasStatInput = !!props.statValues;
	const autoCount = !!props.onCountChange;

	const change = (i: number, stat: string) => {
		const newStats = [...props.stats];

		if (stat !== '') {
			// Swap with existing input for stat
			const existingWithValue = props.stats.findIndex((s, index) => s === stat && index !== i);
			if (existingWithValue !== -1) newStats[existingWithValue] = props.stats[i];
		}

		newStats[i] = stat;
		props.onChange(newStats);
	};

	useEffect(() => {
		if (!autoCount) return;
		let newCount = props.stats.length + 1;

		const nonEmptyStats = props.stats.filter(Boolean);
		if (nonEmptyStats.length !== props.stats.length) {
			props.onChange(nonEmptyStats);
			newCount = nonEmptyStats.length + 1;
		}

		if (props.minCount !== undefined && newCount < props.minCount)
			newCount = props.minCount;

		if (props.count !== newCount)
			props.onCountChange?.(newCount);
	}, [autoCount, props.stats, props.count, props.minCount]);

	let anyError = false;

	const out = (
		<div class={`inline-flex ${hasStatInput ? 'gap-x-4' : 'gap-x-2'} gap-y-3 flex-wrap`}>
			{new Array(props.count).fill(0).map((_, index) => {
				let value = props.stats[index];
				let options = validStats;
				let error = false;

				if (value && !options.includes(value)) {
					options = [value, ...options]
					error = true;
				} else if (!value && (!props.clearable || (props.require !== undefined && index < props.require))) {
					error = true;
				}

				anyError ||= error;

				return (
					<div class={`inline-grid ${hasStatInput ? 'grid-cols-2' : 'grid-cols-1'} gap-2 min-[500px]:inline-flex min-[500px]:items-center min-[500px]:flex-wrap`} key={index}>
						<div class="inline-flex items-center gap-0.5">
							<select
								value={value ?? ""}
								disabled={props.disabled || validStats.length === 0}
								onChange={(e) => change(index, (e.target as HTMLSelectElement).value)}
								class={`w-30 ${error ? "border-red-500" : ""}`}
							>
								{props.clearable && <option value="">--</option>}
								{options.map(stat => (
									<option key={stat} value={stat}>
										{stat}
									</option>
								))}
							</select>
						</div>
						{hasStatInput && <>
							<StatValueInput
								disabled={props.disabled || !value}
								useRV={props.useRV ?? false}
								stat={value}
								value={props.statValues[value]?.currentRV}
								placeholder="0"
								onChange={(statValue) => props.onValueChange?.(value, 'currentRV', statValue)}
							/>
							{props.showInitial && (
								<label class="contents min-[500px]:inline-flex items-center gap-1">
									<div class="inline-flex items-center gap-0.5 justify-end">
										<span>(</span>
										<abbr title="Initial rolls remain the same. If not provided, assumed to be unknown, which may give a significantly inaccurate probability. Imported artifacts will populate these fields.">
											Initial
										</abbr>:
									</div>
									<div class="inline-flex items-center gap-0.5">
										<StatValueInput
											disabled={props.disabled || !value}
											useRV={props.useRV ?? false}
											stat={value}
											value={props.statValues[value]?.initialRV}
											placeholder="Unknown"
											onChange={(initialValue) => props.onValueChange?.(value, 'initialRV', initialValue)}
										/>
										<span>)</span>
									</div>
								</label>
							)}
						</>}
					</div>
				);
			})}
			{autoCount && <span>...</span>}
		</div>
	);

	if (anyError !== props.hasKnownError)
		props.onErrorChange?.(anyError);

	return out;
}