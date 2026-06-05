import { useContext, useRef } from "preact/hooks";
import { roundMaxPrecision } from "../../utils/round";
import { GameContext } from "../../contexts/GameContext";

export const StatValueInput = (props: Readonly<{
	disabled?: boolean;
	value: number | undefined;
	useRV: boolean;
	stat?: string;
	placeholder?: string;
	onChange: (value: number | undefined) => void;
}>) => {
	const { gameData } = useContext(GameContext);
	let value = props.value;

	if (value !== undefined && !props.useRV && props.stat !== undefined) {
		value *= gameData.statValues[props.stat];
	}

	if (value !== undefined) {
		value = roundMaxPrecision(value);
	}

	const onChange = (newVal: number | undefined) => {
		if (newVal !== undefined && !props.useRV && props.stat !== undefined) {
			newVal /= gameData.statValues[props.stat];
		}

		if (newVal !== undefined) {
			newVal = roundMaxPrecision(newVal);
		}

		props.onChange(newVal === undefined ? undefined : Math.round(newVal / 10) * 10);
	}

	return (
		<OptionalNumberInput
			disabled={props.disabled}
			value={value}
			placeholder={props.placeholder + (props.useRV ? " RV%" : "")}
			onChange={onChange}
			step={props.useRV ? 10 : undefined}
		/>
	);
};

export const OptionalNumberInput = (props: Readonly<{
	disabled?: boolean;
	small?: boolean;
	value: number | undefined;
	placeholder?: string;
	step?: number;
	onChange: (value: number | undefined) => void;
}>) => {
	const ref = useRef<HTMLInputElement>(null);

	const onChange = () => {
		let newVal = (ref.current === null || ref.current.value === "") ? undefined : +ref.current.value;
		props.onChange(newVal);
	};

	return (
		<input
			disabled={props.disabled}
			ref={ref}
			type="number"
			value={props.value ?? ""}
			placeholder={props.placeholder}
			onInput={() => {}}
			onChange={onChange}
			class={props.small ? "w-20" : "w-26"}
			step={props.step ?? "any"}
		/>
	);
};
