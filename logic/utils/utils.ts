export const memoize = <T extends unknown[], U>(fn: (...args: T) => U): typeof fn => {
	const cache = new Map<string, U>();

	return function(...args: T): U {
		const key = JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key) as U;
		}

		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
};

export const choose = memoize((n: number, k: number): number => {
	if (k > n || k < 0) return 0;
	if (k === 0 || k === n) return 1;
	return (n / k) * choose(n - 1, k - 1);
});
