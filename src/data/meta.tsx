import { ComponentChild } from "preact";
import { Game } from "./game";

export interface GameMeta {
	name: string;
	url: string;
	title: string;
	desc: string;
	icon: string;
	weightSource?: ComponentChild;
}

export const meta: Record<Game, GameMeta> = {
	genshin: {
		name: "Genshin Impact",
		url: "artifact-copium",
		title: "Artifact Copium | Genshin Artifact Probability Calculator",
		desc: "Calculate the probability of obtaining, creating, and rerolling five star artifacts that improve your build.",
		icon: "/artifact-copium/genshin.jpg",
		weightSource: <>the "substat priority" %'s from <a href="https://akasha.cv" target="_blank">akasha.cv</a></>
	},
	hsr: {
		name: "Honkai: Star Rail",
		url: "relic-copium",
		title: "Relic Copium | Honkai: Star Rail Relic Probability Calculator",
		desc: "Calculate the probability of obtaining, creating, and rerolling five star relics that improve your build.",
		icon: "/artifact-copium/hsr.jpg",
		weightSource: <>the "substat upgrade comparisons" &Delta; %'s from <a href="https://fribbels.github.io/hsr-optimizer/" target="_blank">Fribbels</a></>
	}
}
