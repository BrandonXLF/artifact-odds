import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { data } from '../data/data';
import { Button } from './Button';
import { Form, FormHandle } from './Form';
import { ToggleButtons } from './ToggleButtonts';
import Article from './Article';
import { FormContext } from '../contexts/FormContext';
import { GameContext } from '../contexts/GameContext';
import { meta } from '../data/meta';
import { Game } from '../data/game';
import { modes } from '../data/modes';
import { Component, ComponentChild } from 'preact';

export const FormMain = (props: { initialModeNum: number }) => {
	const formRef = useRef<FormHandle>(null);
	const { game, setGame, gameMeta } = useContext(GameContext);
	const [modeNum, setModeNum] = useState(props.initialModeNum);
	const gameModeMap = useRef<Partial<Record<Game, number>>>({
		[game]: props.initialModeNum
	});

	const gameData = data[game];
	const gameModes = modes[game];

	const contextData = useMemo(() => ({
		gameId: game,
		gameMeta: gameMeta,
		mode: gameModes[modeNum],
		data: gameData,
	}), [game, modeNum, gameModes, gameData]);

	useEffect(() => {
		setModeNum(gameModeMap.current[game] ?? 0);
	}, [game]);

	useEffect(() => {
		gameModeMap.current[game] = modeNum;
	}, [modeNum, game]);

	useEffect(() => {
		window.history.replaceState(null, "", `/${gameMeta.url}/${gameModes[modeNum].url}`);
	}, [modeNum, game, gameModes]);

	return <div>
		<nav class="flex gap-4 mb-4">
			<ToggleButtons options={Object.entries(meta).map(([game, { name }]) => [
				game,
				<div className="flex items-center">
					<img src={meta[game as Game].icon} class="w-5 h-5 rounded-xs mr-1" alt="" />
					{name}
				</div>
			] as [Game, ComponentChild])}
				value={game}
				onChange={(value) => setGame(value)}
			/>
		</nav>
		<nav class="flex flex-wrap gap-4 mb-5">
			<ToggleButtons options={gameModes.map((mode, i) => [i, mode.name])} value={modeNum} onChange={setModeNum} />
			<div class="flex flex-1 w-full justify-end">
				<Button onClick={() => formRef.current?.reset()}>Reset</Button>
			</div>
		</nav>
		<Article title={`${gameModes[modeNum].name} Probability Calculator`}>
			<FormContext.Provider value={contextData}>
				<Form formRef={formRef} />
			</FormContext.Provider>
		</Article>
	</div>
}
