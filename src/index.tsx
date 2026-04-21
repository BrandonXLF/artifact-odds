import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './components/App';
import './style.css';

let docTitle: string | undefined = undefined;

export const ensureTitle = (title: string) => {
	if (title === docTitle) return;

	if (typeof window !== 'undefined') {
		window.document.title = title;
	}

	docTitle = title;
}

if (typeof window !== 'undefined') {
	hydrate(<App />, document.getElementById('app'));
}

export async function prerender(data) {
	const { html, links } = await ssr(<App url={data.url} />);
	const validLinks = links ? new Set([...links].filter(x => !x.includes("/documents/"))) : undefined;

	return {
		html,
		links: validLinks,
		head: { title: docTitle }
	};
}
