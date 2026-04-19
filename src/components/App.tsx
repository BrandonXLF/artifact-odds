import { useMemo, useRef, useState } from 'preact/hooks';
import { distributions } from '../data/distributions';
import { DistMain } from './distributions/DistMain';
import { FormMain } from './form/FormMain';
import { GameContext } from '../contexts/GameContext';
import { meta } from '../data/meta';
import { Game } from '../data/game';
import { modes } from '../data/modes';
import { ensureTitle } from '..';
import { data } from '../data/data';

const getRoute = (url?: string) => {
	const path = url ?? (typeof window !== "undefined" ? window.location.pathname : "");
	const parts = path.split("/").filter(Boolean);
	const gameEntry = Object.entries(meta).find(([_, { url }]) => url === parts[0]);

	if (gameEntry) {
		const game = gameEntry[0] as Game;

		if (parts[1] === "dist") {
			return [game, "dist", parts[2]] as const;
		}

		const modeNum = modes[game].findIndex(mode => mode.url === parts[1]);
		return [game, "form", modeNum === -1 ? 0 : modeNum] as const;
	}

	return ["genshin", "form", 0] as const;
}

export const App = (props: { url?: string }) => {
	let route = useRef(getRoute(props.url)).current;
	const [game, setGame] = useState(route?.[0] ?? "genshin");

	let mainEl;
	if (route?.[1] === "dist") {
		mainEl = <DistMain dist={distributions[route[2]]} />;
	} else {
		mainEl = <FormMain initialModeNum={route[2]} />
	}

	const contextValue = useMemo(() => ({
		game: game,
		setGame: setGame,
		gameMeta: meta[game],
		gameData: data[game]
	}), [game]);

	ensureTitle(meta[game].title);

	return (
		<main class="p-4 max-w-300 m-auto">
			<hgroup class="mb-4">
				<h1 class="text-2xl font-bold mb-2">{meta[game].title}</h1>
				<p>{meta[game].desc}</p>
			</hgroup>
			<GameContext.Provider value={contextValue}>
				{mainEl}
			</GameContext.Provider>
			<footer class="mt-5">
				<span>
				Developed by Brandon Fowler (<a href="https://www.brandonfowler.me/genshin-tools/">other tools</a>)
				</span>{" "} • {" "}
				<a href="https://github.com/BrandonXLF/genshin-artifact-probability-calculator">Source code</a>
			</footer>
		</main>
	);
}
