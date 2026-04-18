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
				"[--bg:var(--color-neutral-700)] bg-(--bg) border min-w-8 rounded p-1",
				"not-disabled:hover:[--bg:var(--color-neutral-600)] not-disabled:hover:cursor-pointer",
				"disabled:cursor-not-allowed disabled:opacity-75",
				primary && "bg-primary-dark not-disabled:hover:bg-primary",
				props.class as string
			)}
		>
			{children}
		</button>
	);
}
