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
		private readonly initial: Partial<Record<string, number>>,
		private readonly allRequired: string[],
		private readonly someRequired: string[],
		private readonly requiredCount: number,
		private readonly _requiredAllLinesProb: number | undefined,
		private readonly _rollValues: readonly number[],
		private readonly rollValueOverrides: Partial<Record<string, { rollValues: readonly number[] }>> = {}
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

	get requiredAllLinesProb(): number | undefined {
		return this._requiredAllLinesProb;
	}

	meetsRequirements(combo: string[]): boolean {
		for (const stat of this.requiredByMin) {
			if (!combo.includes(stat)) return false;
		}

		for (const stat of this.allRequired) {
			if (!combo.includes(stat)) return false;
		}

		if (this.requiredCount > 0) {
			let count = 0;

			for (const stat of this.someRequired) {
				if (combo.includes(stat)) count++;
			}

			if (count < this.requiredCount) return false;
		}

		return true;
	}

	getRollValues(stat: string): readonly number[] {
		return this.rollValueOverrides[stat]?.rollValues ?? this._rollValues;
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

	getInitial(stat: string): number {
		return this.initial[stat] ?? 0;
	}
}

export class StatDataConfig {
	random: string[];

	constructor(
		allSubStats: readonly string[],
		private readonly statWeights: Partial<Record<string, number>>,
		private readonly rollValues: readonly number[],
		private readonly rollValueOverrides: Partial<Record<string, { rollValues: readonly number[] }>> = {}
	) {
		this.random = [...allSubStats];
	}

	weights: Partial<Record<string, number>> = {};
	mins: Partial<Record<string, number>> = {};
	limits: Partial<Record<string, number>> = {};
	initial: Partial<Record<string, number>> = {};

	guaranteed: string[] = [];
	allRequired: string[] = [];
	someRequired: string[] = [];
	requiredCount: number = 0;
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

	requireAll(stats: string[]): this {
		this.allRequired = stats;
		return this;
	}

	requireSome(stats: string[], count: number): this {
		this.someRequired = stats;
		this.requiredCount = count;
		return this;
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

	setInitial(stat: string, initial: number): this {
		this.initial[stat] = initial;
		return this;
	}

	make(): StatData {
		const weights: Partial<Record<string, number>> = {};
		const mins: Partial<Record<string, number>> = {};
		const limits: Partial<Record<string, number>> = {};
		const initial: Partial<Record<string, number>> = {};

		for (const stat of [...this.random, ...this.guaranteed]) {
			weights[stat] = this.weights[stat];
			mins[stat] = this.mins[stat];
			limits[stat] = this.limits[stat];
			initial[stat] = this.initial[stat];
		}

		return new StatData(
			this.random,
			this.guaranteed,
			this.statWeights,
			weights,
			mins,
			limits,
			initial,
			this.allRequired,
			this.someRequired,
			this.requiredCount,
			this.requiredAllLinesProb,
			this.rollValues,
			this.rollValueOverrides
		);
	}
}
