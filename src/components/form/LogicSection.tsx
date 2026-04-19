import { useContext } from "preact/hooks";
import { distributions } from "../../data/distributions";
import { DocumentLink } from "../misc/DocumentLink";
import { VisualSection } from "../structure/VisualSection";
import { GameContext } from "../../contexts/GameContext";

export const LogicSection = () => {
	const { gameMeta } = useContext(GameContext);

	return <VisualSection>
		<div>
			<a href={`/${gameMeta.url}/assumptions/`} target="arp-assumptions">Assumptions</a>,{' '}
			<DocumentLink name="calculating-artifact-roll-outcomes.pdf">Overview of Logic</DocumentLink>
		</div>
		<div>
			Distribution viewers: {Object.entries(distributions).map(([key, { name }], i) => (
				<>{i === 0 ? "" : ", "}<a key={key} href={`/${gameMeta.url}/dist/${key}/`} target="arp-dist">{name}</a></>
			))}
		</div>
	</VisualSection>;
}