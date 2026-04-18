export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
	const cache = new Map<string, any>();

	return function(...args: any[]): any {
		const key = JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key);
		}

		const result = fn(...args);
		cache.set(key, result);
		return result;
	} as T;
};

export const choose = memoize((n: number, k: number): number => {
	if (k > n || k < 0) return 0;
	if (k === 0 || k === n) return 1;
	return (n / k) * choose(n - 1, k - 1);
});
