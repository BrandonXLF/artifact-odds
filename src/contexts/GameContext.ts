import { createContext } from 'preact';
import { meta } from '../data/meta';
import { Game } from '../data/game';

export interface GameContextType {
	game: Game;
	setGame: (game: Game) => void;
	gameMeta: (typeof meta)[Game];
}

export const GameContext = createContext<GameContextType>({
	game: "genshin",
	setGame: () => {},
	gameMeta: meta.genshin
});
