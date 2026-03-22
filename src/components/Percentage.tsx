import { HTMLAttributes } from "preact";

export const Percentage = (props: {
	value?: number,
	showQuality?: number
}) => {
	const valid = props.value !== undefined && !Number.isNaN(props.value);

	let className = "";
	const style: HTMLAttributes<HTMLSpanElement>['style'] = {};

	if (props.showQuality !== undefined && valid) {
		const percent = Math.max(Math.min(props.value! * props.showQuality * 100, 100), 0);
		className += " px-1 py-px";
		style.background = `color-mix(in lab, var(--color-red-700), var(--color-green-700) ${percent}%)`;
	}

	return <span class={className} style={style}>
		{valid ? (props.value! * 100).toPrecision(4) : "??"}%
	</span>;
}
