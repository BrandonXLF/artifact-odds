import { twMerge } from "tailwind-merge";
import { round2 } from "../../utils/round";
import { Button } from "../input/Button";
import { OptionalNumberInput, StatValueInput } from "./StatValueInput";
import { useContext, useMemo, useState } from "preact/hooks";
import { GameContext } from "../../contexts/GameContext";

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

export function StatParamInput<T extends StatParamInputEntry>(props: Readonly<{
	entries: Record<string, T>;
	validStats: string[];
	invalidStats?: string[];
	onChange: (stat: string, entry: T) => void;
	useRV?: boolean;
}>) {
	const { gameMeta } = useContext(GameContext);
	const [showExtra, setShowExtra] = useState(false);

	const [entries, hasExtra] = useMemo(() => {
		const allEntries = Object.entries(props.entries) as [string, T][];

		let entries: [string, T, boolean][] = allEntries
			.filter(([stat]) => props.validStats.includes(stat))
			.map(x => [...x, false]);
		let hasExtra = false;

		if (showExtra) {
			const extraEntries: [string, T, boolean][]  = allEntries
				.filter(([stat]) => props.invalidStats?.includes(stat))
				.map(x => [...x, true]);
			entries.push(...extraEntries);
			hasExtra = extraEntries.length > 0;
		} else {
			hasExtra = allEntries.some(([stat]) => props.invalidStats?.includes(stat));
		}

		return [entries, hasExtra];
	}, [props.entries, props.validStats, props.invalidStats, showExtra]);

	const entriesMaxWeight = useMemo(() => Math.max(...entries.map(([, entry]) => entry.weight || 0), 0), [entries]);
	const canNormalize = entriesMaxWeight !== 1 && entriesMaxWeight !== 0;

	const setRelWeight = (stat: string, entry: T, scale: number) => {
		const newWeight = scale === 0 ? 0 : (entriesMaxWeight || 1) * scale;
		props.onChange(stat, { ...entry, weight: round2(newWeight) });
	};

	// Normalize ALL stats, not just the visible ones, so relative weights are preserved
	const normalize = () => Object.keys(props.entries)
		.filter(stat => props.entries[stat].weight !== undefined)
		.forEach(stat => {
			props.onChange(stat, {
				...props.entries[stat],
				weight: props.entries[stat].weight! / entriesMaxWeight
			});
		});

	return (
		<div>
			<div>
				Use the {weightButtons.map(btn => 
					<><span class={`inline-block w-3 h-3 border rounded ${btn.class}`}></span>{' '}</>
				)}buttons to quickly set weights, or enter custom weights (which can be more than 1).{gameMeta.weightSource && <> A reasonable source for more granular weights is {gameMeta.weightSource}.</>}
			</div>
			<div class="overflow-x-auto">
				<table class="mt-2 [&_td,&_th]:py-1 [&_th]:align-top">
					<thead class="text-left">
						<tr>
							<th className="border-r border-b border-neutral-400">Stat</th>
							<th colSpan={2} className="border-b border-neutral-400 pl-3">Worth</th>
							<th className="border-l border-b border-neutral-400 pl-3">
								Amount
							</th>
						</tr>
						<tr>
							<th className="pr-3 pb-0.5!">Name</th>
							<th className="border-l border-neutral-400 px-3 pb-0.5!">
								<abbr title="Relative worth of each stat.">Relative Weight</abbr>{canNormalize && <>
									{' '}
									<button class="link font-normal" title="Normalize highest weight to 1." onClick={normalize}>
										[norm]
									</button>
								</>}
							</th>
							<th className="pr-3 pb-0.5!">
								<abbr title="Only count up to this much of the stat.">Max Counted</abbr>
							</th>
							<th className="border-l border-neutral-400 pl-3 pb-0.5!">
								<abbr title="Require at least this much of the stat. Implies that it is required.">Min Required</abbr>
							</th>
						</tr>
					</thead>
					<tbody>
						{entries.length === 0 && (
							<tr>
								<td colSpan={4} class="text-neutral-400">Input sub-stats above first.</td>
							</tr>
						)}
						{entries.map(([stat, entry, isExtra]) => (
							<tr key={stat} class={isExtra ? "bg-red-500/10" : ""}>
								<td className="border-r border-neutral-400 pr-3">{stat}</td>
								<td class="flex gap-2 items-center px-3">
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
								<td className="pr-3">
									<StatValueInput
										useRV={props.useRV ?? false}
										stat={stat}
										value={entry.maxRV}
										placeholder="Infinity"
										onChange={(value) => props.onChange(stat, { ...entry, maxRV: value })}
									/>
								</td>
								<td className="border-l border-neutral-400 pl-3">
									<StatValueInput
										useRV={props.useRV ?? false}
										stat={stat}
										value={entry.minRV}
										placeholder="0"
										onChange={(value) => props.onChange(stat, { ...entry, minRV: value })}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{hasExtra && <div>
				<button class="link font-normal" onClick={() => setShowExtra(!showExtra)}>
					{showExtra ? "▲ Hide" : "▼ Show"} unobtainable stats
				</button>
			</div>}
		</div>
	);
}
