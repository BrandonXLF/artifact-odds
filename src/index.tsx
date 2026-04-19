import { hydrate, prerender as ssr } from 'preact-iso';
import { App } from './components/App';
import './style.css';
import { getPages } from './data/getPages';

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
	const { html } = await ssr(<App url={data.url} />);

	return {
		html,
		links: getPages(),
		head: {
			title: docTitle
		}
	};
}
