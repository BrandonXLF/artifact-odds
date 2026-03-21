export const bucketSize = 400;

export const toBucket = (value: number) => Math.floor(value / bucketSize);

export const bucketsLimit = (buckets: unknown[]) => {
	return (buckets.length - 1) * bucketSize;
};
