import { createContext } from 'preact';
import { Mode } from '../data/modes';

export interface FormContextType {
	mode: Mode;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);
