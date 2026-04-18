import { Game } from "./game";

export interface GameMeta {
	name: string;
	url: string;
	title: string;
	desc: string;
	icon: string;
}

export const meta: Record<Game, GameMeta> = {
	genshin: {
		name: "Genshin Impact",
		url: "artifact-copium",
		title: "Artifact Copium | Genshin Artifact Probability Calculator",
		desc: "Calculate the probability of obtaining, creating, and rerolling five star artifacts that improve your build.",
		icon: "/artifact-copium/genshin.jpg"
	},
	hsr: {
		name: "Honkai: Star Rail",
		url: "relic-copium",
		title: "Relic Copium | Honkai: Star Rail Relic Probability Calculator",
		desc: "Calculate the probability of obtaining, creating, and rerolling five star relics that improve your build.",
		icon: "/artifact-copium/hsr.jpg"
	}
}
