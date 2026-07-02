import { Fraction } from "fraction.js";

export const DistributionView = (props: {
	entries: (readonly [string, number])[];
}) => {
	const maxVal = Math.max(...props.entries.map(([_, val]) => val));

	const relativeEntries = props.entries.map(([name, val]) => {
		return [name, val / maxVal, val] as const;
	});

	return (
		<div class="grid grid-cols-[auto_auto_1fr] w-full gap-x-2 items-center">
			{relativeEntries.map(([name, relVal, val]) => (
				<>
					<span class="font-mono text-nowrap text-right">{name}</span>
					<div>({new Fraction(val).toFraction(true)})</div>
					<div>
						<div class="h-4 bg-primary-light" style={{ width: `${relVal * 100}%` }}></div>
					</div>
				</>
			))}
		</div>
	);
};
