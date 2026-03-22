import { ComponentChildren } from "preact";
import { twMerge } from "tailwind-merge";

export const Section = (props: { children: ComponentChildren, class?: string }) => {
	return (
		<div class={twMerge("my-5 bg-[#333] p-2.5 rounded bg-linear-[to_right,#333,#2c2c44]", props.class)}>
			{props.children}
		</div>
	);
}
