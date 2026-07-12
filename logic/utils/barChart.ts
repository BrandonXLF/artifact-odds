export const bucketSize = 5;
export const toBucket = (value: number, maxWeight: number) => maxWeight == 0 ? 0 : Math.floor(value / (bucketSize * maxWeight));
export const toRange = (bucket: number, maxWeight: number) => {
	const min = bucket * bucketSize * maxWeight;
	const max = (bucket + 1) * bucketSize * maxWeight - 1;
	return [min, max] as const;
}
