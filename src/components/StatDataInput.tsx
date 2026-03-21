import { useRef, useState } from "preact/hooks";
import { statRollValues, SubStat } from "../../logic/data";
import { Checkbox } from "./Checkbox";
import { round2, roundMaxPrecision } from "../utils/round";
import { Button } from "./Button";

export interface SingleStatDataInput {
	weight?: number;
	currentRV?: number;
	minRV?: number;
	maxRV?: number;
}

export function StatDataInput(props: Readonly<{
	entries: Record<SubStat, SingleStatDataInput>;
	validStats: SubStat[];
	onChange: (stat: SubStat, entry: SingleStatDataInput) => void;
}>) {
	const [useRV, setUseRV] = useState(false);
	const unit = useRV ? "RV%" : "Val";

	return (
		<div>
			<Checkbox label="Input roll value (RV) instead of stats" checked={useRV} onChange={setUseRV} />
			<div class="overflow-x-auto">
				<table class="mt-2 [&_td,&_th]:px-2 [&_td,&_th]:py-1 [&_td,&_th]:align-top [&_td,&_th]:first:pl-0 [&_td,&_th]:last:pr-0">
					<thead class="text-left">
						<tr>
							<th>Stat</th>
							<th>Weight</th>
							<th>Current {unit}</th>
							<th>Min {unit}</th>
							<th>Max {unit}</th>
						</tr>
					</thead>
					<tbody>
						{(Object.entries(props.entries) as [SubStat, SingleStatDataInput][])
							.filter(([stat]) => props.validStats.includes(stat))
							.map(([stat, entry]) => (
								<tr key={stat}>
									<td>{stat}</td>
									<td class="flex gap-2 items-center">
										<OptionalNumberInput
											small
											value={entry.weight}
											placeholder="0"
											onChange={(value) => props.onChange(stat, {
												...entry,
												weight: value === undefined ? value : round2(value)
											})}
										/>
										<Button onClick={() => props.onChange(stat, { ...entry, weight: 0 })}>0</Button>
										<Button onClick={() => props.onChange(stat, { ...entry, weight: 1 })}>1</Button>
									</td>
									<td>
										<StatValueInput
											useRV={useRV}
											stat={stat}
											value={entry.currentRV}
											placeholder="0"
											onChange={(value) => props.onChange(stat, { ...entry, currentRV: value })}
										/>
									</td>
									<td>
										<StatValueInput
											useRV={useRV}
											stat={stat}
											value={entry.minRV}
											placeholder="0"
											onChange={(value) => props.onChange(stat, { ...entry, minRV: value })}
										/>
									</td>
									<td>
										<StatValueInput
											useRV={useRV}
											stat={stat}
											value={entry.maxRV}
											placeholder="Infinity"
											onChange={(value) => props.onChange(stat, { ...entry, maxRV: value })}
										/>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function StatValueInput(props: Readonly<{
	value: number | undefined;
	useRV: boolean;
	stat?: SubStat;
	placeholder?: string;
	onChange: (value: number | undefined) => void;
}>) {
	let value = props.value;

	if (value !== undefined && !props.useRV && props.stat !== undefined) {
		value *= statRollValues[props.stat];
	}

	if (value !== undefined) {
		value = roundMaxPrecision(value);
	}

	const onChange = (newVal: number | undefined) => {
		if (newVal !== undefined && !props.useRV && props.stat !== undefined) {
			newVal /= statRollValues[props.stat];
		}

		props.onChange(newVal === undefined ? undefined : Math.round(newVal / 10) * 10);
	}

	return (
		<OptionalNumberInput
			value={value}
			placeholder={props.placeholder}
			onChange={onChange}
			step={props.useRV ? 10 : undefined}
		/>
	);
}

function OptionalNumberInput(props: Readonly<{
	small?: boolean;
	value: number | undefined;
	placeholder?: string;
	step?: number;
	onChange: (value: number | undefined) => void;
}>) {
	const ref = useRef<HTMLInputElement>(null);

	const onChange = () => {
		let newVal = (ref.current === null || ref.current.value === "") ? undefined : +ref.current.value;
		props.onChange(newVal);
	};

	return (
		<input
			ref={ref}
			type="number"
			value={props.value ?? ""}
			placeholder={props.placeholder}
			onChange={onChange}
			class={props.small ? "w-20" : "w-24"}
			step={props.step ?? "any"}
		/>
	);
}
