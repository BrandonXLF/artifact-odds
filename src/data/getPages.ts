import { distributions } from "./distributions";
import { Game } from "./game";
import { meta } from "./meta";
import { modes } from "./modes";

export const getPages = () => {
	const links = ["/"];
	const gamePrefixes: string[] = [];

	Object.entries(meta).forEach(([game, { url }]) => {
		links.push(`/${url}`);
		gamePrefixes.push(url);

		modes[game as Game].forEach(mode => {
			links.push(`/${url}/${mode.url}/`);
		});
	});

	Object.entries(distributions).forEach(([distKey]) => {
		gamePrefixes.forEach(prefix => {
			links.push(`/${prefix}/dist/${distKey}/`);
		});
	});
	
	gamePrefixes.forEach(prefix => {
		links.push(`/${prefix}/assumptions/`);
	});

	return links;
}