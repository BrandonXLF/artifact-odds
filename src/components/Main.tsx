import { useMemo } from 'preact/hooks';
import { DistMain } from './distributions/DistMain';
import { FormMain } from './form/FormMain';
import { GameContext } from '../contexts/GameContext';
import { meta } from '../data/meta';
import { Game } from '../data/game';
import { ensureTitle } from '..';
import { data } from '../data/data';
import { AssumptionsMain } from './AssumptionsMain';
import { ToggleButtons } from './input/ToggleButtons';
import { LocationProvider, RouteHook, Router, useRoute } from 'preact-iso';

const keepPathPrefixes = ["/assumptions", "/dist"];

export const Main = (props: { baseUrl?: string }) => {
	const route = useRoute() as RouteHook & { rest: string };
	const rest = keepPathPrefixes.some(prefix => route.rest.startsWith(prefix)) ? route.rest : "";

	const game = useMemo(
		() => Object.entries(meta).find(([, gameMeta]) => props.baseUrl === gameMeta.url)?.[0] as Game ?? "genshin",
		[props.baseUrl]
	);

	const contextValue = useMemo(() => ({
		game: game,
		gameMeta: meta[game],
		gameData: data[game]
	}), [game]);

	ensureTitle(meta[game].title);

	return (
		<LocationProvider scope={/^(?!\/[^/]*\/documents).*$/}>
			<main class="p-4 max-w-300 m-auto">
				<hgroup class="mb-4">
					<h1 class="text-2xl font-bold mb-2">{meta[game].title} | {meta[game].subtitle}</h1>
					<p>{meta[game].desc}</p>
				</hgroup>
				<nav class="flex gap-4 mb-4">
					<ToggleButtons value={game} options={Object.entries(meta).map(([game, { name }]) => [
						game,
						<div class="flex items-center" key={game}>
							<img src={meta[game as Game].icon} class="w-5 h-5 rounded-xs mr-1" alt="" />
							{name}
						</div>,
						`/${meta[game as Game].url}${rest}/`
					])} />
				</nav>
				<GameContext.Provider value={contextValue}>
					<Router>
						<AssumptionsMain path="/assumptions/" />
						<DistMain path="/dist/:distKey/" />
						<FormMain key={game} path="/:modeKey/" default />
					</Router>
				</GameContext.Provider>
				<footer class="mt-5">
					<span>
					Developed by Brandon Fowler (<a href="https://www.brandonfowler.me/genshin-tools/">other tools</a>)
					</span>{" "} • {" "}
					<a href="https://github.com/BrandonXLF/artifact-odds">Source code</a>
				</footer>
			</main>
		</LocationProvider>
	);
}
