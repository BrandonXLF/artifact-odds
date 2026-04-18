import RollRestrictions from "../logic/RollRestrictions";
import { StatData } from "../logic/StatData";
import { runSimulator, SIMULATIONS_PER_RUN } from "./main";

export interface EstimatorWorkerData {
	statData: StatData;
	rollRestrictions: RollRestrictions;
	goal: number;
	fixedStats?: string[];
}

addEventListener("message", (e: MessageEvent<EstimatorWorkerData>) => {
	const { statData, rollRestrictions, goal, fixedStats } = e.data;

	Object.setPrototypeOf(statData, StatData.prototype);
	Object.setPrototypeOf(rollRestrictions, RollRestrictions.prototype);

	let resultSum = 0;
	let times = 0;

	while (true) {
		resultSum += runSimulator(statData, rollRestrictions, goal, fixedStats);
		times++;
		postMessage([resultSum / times, times * SIMULATIONS_PER_RUN]);
	}
});
