export const Checkbox = (props: Readonly<{
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (checked: boolean) => void;
}>) => {
	return (
		<label class="inline-flex items-center gap-2">
			<input type="checkbox" checked={props.checked} disabled={props.disabled} onChange={() => props.onChange(!props.checked)} />
			{props.label}
		</label>
	);
}
