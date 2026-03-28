export const DistributionView = (props: {
	entries: (readonly [string, number])[];
}) => {
	const maxVal = Math.max(...props.entries.map(([_, val]) => val));

	const relativeEntries = props.entries.map(([name, val]) => {
		return [name, val / maxVal] as const;
	});

	return (
		<div class="grid grid-cols-[auto_1fr] w-full gap-x-3 items-center">
			{relativeEntries.map(([name, val]) => (
				<>
					<span class="font-mono text-nowrap text-right">{name}</span>
					<div>
						<div class="h-4 bg-primary-light" style={{ width: `${val * 100}%` }}></div>
					</div>
				</>
			))}
		</div>
	);
};
