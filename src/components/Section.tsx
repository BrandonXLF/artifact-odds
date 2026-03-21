import { ComponentChildren } from "preact";

export const Section = (props: { children: ComponentChildren }) => {
	return (
		<div class="my-5 bg-[#333] p-2.5 rounded">
			{props.children}
		</div>
	);
}
