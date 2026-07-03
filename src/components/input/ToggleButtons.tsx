import { ComponentChild } from "preact";
import { Button } from "./Button";

export const ToggleButtons = <T extends string | number | boolean>(props: Readonly<{
	options: (T | [T, ComponentChild] | [T, ComponentChild, string])[];
	value: T;
	onChange?: (value: T) => void;
	noShrink?: boolean;
}>) => {
	return (
		<div class={`inline-flex gap-2 flex-wrap`}>
			{props.options.map(option => {
				const value = Array.isArray(option) ? option[0] : option;
				const content = Array.isArray(option) ? option[1] : option;
				const link = Array.isArray(option) ? option[2] : undefined;
				const className = `not-disabled:hover:bg-primary grow shrink-0 ${props.noShrink ? '' : 'basis-[min-content]'} max-w-max`;

				return <Button key={value} onClick={() => props.onChange?.(value)} primary={props.value === value} link={link} class={className}>
					{content}
				</Button>;
			})}
		</div>
	);
}
