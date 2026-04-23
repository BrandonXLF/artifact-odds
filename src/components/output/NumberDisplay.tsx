export const NumberDisplay = (props: {
	value?: number,
	highlight?: boolean,
}) => {
	const valid = props.value !== undefined && !Number.isNaN(props.value);

	let className = "";

	if (props.highlight && valid) {
		className += " px-1 py-px bg-[#1a1a1a]";
	}

	return <span class={className}>
		{valid ? props.value!.toLocaleString() : "??"}
	</span>;
}
