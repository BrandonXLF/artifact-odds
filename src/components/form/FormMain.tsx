import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from '../input/Button';
import { Form, FormHandle } from './Form';
import { ToggleButtons } from '../input/ToggleButtons';
import Article from '../structure/Article';
import { FormContext } from '../../contexts/FormContext';
import { GameContext } from '../../contexts/GameContext';
import { modes } from '../../data/modes';
import { ensureTitle } from '../..';
import { PREFIX_BASE } from '../../utils/resettableState';

export const FormMain = (props: { initialModeNum: number }) => {
	const formRef = useRef<FormHandle>(null);
	const initialLoad = useRef(true);
	const { game, gameMeta, gameData } = useContext(GameContext);

	const loadMode = () => +(localStorage.getItem(game + PREFIX_BASE + 'lastMode') ?? '1');
	const [modeNum, setModeNum] = useState(props.initialModeNum === -1
		? loadMode()
		: props.initialModeNum
	);

	const gameModes = modes[game];

	const contextData = useMemo(() => ({
		mode: gameModes[modeNum],
		data: gameData,
	}), [gameModes, modeNum, gameData]);

	useEffect(() => {
		if (initialLoad.current) {
			initialLoad.current = false;
		} else {
			setModeNum(loadMode());
		}
	}, [game]);

	useEffect(() => {
		localStorage.setItem(game + PREFIX_BASE + 'lastMode', modeNum.toString());
	}, [modeNum])

	useEffect(() => {
		window.history.pushState(null, "", `/${gameMeta.url}/${gameModes[modeNum].url}/`);
	}, [gameMeta.url, gameModes[modeNum].url]);

	ensureTitle(`${gameModes[modeNum].name} Probability Calculator | ${gameMeta.title}`);

	return <div>
		<nav class="flex flex-wrap gap-4 mb-5">
			<ToggleButtons options={gameModes.map((mode, i) => [
				i,
				<a href={`/${gameMeta.url}/${mode.url}/`} className="plain" onClick={e => e.preventDefault()}>
					{mode.name}
				</a>
			])} value={modeNum} onChange={setModeNum} />
			<div class="flex flex-1 w-full justify-end">
				<Button onClick={() => formRef.current?.reset()}>Reset</Button>
			</div>
		</nav>
		<Article title={`${gameModes[modeNum].name} Probability Calculator`}>
			<FormContext.Provider value={contextData}>
				<Form key={game} formRef={formRef} />
			</FormContext.Provider>
		</Article>
	</div>
}
