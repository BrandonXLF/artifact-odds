import { createContext } from 'preact';
import { Mode } from '../data/modes';

export interface FormContextType {
	mode: Mode;
	modeId: string;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);
