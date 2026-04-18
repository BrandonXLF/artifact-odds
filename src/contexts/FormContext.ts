import { createContext } from 'preact';
import { Mode } from '../data/modes';
import { GameData } from '../data/data';

export interface FormContextType {
	mode: Mode;
	data: GameData;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);
