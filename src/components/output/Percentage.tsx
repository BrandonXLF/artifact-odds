import { HTMLAttributes } from "preact";

export const Percentage = (props: {
	value?: number,
	showQuality?: number,
	highlight?: boolean,
	isChange?: boolean
}) => {
	const valid = props.value !== undefined && !Number.isNaN(props.value);

	let className = "";
	const style: HTMLAttributes<HTMLSpanElement>['style'] = {};

	if (valid) {
		if (props.showQuality !== undefined) {
			const percent = Math.max(Math.min(props.value! * props.showQuality * 100, 100), 0);
			className += " px-1 py-px";
			style.background = `color-mix(in lab, var(--color-red-700), var(--color-green-700) ${percent}%)`;
		} else if (props.highlight) {
			className += " px-1 py-px bg-[#1a1a1a]";
		}

		if (props.isChange) {
			className = props.value! < 0 ? "text-red-300" : "text-green-300";
		}
	}

	return <span class={className} style={style}>
		{props.isChange && props.value! >= 0 ? '+' : ''}{valid ? (props.value! * 100).toPrecision(Math.max(4, Math.floor(Math.log10(Math.abs(props.value!) * 100)) + 3)) : "??"}%
	</span>;
}
