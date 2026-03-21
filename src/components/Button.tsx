import { HTMLAttributes } from "preact";

export const Button = ({ children, ...props }: HTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			{...props}
			className="border bg-neutral-700 rounded p-1 min-w-10 hover:bg-neutral-600 hover:cursor-pointer"
		>
			{children}
		</button>
	);
}
