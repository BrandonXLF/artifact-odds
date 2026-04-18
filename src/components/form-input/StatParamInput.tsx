import { twMerge } from "tailwind-merge";
import { round2 } from "../../utils/round";
import { Button } from "../input/Button";
import { OptionalNumberInput, StatValueInput } from "./StatValueInput";

export interface StatParamInputEntry {
	weight?: number;
	minRV?: number;
	maxRV?: number;
}

interface WeightButtonAttrs {
	short: string;
	name: string;
	scale: number;
	class: string;
	hoverClass: string;
}

export const weightButtons = [
	{
		short: "1",
		name: "max",
		scale: 1,
		class: "bg-green-800",
		hoverClass: "not-disabled:hover:bg-green-700"
	},
	{
		short: "½",
		name: "half",
		scale: 0.5,
		class: "bg-amber-700",
		hoverClass: "not-disabled:hover:bg-amber-600"
	},
	{
		short: "0",
		name: "0",
		scale: 0,
		class: "bg-red-800",
		hoverClass: "not-disabled:hover:bg-red-700"
	}
];

const WeightButton = (props: Readonly<{
	attrs: WeightButtonAttrs;
	onClick: () => void;
}>) => (
	<Button
		title={`Set weight to ${props.attrs.name}`}
		class={twMerge(`min-w-auto w-6 h-6 flex items-center justify-center`, props.attrs.class, props.attrs.hoverClass)}
		onClick={() => props.onClick()}
	>{props.attrs.short}</Button>
);

export function StatParamInput(props: Readonly<{
	entries: Record<string, StatParamInputEntry>;
	validStats: string[];
	onChange: (stat: string, entry: StatParamInputEntry) => void;
	useRV?: boolean;
}>) {
	const unit = props.useRV ? "RV%" : "Stat";
	const entries = (Object.entries(props.entries) as [string, StatParamInputEntry][]).filter(([stat]) => props.validStats.includes(stat));

	const setRelWeight = (stat: string, entry: StatParamInputEntry, scale: number) => {
		const newWeight = scale === 0 ? 0 : Math.max(...Object.values(props.entries).map(e => e.weight || 0), 1) * scale;
		props.onChange(stat, { ...entry, weight: round2(newWeight) });
	};

	return (
		<div>
		<div>
			<strong>Weight</strong> is the relative worth of each stat. Use the {weightButtons.map(btn => 
				<><span class={`inline-block w-3 h-3 border rounded ${btn.class}`}></span>{' '}</>
			)}buttons to quickly set weights, or enter custom weights (which can be more than 1). A reasonable source for more granular weights is the "substat priority" %'s from <a href="https://akasha.cv" target="_blank">akasha.cv</a>.
		</div>
			<div class="overflow-x-auto">
				<table class="mt-2 [&_td,&_th]:px-2 [&_td,&_th]:py-1 [&_td,&_th]:first:pl-0 [&_td,&_th]:last:pr-0">
					<thead class="text-left">
						<tr>
							<th>Stat</th>
							<th><abbr title="Relative worth of each stat.">Weight</abbr></th>
							<th><abbr title="Require at least this much of the stat. Implies that it is required.">Min {unit}</abbr></th>
							<th><abbr title="Only count up to this much of the stat.">Max {unit}</abbr></th>
						</tr>
					</thead>
					<tbody>
						{entries.length === 0 && (
							<tr>
								<td colSpan={4} class="text-neutral-400">Input sub-stats above first.</td>
							</tr>
						)}
						{entries.map(([stat, entry]) => (
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
									{weightButtons.map((btn) => (
										<WeightButton key={btn.name} attrs={btn} onClick={() => setRelWeight(stat, entry, btn.scale)} />
									))}
								</td>
								<td>
									<StatValueInput
										useRV={props.useRV ?? false}
										stat={stat}
										value={entry.minRV}
										placeholder="0"
										onChange={(value) => props.onChange(stat, { ...entry, minRV: value })}
									/>
								</td>
								<td>
									<StatValueInput
										useRV={props.useRV ?? false}
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
