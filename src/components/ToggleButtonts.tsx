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
					primary={props.value === index}
					class="not-disabled:hover:bg-primary"
				>
					{option}
				</Button>
			))}
		</div>
	);
}
