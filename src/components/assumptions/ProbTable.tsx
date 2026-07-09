export const ProbTable = ({ children }: { children: preact.ComponentChildren }) => {
	return <div>
		<div
			className="border border-primary p-2 w-max rounded-lg"
			style="background: linear-gradient(315deg, color-mix(in lab, #383838, var(--color-primary-dark) 25%), #383838);"
		>
			<table class="leading-6 w-full [&_th]:text-left [&_td,&_th]:px-2 [&_td,&_th]:first:pl-0 [&_td,&_th]:last:pr-0">
				{children}
			</table>
		</div>
	</div>;
}
