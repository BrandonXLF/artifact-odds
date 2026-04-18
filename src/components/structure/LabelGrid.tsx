import { ComponentChild } from "preact";

export const LabelGrid = (props: { children: ComponentChild, tight?: boolean }) => {
	return (
		<div class={`${props.tight ? 'gap-x-3 gap-y-1' : 'gap-3 *:gap-2'} max-sm:flex max-sm:flex-col max-sm:*:flex max-sm:*:flex-col max-sm:[&>*>:first-child]:font-semibold sm:grid sm:grid-cols-[auto_1fr] sm:items-center sm:*:contents sm:[&>*>:first-child]:text-right`}>
			{props.children}
		</div>
	);
}