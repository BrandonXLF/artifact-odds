import { HTMLAttributes } from "preact";
import { twMerge } from "tailwind-merge";

export const Button = ({ children, ...props }: HTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			{...props}
			class={twMerge("border bg-neutral-700 rounded p-1 min-w-10 hover:bg-neutral-600 hover:cursor-pointer", props.class as string)}
		>
			{children}
		</button>
	);
}
