import { ComponentChildren } from "preact";
import { twMerge } from "tailwind-merge";

export const Section = (props: { children: ComponentChildren, class?: string }) => {
	return (
		<div
			style={{
				background: "linear-gradient(315deg, color-mix(in lab, #383838, var(--color-primary-dark) 25%), #383838)",
			}}
			class={twMerge("my-5 p-3 rounded-md border border-primary", props.class)}
		>
			{props.children}
		</div>
	);
}
