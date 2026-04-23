import { ButtonHTMLAttributes } from "preact";
import { twMerge } from "tailwind-merge";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement>, 'ref'> {
	primary?: boolean;
	link?: string;
}

export const Button = ({ children, primary, link, ...props }: Props) => {
	const className = twMerge(
		"[--bg:var(--color-neutral-700)] bg-(--bg) border min-w-8 rounded p-1",
		"not-disabled:hover:[--bg:var(--color-neutral-600)] not-disabled:hover:cursor-pointer",
		"disabled:cursor-not-allowed disabled:opacity-75",
		primary && "bg-primary-dark not-disabled:hover:bg-primary",
		props.class as string
	);

	return link
		? <a {...props} href={link} class={`plain ${className}`}>{children}</a>
		: <button {...props} class={className}>{children}</button>;
}
