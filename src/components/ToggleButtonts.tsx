import { Button } from "./Button";

export const ToggleButtons = (props: Readonly<{
	options: readonly string[];
	value: number;
	onChange: (value: number) => void;
}>) => {
	return (
		<div class="inline-flex gap-2">
			{props.options.map((option, index) => (
				<Button
					key={option}
					onClick={() => props.onChange(index)}
					class={props.value === index ? "bg-primary-dark" : "bg-neutral-700"}
				>
					{option}
				</Button>
			))}
		</div>
	);
}
