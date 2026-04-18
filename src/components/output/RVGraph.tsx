export const RVGraph = (props: {
	bars: [number, boolean][],
	max?: number
}) => {
	return <>
		<div class="flex h-40 items-end mt-5 max-h-[30vw]">
			{props.bars.map(([b, isGoal], index) => (
				<div class={`flex h-full flex-1 items-end ${isGoal ? "outline-2 outline-red-600 z-10" : ""}`} key={index}>
					<div class="bg-primary flex-1" style={{ height: `${b * 100}%` }}></div>
				</div>
			))}
		</div>
		<div class="flex">
			<div class="flex-1">0%</div>
			<div>{(props.max ?? 0).toLocaleString()}%</div>
		</div>
	</>;
}