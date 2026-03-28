import { ComponentChild } from "preact";
import { Button } from "./Button";

export const ToggleButtons = (props: Readonly<{
	options: readonly ComponentChild[];
	value: number;
	onChange: (value: number) => void;
	wrap?: boolean;
}>) => {
	return (
		<div class={`inline-flex gap-2 ${props.wrap ? 'flex-wrap' : ''}`}>
			{props.options.map((option, index) => (
				<Button
					onClick={() => props.onChange(index)}
					primary={props.value === index}
					class={`not-disabled:hover:bg-primary ${props.wrap ? 'shrink-0' : ''}`}
				>
					{option}
				</Button>
			))}
		</div>
	);
}
