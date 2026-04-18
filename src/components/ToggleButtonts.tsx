import { ComponentChild } from "preact";
import { Button } from "./Button";

export const ToggleButtons = <T extends string | number | boolean>(props: Readonly<{
	options: (T | [T, ComponentChild])[];
	value: T;
	onChange: (value: T) => void;
	wrap?: boolean;
}>) => {
	return (
		<div class={`inline-flex gap-2 ${props.wrap ? 'flex-wrap' : ''}`}>
			{props.options.map(option => (
				<Button
					key={Array.isArray(option) ? option[0] : option}
					onClick={() => props.onChange(Array.isArray(option) ? option[0] : option)}
					primary={props.value === (Array.isArray(option) ? option[0] : option)}
					class={`not-disabled:hover:bg-primary ${props.wrap ? 'shrink-0' : ''}`}
				>
					{Array.isArray(option) ? option[1] : option}
				</Button>
			))}
		</div>
	);
}
