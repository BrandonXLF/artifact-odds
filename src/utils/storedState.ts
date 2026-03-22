import { useEffect, useState } from "preact/hooks";

const PREFIX = "artifact-prob-calc-";

export class ResetTrigger extends EventTarget {
	reset() {
		this.dispatchEvent(new Event('reset'));
	}
}

export const useStoredState = <T>(resetTrigger: ResetTrigger | undefined, name: string, defaultValue: T | (() => T), mergeDefault = false) => {
	const getDefault = () => typeof defaultValue === "function" ? (defaultValue as () => T)() : defaultValue;

	const [value, setValue] = useState<T>(() => {
		const stored = typeof window === "undefined" ? undefined : localStorage.getItem(PREFIX + name);
		const val = stored ? JSON.parse(stored) : getDefault();
		return mergeDefault ? { ...getDefault(), ...val } : val;
	});

	useEffect(() => {
		const str = JSON.stringify(value);

		if (typeof str === "string") {
			localStorage.setItem(PREFIX + name, str);
		} else {
			localStorage.removeItem(PREFIX + name);
		}
	}, [name, value]);

	resetTrigger?.addEventListener('reset', () => {
		setValue(getDefault());
	});

	return [value, setValue] as const;
};
