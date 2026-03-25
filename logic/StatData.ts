import { allSubStats, AnyStat, statWeights, SubStat } from "./data.js";

export class StatData {
	private readonly requiredByMin: SubStat[] = [];
	private readonly _maxWeight: number;

	constructor(
		private readonly _random: SubStat[],
		private readonly _guaranteed: SubStat[],
		private readonly weights: Partial<Record<SubStat, number>>,
		private readonly mins: Partial<Record<SubStat, number>>,
		private readonly limits: Partial<Record<SubStat, number>>,
		private readonly required: SubStat[],
		private readonly requiredCount: number,
	) {
		for (const [stat, min] of Object.entries(mins)) {
			if (min > 0) this.requiredByMin.push(stat as SubStat);
		}

		this._maxWeight = Math.max(...Object.values(weights));
	}

	get random(): SubStat[] {
		return this._random;
	}

	get guaranteed(): SubStat[] {
		return this._guaranteed;
	}

	get maxWeight(): number {
		return this._maxWeight;
	}

	meetsRequirements(combo: SubStat[]): boolean {
		for (const stat of this.requiredByMin) {
			if (!combo.includes(stat)) return false;
		}

		if (this.requiredCount <= 0) return true;

		const count = combo.filter(stat => this.required.includes(stat)).length;
		return count >= this.requiredCount;
	}

	getRollWeight(stat: SubStat): number {
		return statWeights[stat] ?? 0;
	}

	getUsefulness(stat: SubStat): number {
		return this.weights[stat] ?? 0;
	}

	getMin(stat: SubStat): number {
		return this.mins[stat] ?? 0;
	}

	getLimit(stat: SubStat): number {
		return this.limits[stat] ?? Infinity;
	}
}

export class StatDataConfig {
	random: SubStat[] = [...allSubStats];

	weights: Record<SubStat, number> = {
		"HP": 0,
		"ATK": 0,
		"DEF": 0,
		"HP%": 0,
		"ATK%": 0,
		"DEF%": 0,
		"EM": 0,
		"ER%": 0,
		"CRIT Rate%": 0,
		"CRIT DMG%": 0,
	};

	mins: Record<SubStat, number> = {
		"HP": 0,
		"ATK": 0,
		"DEF": 0,
		"HP%": 0,
		"ATK%": 0,
		"DEF%": 0,
		"EM": 0,
		"ER%": 0,
		"CRIT Rate%": 0,
		"CRIT DMG%": 0,
	};

	limits: Record<SubStat, number> = {
		"HP": Infinity,
		"ATK": Infinity,
		"DEF": Infinity,
		"HP%": Infinity,
		"ATK%": Infinity,
		"DEF%": Infinity,
		"EM": Infinity,
		"ER%": Infinity,
		"CRIT Rate%": Infinity,
		"CRIT DMG%": Infinity
	};

	guaranteed: SubStat[] = [];
	requiredCount: number = 0;
	required: SubStat[] = [];

	onlyInclude(stats: SubStat[]): this {
		this.random = this.random.filter((s) => stats.includes(s));
		return this;
	}

	exclude(stat: AnyStat): this {
		this.random = this.random.filter((s) => s !== stat);
		return this;
	}

	guarantee(stat: SubStat): this {
		this.random = this.random.filter((s) => s !== stat);
		this.guaranteed.push(stat);
		return this;
	}

	require(count: number) {
		return {
			of: (...stats: SubStat[]): this => {
				this.requiredCount = count;
				this.required = stats;
				return this;
			}
		}
	}

	setWeight(stat: SubStat, weight: number): this {
		this.weights[stat] = weight;
		return this;
	}

	setMin(stat: SubStat, min: number): this {
		this.mins[stat] = min;
		return this;
	}

	setLimit(stat: SubStat, limit: number): this {
		this.limits[stat] = limit;
		return this;
	}

	make(): StatData {
		const weights: Partial<Record<SubStat, number>> = {};
		const mins: Partial<Record<SubStat, number>> = {};
		const limits: Partial<Record<SubStat, number>> = {};

		for (const stat of [...this.random, ...this.guaranteed]) {
			weights[stat] = this.weights[stat];
			mins[stat] = this.mins[stat];
			limits[stat] = this.limits[stat];
		}

		return new StatData(
			this.random,
			this.guaranteed,
			weights,
			mins,
			limits,
			this.required,
			this.requiredCount
		);
	}
}
