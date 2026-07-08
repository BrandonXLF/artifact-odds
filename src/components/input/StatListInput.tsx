import { useContext, useMemo } from "preact/hooks";
import { StatValueInput } from "./StatValueInput";
import { GameContext } from "../../contexts/GameContext";

export interface StatListInputEntry {
	currentRV?: number;
}

export function StatListInput(props: Readonly<{
	stats: string[];
	count: number;
	validStats?: string[];
	statValues?: Record<string, StatListInputEntry>;
	initialValues?: Record<string, StatListInputEntry>;
	useRV?: boolean;
	disabled?: boolean;
	onChange: (stats: string[]) => void;
	onValueChange?: (stat: string, value: number | undefined) => void;
	onInitialChange?: (stat: string, value: number | undefined) => void;
	clearable?: boolean;
	hasKnownError?: boolean;
	onErrorChange?: (hasError: boolean) => void;
}>) {
	const { gameData } = useContext(GameContext);
	const validStats = props.validStats ?? gameData.stats;
	const selectableStats = validStats.filter(stat => !props.stats.includes(stat));

	const change = (i: number, stat: string) => {
		const newStats = [...props.stats];
		newStats[i] = stat;
		props.onChange(newStats);
	};

	let anyError = false;

	const out = (
		<div class={`inline-flex ${props.statValues || props.initialValues ? 'gap-4' : 'gap-2'} flex-wrap`}>
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
					<div class="inline-flex items-center gap-2" key={index}>
						<div class="inline-flex items-center gap-0.5">
							<select
								value={value ?? ""}
								disabled={props.disabled || selectableStats.length === 0}
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
							{props.statValues || props.initialValues ? <span>:</span> : null}
						</div>
						{props.statValues && (
							<StatValueInput
								disabled={props.disabled || !value}
								useRV={props.useRV ?? false}
								stat={value}
								value={props.statValues[value]?.currentRV}
								placeholder="0"
								onChange={(statValue) => props.onValueChange?.(value, statValue)}
							/>
						)}
						{props.initialValues && <>
							{!props.statValues && <span>
								Current:{' '}
								<abbr title="Since goal is being manually inputted, the current rolls are not needed for comparison.">n/a</abbr>
							</span>}
							<div class="inline-flex items-center gap-0.5">
								<span>(</span>
								<span class="mr-1">
									<abbr title="Initial rolls remain the same. If not provided, assumed to be unknown, which may give a significantly inaccurate probability. Imported artifacts will populate these fields.">
										Initial
									</abbr>:
								</span>
								<StatValueInput
									disabled={props.disabled || !value}
									useRV={props.useRV ?? false}
									stat={value}
									value={props.initialValues[value]?.currentRV}
									placeholder="Unknown"
									onChange={(initialValue) => props.onInitialChange?.(value, initialValue)}
								/>
								<span>)</span>
							</div>
						</>}
					</div>
				);
			})}
		</div>
	);

	if (anyError !== props.hasKnownError) props.onErrorChange?.(anyError);

	return out;
}