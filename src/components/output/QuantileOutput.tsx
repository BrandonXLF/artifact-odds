import { Fragment } from "preact/jsx-runtime";
import { NumberDisplay } from "./NumberDisplay";

const quantiles = [0.25, 0.5, 0.75, 0.8, 0.9, 0.95, 0.99];

export const QuantileOutput = (props: {
	prob: number;
	costPerTime: number;
}) => {
	return <div class="inline-flex gap-x-2 flex-wrap">
		{quantiles.map((q, i) => {
			const times = Math.floor(Math.log(1 - q) / Math.log(1 - props.prob) * props.costPerTime) + 1;
			return <Fragment key={q}>
				{i > 0 ? <span class="opacity-40">|</span> : <></>}
				<span class="text-nowrap">{q * 100}%: <NumberDisplay value={times} /></span>
			</Fragment>;
		})}
	</div>;
};
