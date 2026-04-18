import { ComponentChild } from "preact";

export default function Article(props: Readonly<{ title: string, children: ComponentChild }>) {
	return <article>
		<h2 class="text-xl font-bold mb-5">{props.title}</h2>
		{props.children}
	</article>;
}