import { createContext } from 'preact';
import { meta } from '../data/meta';
import { Game } from '../data/game';
import { data, GameData } from '../data/data';

export interface GameContextType {
	game: Game;
	gameMeta: (typeof meta)[Game];
	gameData: GameData;
}

export const GameContext = createContext<GameContextType>({
	game: "genshin",
	gameMeta: meta.genshin,
	gameData: data.genshin
});
