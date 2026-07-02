import { LocationProvider, Router } from 'preact-iso';
import { Main } from './Main';

export const App = () => {
	return (
		<LocationProvider scope={/(\/artifact-odds|\/relic-odds)(?!\/documents)/}>
			<Router>
				<Main path="/:baseUrl/*" default />
			</Router>
		</LocationProvider>
	);
}
