import { memoize } from "../../logic/utils/math";

export const factorial = memoize((n: number): number => {
	if (n === 0 || n === 1) return 1;
	return n * factorial(n - 1);
});
