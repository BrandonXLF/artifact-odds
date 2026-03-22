import { useState } from "preact/hooks";
import { SubStat } from "../../logic/data";
import { round2 } from "../utils/round";
import { Button } from "./Button";
import { OptionalNumberInput, StatValueInput } from "./NumberInput";

export interface StatDataInputEntry {
	weight?: number;
	currentRV?: number;
	minRV?: number;
	maxRV?: number;
}

export function StatDataInput(props: Readonly<{
	entries: Record<SubStat, StatDataInputEntry>;
	validStats: SubStat[];
	showCurrentRV?: boolean;
	onChange: (stat: SubStat, entry: StatDataInputEntry) => void;
	useRV?: boolean;
}>) {
	const unit = props.useRV ? "RV%" : "Stat";

	return (
		<div>
			<div class="overflow-x-auto">
				<table class="mt-2 [&_td,&_th]:px-2 [&_td,&_th]:py-1 [&_td,&_th]:first:pl-0 [&_td,&_th]:last:pr-0">
					<thead class="text-left">
						<tr>
							<th>Stat</th>
							<th>Weight</th>
							{props.showCurrentRV && <th>Current {unit}</th>}
							<th>Min {unit}</th>
							<th>Max {unit}</th>
						</tr>
					</thead>
					<tbody>
						{(Object.entries(props.entries) as [SubStat, StatDataInputEntry][])
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
										<Button class="bg-red-900 min-w-auto w-6 h-6" title="Set weight to min" onClick={() => props.onChange(stat, { ...entry, weight: 0 })}></Button>
										<Button class="bg-green-900 min-w-auto w-6 h-6" title="Set weight to max" onClick={() => {
											const maxWeight = Math.max(...Object.values(props.entries).map(e => e.weight || 0), 1);
											props.onChange(stat, { ...entry, weight: maxWeight });
										}}></Button>
									</td>
									{props.showCurrentRV && (
										<td>
											<StatValueInput
												useRV={props.useRV ?? false}
												stat={stat}
												value={entry.currentRV}
												placeholder="0"
												onChange={(value) => props.onChange(stat, { ...entry, currentRV: value })}
											/>
										</td>
									)}
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

