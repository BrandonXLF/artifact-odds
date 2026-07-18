import { StatListInputEntry } from "../components/input/StatListInput";
import { StatParamInputEntry } from "../components/input/StatParamInput";

export type PlainStatParams =  StatListInputEntry & StatParamInputEntry;

export class StatParams implements PlainStatParams {
	currentRV: number | undefined;
	initialRV: number | undefined;

	weight: number | undefined;
	minRV: number | undefined;
	minRVRel: boolean | undefined;
	maxRV: number | undefined;
	maxRVRel: boolean | undefined;;

	constructor(init?: PlainStatParams) {
		if (init) {
			Object.assign(this, init);
		}
	}

	get minRVFinal() {
		return this.minRV === undefined
			? undefined
			: this.minRV + (this.minRVRel ? (this.currentRV ?? 0) : 0);
	}

	get maxRVFinal() {
		return this.maxRV === undefined
			? undefined
			: this.maxRV + (this.maxRVRel ? (this.currentRV ?? 0) : 0);
	}
}
