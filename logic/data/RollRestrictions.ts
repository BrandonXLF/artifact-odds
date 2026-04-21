export default class RollRestrictions {
	constructor(
		public readonly subStatCount: number,
		public readonly lowerRollCount: number,
		public readonly upperRollCount: number,
		public readonly upperProb: number,
		public readonly guaranteedStats: Set<string> = new Set<string>(),
		private readonly _guaranteedCount: number = 0,
		public readonly unrollableStats: Set<string> = new Set<string>()
	) {}

	/**
	 * Sort in order: Guaranteed, normal, unrollable
	 */
	sortByRestrictions(subStats: string[]) {
		subStats.sort((a, b) => {
			// Sort by unrollable first
			const unrollableDiff = Number(this.unrollableStats.has(a)) - Number(this.unrollableStats.has(b));
			if (unrollableDiff !== 0) return unrollableDiff;

			// Then guaranteed
			return Number(this.guaranteedStats.has(b)) - Number(this.guaranteedStats.has(a))
		});
	}

	get rollableCount() {
		return this.subStatCount - this.unrollableStats.size;
	}

	get guaranteedCount() {
		return this.guaranteedStats.size ? this._guaranteedCount : 0;
	}
}