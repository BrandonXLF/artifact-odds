export class StatData {
	private readonly requiredByMin: string[] = [];
	private readonly _maxWeight: number;

	constructor(
		private readonly _random: string[],
		private readonly _guaranteed: string[],
		private readonly statWeights: Partial<Record<string, number>>,
		private readonly weights: Partial<Record<string, number>>,
		private readonly mins: Partial<Record<string, number>>,
		private readonly limits: Partial<Record<string, number>>,
		private readonly required: string[],
		private readonly requiredCount: number,
		private readonly _requiredAllLinesProb: number | undefined,
		private readonly _rollValues: readonly number[]
	) {
		for (const [stat, min] of Object.entries(mins)) {
			if (min !== undefined && min > 0) this.requiredByMin.push(stat);
		}

		this._maxWeight = Math.max(...Object.values(weights).filter((w): w is number => w !== undefined), 0);
	}

	get random(): string[] {
		return this._random;
	}

	get guaranteed(): string[] {
		return this._guaranteed;
	}

	get maxWeight(): number {
		return this._maxWeight;
	}

	get rollValues(): readonly number[] {
		return this._rollValues;
	}

	get requiredAllLinesProb(): number | undefined {
		return this._requiredAllLinesProb;
	}

	meetsRequirements(combo: string[]): boolean {
		for (const stat of this.requiredByMin) {
			if (!combo.includes(stat)) return false;
		}

		if (this.requiredCount <= 0) return true;

		const count = combo.filter(stat => this.required.includes(stat)).length;
		return count >= this.requiredCount;
	}

	getRollWeight(stat: string): number {
		return this.statWeights[stat] ?? 0;
	}

	getUsefulness(stat: string): number {
		return this.weights[stat] ?? 0;
	}

	getMin(stat: string): number {
		return this.mins[stat] ?? 0;
	}

	getLimit(stat: string): number {
		return this.limits[stat] ?? Infinity;
	}
}

export class StatDataConfig {
	random: string[];

	constructor(
		allSubStats: readonly string[],
		private readonly statWeights: Partial<Record<string, number>>,
		private readonly rollValues: readonly number[]
	) {
		this.random = [...allSubStats];
	}

	weights: Partial<Record<string, number>> = {};
	mins: Partial<Record<string, number>> = {};
	limits: Partial<Record<string, number>> = {};

	guaranteed: string[] = [];
	requiredCount: number = 0;
	required: string[] = [];
	requiredAllLinesProb: number | undefined;

	onlyInclude(stats: string[]): this {
		this.random = this.random.filter((s) => stats.includes(s));
		return this;
	}

	exclude(stat: string): this {
		this.random = this.random.filter((s) => s !== stat);
		return this;
	}

	guarantee(stat: string): this {
		this.random = this.random.filter((s) => s !== stat);
		this.guaranteed.push(stat);
		return this;
	}

	require(count: number) {
		return {
			of: (...stats: string[]): this => {
				this.requiredCount = count;
				this.required = stats;
				return this;
			}
		}
	}

	requireAllLines(prob: number): this {
		this.requiredAllLinesProb = prob;
		return this;
	}

	setWeight(stat: string, weight: number): this {
		this.weights[stat] = weight;
		return this;
	}

	setMin(stat: string, min: number): this {
		this.mins[stat] = min;
		return this;
	}

	setLimit(stat: string, limit: number): this {
		this.limits[stat] = limit;
		return this;
	}

	make(): StatData {
		const weights: Partial<Record<string, number>> = {};
		const mins: Partial<Record<string, number>> = {};
		const limits: Partial<Record<string, number>> = {};

		for (const stat of [...this.random, ...this.guaranteed]) {
			weights[stat] = this.weights[stat];
			mins[stat] = this.mins[stat];
			limits[stat] = this.limits[stat];
		}

		return new StatData(
			this.random,
			this.guaranteed,
			this.statWeights,
			weights,
			mins,
			limits,
			this.required,
			this.requiredCount,
			this.requiredAllLinesProb,
			this.rollValues
		);
	}
}
