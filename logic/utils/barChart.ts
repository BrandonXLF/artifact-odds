export const bucketSize = 5;
export const toBucket = (value: number, maxWeight: number) => Math.floor(value / (bucketSize * maxWeight));
