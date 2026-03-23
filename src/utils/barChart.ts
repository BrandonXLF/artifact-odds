export const bucketSize = 4;

export const toBucket = (value: number, maxWeight: number) => Math.floor(value / (bucketSize * maxWeight));

export const bucketsLimit = (buckets: unknown[], maxWeight: number) => {
	return (buckets.length - 1) * (bucketSize * maxWeight);
};
