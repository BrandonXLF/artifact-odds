export const Percentage = (props: { value: number }) => {
	return <span class="font-mono">{(props.value * 100).toPrecision(4)}%</span>;
}