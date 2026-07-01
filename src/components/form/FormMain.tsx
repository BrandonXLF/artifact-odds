import { useContext, useEffect, useMemo, useRef } from 'preact/hooks';
import { Button } from '../input/Button';
import { Form, FormHandle } from './Form';
import { ToggleButtons } from '../input/ToggleButtons';
import Article from '../structure/Article';
import { FormContext } from '../../contexts/FormContext';
import { GameContext } from '../../contexts/GameContext';
import { modes } from '../../data/modes';
import { ensureTitle } from '../..';
import { PREFIX_BASE } from '../../utils/resettableState';

export const FormMain = (props: { modeKey?: string }) => {
	const formRef = useRef<FormHandle>(null);
	const { game, gameMeta } = useContext(GameContext);

	const loadMode = () => {
		const loaded = typeof localStorage === "undefined" ? null : localStorage.getItem(game + PREFIX_BASE + 'lastMode');
		if (loaded === null || !(loaded in modes[game])) return Object.keys(modes[game])[0];
		return loaded;
	};

	const gameModes = modes[game];
	const modeKey = useMemo(() => props.modeKey ? props.modeKey : loadMode(), [props.modeKey]);
	const validMode = modeKey in gameModes;

	const contextData = useMemo(() => ({
		mode: gameModes[modeKey],
	}), [gameModes, modeKey]);

	useEffect(() => {
		localStorage.setItem(game + PREFIX_BASE + 'lastMode', modeKey.toString());
	}, [modeKey])

	ensureTitle(validMode
		? `${gameModes[modeKey].name} Probability Calculator - ${gameMeta.title}`
		: `Unknown Mode - ${gameMeta.title}`
	);

	return <div>
		<nav class="flex flex-wrap gap-4 mb-5">
			<ToggleButtons
				value={modeKey} 
				options={Object.entries(gameModes).map(([key, mode]) => [key, mode.name, `/${gameMeta.url}/${key}/`])}
			/>
			{validMode && <div class="flex flex-1 w-full justify-end">
				<Button onClick={() => formRef.current?.reset()}>Reset</Button>
			</div>}
		</nav>
		<Article title={validMode ? `${gameModes[modeKey].name} Probability Calculator` : "Unknown Mode"}>
			{validMode
				? <FormContext.Provider value={contextData}>
					<Form formRef={formRef} />
				</FormContext.Provider>
				: <p>Please select one of the modes above.</p>}
		</Article>
	</div>
}
