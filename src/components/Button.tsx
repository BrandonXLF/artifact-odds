import { ButtonHTMLAttributes } from "preact";
import { twMerge } from "tailwind-merge";

export const Button = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			{...props}
			class={twMerge("border bg-neutral-700 rounded p-1 min-w-10 not-disabled:hover:bg-neutral-600 not-disabled:hover:cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-400", props.class as string)}
		>
			{children}
		</button>
	);
}
