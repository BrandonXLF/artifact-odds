import { useEffect, useState } from "preact/hooks";
import { Percentage } from "./Percentage";
import { NumberDisplay } from "./NumberDisplay";

export const SimulationOutput = (props: {
	mainProb: number | undefined;
	worker: Worker | undefined;
	onTerminate: () => void;
}) => {
	const [simulatedProb, setSimulatedProb] = useState<[number, number] | undefined>(undefined);

	useEffect(() => {
		const handler = (event: MessageEvent<[number, number]>) => setSimulatedProb(event.data);
		props.worker?.addEventListener("message", handler);
		return () => props.worker?.removeEventListener("message", handler);
	}, [props.worker]);

	return (
		<>
			{simulatedProb
				? <><Percentage highlight value={(props.mainProb ?? 1) * simulatedProb[0]} /> (<NumberDisplay value={simulatedProb[1]} /> runs)</>
				: <>Running...</>}
			{props.worker && <button class="link ml-2" onClick={() => props.onTerminate()}>
				Stop
			</button>}
		</>
	);
};