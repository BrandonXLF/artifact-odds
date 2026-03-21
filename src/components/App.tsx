import { distributions } from '../distributions';
import { DistMain } from './DistMain';
import { Form } from './Form';

export const App = () => {
	const distKey = new URLSearchParams(window.location.search).get("dist");
	const dist = distKey ? distributions[distKey] : undefined;

	return (
		<main class="p-4 max-w-300 m-auto">
			<hgroup class="mb-4">
				<h1 class="text-2xl font-bold mb-2">Genshin Artifact Probability Calculator</h1>
				<p>Calculate the probability of obtaining, creating, and rerolling artifacts that improve your build.</p>
			</hgroup>
			{dist ? <DistMain dist={dist} /> : <Form />}
			<footer class="mt-5">
				<span>
				Developed by Brandon Fowler (<a href="https://www.brandonfowler.me/genshin-tools/">other tools</a>)
				</span>{" "} • {" "}
				<a href="https://github.com/BrandonXLF/genshin-artifact-probability-calculator">Source code</a>
			</footer>
		</main>
	);
};
