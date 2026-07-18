export class StatParams {
	currentRV?: number;
	initialRV?: number;

	weight?: number;
	minRV?: number;
	minRVRel?: boolean;
	maxRV?: number;
	maxRVRel?: boolean;

	constructor(init?: Partial<StatParams>) {
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
