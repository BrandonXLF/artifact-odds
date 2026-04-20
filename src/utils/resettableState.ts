import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { GameContext } from "../contexts/GameContext";

export const PREFIX_BASE = "-arti-prob-";

export class ResetTrigger extends EventTarget {
	reset() {
		this.dispatchEvent(new Event('reset'));
	}
}

type DefaultType = string | number | boolean | any[] | undefined | null | bigint | object;

export const useResettableState = <T extends DefaultType>(defaultValue: T | ((reset: boolean) => T), resetTrigger?: ResetTrigger) => {
	const [value, setValue] = useState<T>(typeof defaultValue === "function" ? defaultValue(false) : defaultValue);

	useEffect(() => {
		const reset = () => setValue(typeof defaultValue === "function" ? defaultValue(true) : defaultValue);
		resetTrigger?.addEventListener('reset', reset);
		return () => resetTrigger?.removeEventListener('reset', reset);
	}, [resetTrigger]);

	return [value, setValue] as const;
}

export const useStoredState = <T extends DefaultType>(name: string, defaultValue: T | (() => T), resetTrigger?: ResetTrigger, mergeDefault = false) => {
	const { game } = useContext(GameContext);
	const prefix = game + PREFIX_BASE;

	const load = () => {
		const getDefault = () => typeof defaultValue === "function" ? defaultValue() : defaultValue;
		const stored = typeof window === "undefined" ? undefined : localStorage.getItem(prefix + name);
		const val = stored ? JSON.parse(stored) : getDefault();
		return mergeDefault ? { ...getDefault(), ...val } : val;
	};

	const [value, setValue] = useResettableState<T>((reset) => {
		if (reset) localStorage.removeItem(prefix + name);
		return reset ? (typeof defaultValue === "function" ? defaultValue() : defaultValue) : load();
	}, resetTrigger);

	const initialStr = useRef(JSON.stringify(value)).current;

	useEffect(() => {
		const str = JSON.stringify(value);

		if (typeof str === "string" || str === initialStr) {
			localStorage.setItem(prefix + name, str);
		} else {
			localStorage.removeItem(prefix + name);
		}
	}, [name, value]);

	return [value, setValue] as const;
};
