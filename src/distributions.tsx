import { ComponentChildren } from "preact";
import { RollDist } from "./components/RollCountDist";
import { RollValueDist } from "./components/ValueOfRollsDist";

export interface Distribution {
	name: string;
	component: () => ComponentChildren
}

export const distributions: Record<string, Distribution> = {
	"roll-counts": {
		name: "Roll Counts",
		component: () => <RollDist />
	},
	"value-of-rolls": {
		name: "Value of Rolls",
		component: () => <RollValueDist />
	}
}
