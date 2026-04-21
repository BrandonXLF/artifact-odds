import { LocationProvider, Router } from 'preact-iso';
import { Main } from './Main';

export const App = () => {
	return (
		<LocationProvider scope={/^(?!\/[^/]*\/documents).*$/}>
			<Router>
				<Main path="/:baseUrl/*" default />
			</Router>
		</LocationProvider>
	);
}
