import { ComponentChildren, RefObject } from "preact";
import { twMerge } from "tailwind-merge";

export const VisualSection = (props: {
	children: ComponentChildren,
	class?: string,
	elementRef?: RefObject<HTMLDivElement>
}) => {
	return <div
		ref={props.elementRef}
		style={{
			background: "linear-gradient(315deg, color-mix(in lab, #383838, var(--color-primary-dark) 25%), #383838)",
		}}
		class={twMerge("my-5 scroll-mt-[calc(var(--toolbar-height,0px)+12px)] p-3 rounded-md border border-primary", props.class)}
	>
		{props.children}
	</div>;
}
