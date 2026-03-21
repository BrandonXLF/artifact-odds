import { SubStat } from "../logic/data";
import { StatData } from "../logic/StatData";
import { runSimulator } from "./main";

export interface EstimatorWorkerData {
	statData: StatData;
	goal: number;
	allLinesProb: number;
	fixedStats?: SubStat[];
	guaranteedRollsStats?: Set<SubStat>;
	guaranteedRollsCount?: number;
}

addEventListener("message", (e: MessageEvent<EstimatorWorkerData>) => {
	const { statData, goal, allLinesProb, fixedStats, guaranteedRollsStats, guaranteedRollsCount } = e.data;
	Object.setPrototypeOf(statData, StatData.prototype);

	let resultSum = 0;
	let times = 0;

	while (true) {
		resultSum += runSimulator(statData, goal, allLinesProb, fixedStats, guaranteedRollsStats, guaranteedRollsCount);
		times++;
		postMessage(resultSum / times);
	}
});
