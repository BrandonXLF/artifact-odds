import { ComponentChildren } from "preact";
import { twMerge } from "tailwind-merge";

export const Section = (props: { children: ComponentChildren, class?: string }) => {
	return (
		<div class={twMerge("my-5 bg-[#3a3a3a] p-3 rounded-md border border-primary", props.class)}>
			{props.children}
		</div>
	);
}
