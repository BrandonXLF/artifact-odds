import { ButtonHTMLAttributes } from "preact";
import { twMerge } from "tailwind-merge";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	primary?: boolean;
}

export const Button = ({ children, primary, ...props }: Props) => {
	return (
		<button
			{...props}
			class={twMerge(
				"border bg-neutral-700 min-w-8 rounded p-1 not-disabled:hover:bg-neutral-600 not-disabled:hover:cursor-pointer disabled:cursor-not-allowed disabled:text-neutral-400",
				primary && "bg-primary-dark not-disabled:hover:bg-primary",
				props.class as string
			)}
		>
			{children}
		</button>
	);
}
